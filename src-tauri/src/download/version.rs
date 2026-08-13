use crate::download::manager::DownloadManager;
use crate::download::models::*;
use crate::download::utils::{get_native_classifier, should_use_library, verify_file_sha1};
use crate::{log_info};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::State;

/// Mojang 版本清单 API URL
pub const VERSION_MANIFEST_URL: &str =
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

/// 资源索引布局（由索引名称判定，对照 Minecraft Wiki 索引名称表）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetIndexLayout {
    /// pre-1.6（1.6.1 快照 13w23b 及以前）：兼容路径为 assets/virtual/pre-1.6/
    Pre16,
    /// legacy（13w24a ~ 13w48b）：兼容路径为 assets/virtual/legacy/
    Legacy,
    /// 现代布局（1.6.1 正式版起，含 22w42a 起的数字索引名 1..33）：按哈希存放
    Normal,
}

/// 依据资源索引名称判定布局。
///
/// 索引名称历史：22w42a 之前为版本号字符串（如 1.7.4 / 14w25a / 1.13）；
/// 自 22w42a 起改为从 1 开始单增的数字。仅 pre-1.6 与 legacy 为特殊旧布局。
pub fn asset_index_layout(index_id: &str) -> AssetIndexLayout {
    match index_id {
        "pre-1.6" => AssetIndexLayout::Pre16,
        "legacy" => AssetIndexLayout::Legacy,
        _ => AssetIndexLayout::Normal,
    }
}

/// 计算散列资源文件的本地存放相对路径（相对 {root}/assets/）。
///
/// 现代布局按哈希存放于 objects/{xx}/{hash}；pre-1.6 与 legacy 为兼容旧版本，
/// 按资源路径存放于 virtual/{pre-1.6|legacy}/{路径}。
fn asset_store_path(layout: AssetIndexLayout, virtual_path: &str, hash: &str) -> String {
    match layout {
        AssetIndexLayout::Pre16 => format!("virtual/pre-1.6/{}", virtual_path),
        AssetIndexLayout::Legacy => format!("virtual/legacy/{}", virtual_path),
        AssetIndexLayout::Normal => format!("objects/{}/{}", &hash[..2], hash),
    }
}

/// 从 Mojang 清单获取指定版本的原始版本 JSON（内存版，供预览/解析使用）
pub async fn fetch_version_value(version_id: &str) -> Result<serde_json::Value, String> {
    let response = reqwest::get(VERSION_MANIFEST_URL)
        .await
        .map_err(|e| format!("获取版本列表失败: {}", e))?;

    let manifest: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析版本列表失败: {}", e))?;

    let url = manifest["versions"]
        .as_array()
        .and_then(|versions| {
            versions
                .iter()
                .find(|v| v["id"].as_str() == Some(version_id))
        })
        .and_then(|v| v["url"].as_str())
        .ok_or_else(|| format!("未找到版本: {}", version_id))?
        .to_string();

    let detail_response = reqwest::get(&url)
        .await
        .map_err(|e| format!("获取版本详情失败: {}", e))?;

    detail_response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("解析版本详情失败: {}", e))
}

/// 从 Mojang 清单下载指定版本的原始版本 JSON 到目标路径，返回写入的文件路径
pub async fn download_version_json(
    version_id: &str,
    save_path: &Path,
) -> Result<PathBuf, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    let manifest: serde_json::Value = client
        .get(VERSION_MANIFEST_URL)
        .send()
        .await
        .map_err(|e| format!("获取版本列表失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("解析版本列表失败: {}", e))?;

    let version = manifest["versions"]
        .as_array()
        .and_then(|versions| versions.iter().find(|v| v["id"].as_str() == Some(version_id)))
        .ok_or_else(|| format!("未找到版本: {}", version_id))?;

    let url = version["url"]
        .as_str()
        .ok_or_else(|| format!("版本 {} 缺少下载地址", version_id))?
        .to_string();

    if let Some(parent) = save_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    // 先写入原始字节以便复用统一的 SHA1 校验入口（SHA1 是对原始文件计算的）
    let bytes = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("获取版本详情失败: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("读取版本详情失败: {}", e))?;

    std::fs::write(save_path, &bytes).map_err(|e| format!("写入版本 JSON 失败: {}", e))?;

    if let Some(sha1) = version["sha1"].as_str() {
        if !verify_file_sha1(save_path, sha1)? {
            return Err(format!("版本 JSON SHA1 校验失败: {}", version_id));
        }
    }

    // 校验通过后，解析为结构化 JSON 对象（未知字段经 extra 原样保留）再以美观格式覆盖写入
    let version_json: VersionJson = serde_json::from_slice(&bytes)
        .map_err(|e| format!("解析版本 JSON 失败: {}", e))?;

    let pretty = serde_json::to_string_pretty(&version_json)
        .map_err(|e| format!("序列化版本 JSON 失败: {}", e))?;
    std::fs::write(save_path, pretty).map_err(|e| format!("写入版本 JSON 失败: {}", e))?;

    log_info!("版本 JSON 已下载: {}", save_path.display());
    Ok(save_path.to_path_buf())
}

/// 解析版本 JSON，提取下载清单（客户端、库、资源、原生库等）
pub async fn parse_version_json(
    version_json: &serde_json::Value,
) -> Result<VersionJsonManifest, String> {
    let version_id = version_json["id"]
        .as_str()
        .ok_or("Missing version id")?
        .to_string();

    log_info!("解析版本 {} 的下载清单", version_id);


    // 获取 library 和 native 文件
    let mut libraries = Vec::new();
    let mut natives = Vec::new();
    if let Some(libraries_json) = version_json["libraries"].as_array() {
        for lib_json in libraries_json {
            let library: Library = serde_json::from_value(lib_json.clone())
                .map_err(|e| format!("解析库失败: {}", e))?;

            if !should_use_library(&library) {
                continue;
            }

            if let Some(downloads) = &library.downloads {
                if let Some(artifact) = &downloads.artifact {
                    libraries.push(FileDownload {
                        url: artifact.url.clone(),
                        path: artifact.path.clone(),
                        sha1: artifact.sha1.clone(),
                        size: artifact.size,
                    });
                }

                if let Some(ref classifiers) = downloads.classifiers {
                    if let Some((classifier_key, _)) = get_native_classifier(&library) {
                        if let Some(native_artifact) = classifiers.get(&classifier_key) {
                            natives.push(FileDownload {
                                url: native_artifact.url.clone(),
                                sha1: native_artifact.sha1.clone(),
                                size: native_artifact.size,
                                path: native_artifact.path.clone(),
                            });
                        }
                    }
                }
            }
        }
    }

    log_info!(
        "解析到 {} 个库文件, {} 个原生库",
        libraries.len(),
        natives.len()
    );

    let mut assets = Vec::new();
    let mut asset_index: Option<FileDownload> = None;

    if version_json["assetIndex"].is_object() {
        // 索引名称缺失时按 legacy 处理（与 normal 同为哈希布局，下载路径安全）
        let index_id = version_json["assetIndex"]["id"]
            .as_str()
            .unwrap_or("legacy");
        let layout = asset_index_layout(index_id);

        asset_index = Some(FileDownload {
            url: version_json["assetIndex"]["url"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            sha1: version_json["assetIndex"]["sha1"]
                .as_str()
                .map(String::from),
            size: version_json["assetIndex"]["size"].as_u64().unwrap_or(0),
            path: format!("indexes/{}.json", index_id),
        });

        let url = version_json["assetIndex"]["url"].as_str().unwrap_or("");
        if !url.is_empty() {
            match fetch_asset_objects(url).await {
                Ok(asset_objects) => {
                    for (virtual_path, obj) in asset_objects {
                        let hash = &obj.hash;
                        assets.push(FileDownload {
                            url: format!(
                                "https://resources.download.minecraft.net/{}/{}",
                                &hash[..2],
                                hash
                            ),
                            sha1: Some(hash.clone()),
                            size: obj.size,
                            path: asset_store_path(layout, &virtual_path, hash),
                        });
                    }
                }
                Err(e) => {
                    log_info!("获取资源对象失败: {}", e);
                }
            }
        }
    }

    log_info!("解析到 {} 个资源文件", assets.len());

    let mut client_jar = None;
    if let Some(downloads) = version_json["downloads"].as_object() {
        if let Some(client) = downloads.get("client") {
            client_jar = Some(FileDownload {
                url: client["url"].as_str().unwrap_or("").to_string(),
                sha1: client["sha1"].as_str().map(String::from),
                size: client["size"].as_u64().unwrap_or(0),
                path: format!("versions/{}/{}.jar", version_id, version_id),
            });
        }
    }

    Ok(VersionJsonManifest {
        version_id,
        client_jar,
        libraries,
        assets,
        natives,
        asset_index,
    })
}

/// 从 Mojang API 获取资源索引中的对象列表
async fn fetch_asset_objects(url: &str) -> Result<HashMap<String, AssetObject>, String> {
    if url.is_empty() {
        return Ok(HashMap::new());
    }

    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("获取资源索引失败: {}", e))?;

    #[derive(Deserialize)]
    struct AssetIndexResponse {
        objects: HashMap<String, AssetObject>,
    }

    let index: AssetIndexResponse = response
        .json()
        .await
        .map_err(|e| format!("解析资源索引失败: {}", e))?;

    Ok(index.objects)
}

/// 获取版本的下载清单（带缓存），返回库文件、资源文件等列表
#[tauri::command]
pub async fn get_version_download_manifest(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<VersionJsonManifest, String> {
    log_info!("正在获取版本下载清单: {}", version_id);

    {
        let cache = download_manager.manifest_cache.lock().unwrap();
        if let Some(cached) = cache.get(&version_id) {
            log_info!("使用缓存的版本下载清单: {}", version_id);
            return Ok(cached.clone());
        }
    }

    let version_json = fetch_version_value(&version_id).await?;
    let manifest = parse_version_json(&version_json).await?;

    {
        let mut cache = download_manager.manifest_cache.lock().unwrap();
        cache.insert(version_id.clone(), manifest.clone());
    }

    log_info!(
        "下载清单解析完成: {} 个库, {} 个原生库, {} 个资源",
        manifest.libraries.len(),
        manifest.natives.len(),
        manifest.assets.len()
    );

    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::download::models::{ArgumentItem, VersionJson};

    /// 构造一个覆盖文档中全部键的 version.json 示例
    fn sample_version_json() -> &'static str {
        r#"{
  "arguments": {
    "game": [
      "--username",
      {
        "rules": [{"action": "allow", "features": {"is_demo_user": false}}],
        "value": "demo"
      }
    ],
    "jvm": [
      "-Xmx${resolution_width}x${resolution_height}",
      {
        "rules": [{"action": "allow", "os": {"name": "osx"}}],
        "value": ["-XstartOnFirstThread"]
      }
    ],
    "default-user-jvm": [
      {
        "rules": [{"action": "allow", "os": {"name": "windows", "versionRange": {"max": "10", "min": "7"}}}],
        "value": "-XX:+UseG1GC"
      }
    ]
  },
  "assetIndex": {
    "id": "1.20",
    "size": 692628,
    "totalSize": 600739997,
    "url": "https://example.com/indexes/1.20.json",
    "sha1": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "assets": "1.20",
  "complianceLevel": 1,
  "downloads": {
    "client": {"sha1": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "size": 27126006, "url": "https://example.com/client.jar"},
    "server": {"sha1": "cccccccccccccccccccccccccccccccccccccccc", "size": 51232076, "url": "https://example.com/server.jar"}
  },
  "id": "1.20.4",
  "inheritsFrom": "",
  "javaVersion": {"component": "java-runtime-alpha", "majorVersion": 17},
  "minimumLauncherVersion": 21,
  "libraries": [
    {
      "downloads": {
        "artifact": {
          "path": "ca/weblite/java-objc-bridge/1.1/java-objc-bridge-1.1.jar",
          "sha1": "dddddddddddddddddddddddddddddddddddddddd",
          "size": 55139,
          "url": "https://example.com/java-objc-bridge-1.1.jar"
        }
      },
      "name": "ca.weblite:java-objc-bridge:1.1",
      "rules": [{"action": "allow", "os": {"name": "osx"}}]
    },
    {
      "downloads": {
        "artifact": {
          "path": "org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2.jar",
          "sha1": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "size": 161624,
          "url": "https://example.com/lwjgl-3.3.2.jar"
        },
        "classifiers": {
          "natives-linux": {
            "path": "org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2-natives-linux.jar",
            "sha1": "ffffffffffffffffffffffffffffffffffffffff",
            "size": 2812375,
            "url": "https://example.com/lwjgl-3.3.2-natives-linux.jar"
          },
          "natives-osx": {
            "path": "org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2-natives-osx.jar",
            "sha1": "1111111111111111111111111111111111111111",
            "size": 7103118,
            "url": "https://example.com/lwjgl-3.3.2-natives-osx.jar"
          }
        }
      },
      "name": "org.lwjgl:lwjgl:3.3.2",
      "natives": {"linux": "natives-linux", "osx": "natives-osx"}
    }
  ],
  "logging": {
    "client": {
      "argument": "-Dlog4j.configurationFile=${path}",
      "file": {
        "id": "client-1.20.4.xml",
        "sha1": "2222222222222222222222222222222222222222",
        "size": 2244,
        "url": "https://example.com/log4j2.xml"
      },
      "type": "log4j2"
    }
  },
  "mainClass": "net.minecraft.client.main.Main",
  "releaseTime": "2023-12-07T13:19:11+00:00",
  "time": "2023-12-07T13:19:21+00:00",
  "type": "release"
}"#
    }

    #[test]
    fn version_json_parse_all_keys() {
        let parsed: VersionJson = serde_json::from_str(sample_version_json()).expect("解析失败");
        assert_eq!(parsed.id, "1.20.4");
        assert_eq!(parsed.type_.as_deref(), Some("release"));
        assert_eq!(
            parsed.main_class.as_deref(),
            Some("net.minecraft.client.main.Main")
        );
        assert_eq!(parsed.release_time.as_deref(), Some("2023-12-07T13:19:11+00:00"));
        assert_eq!(parsed.assets.as_deref(), Some("1.20"));

        let asset_index = parsed.asset_index.expect("assetIndex 缺失");
        assert_eq!(asset_index.id, "1.20");
        assert_eq!(asset_index.total_size, 600_739_997);

        let downloads = parsed.downloads.expect("downloads 缺失");
        assert_eq!(downloads.client.as_ref().unwrap().size, 27_126_006);
        assert_eq!(downloads.server.as_ref().unwrap().url, "https://example.com/server.jar");

        let args = parsed.arguments.expect("arguments 缺失");
        assert_eq!(args.jvm.len(), 2);
        assert!(matches!(args.jvm[1], ArgumentItem::Rules(_)));
        assert!(matches!(args.game[0], ArgumentItem::String(_)));

        let default_user_jvm = args.default_user_jvm.as_ref().expect("default-user-jvm 缺失");
        assert_eq!(default_user_jvm.len(), 1);
        if let ArgumentItem::Rules(rule_arg) = &default_user_jvm[0] {
            let os = rule_arg.rules[0].os.as_ref().expect("os 规则缺失");
            let range = os.version_range.as_ref().expect("versionRange 缺失");
            assert_eq!(range.max.as_deref(), Some("10"));
            assert_eq!(range.min.as_deref(), Some("7"));
        } else {
            panic!("default-user-jvm 项应为带规则的复合标签");
        }

        let java = parsed.java_version.expect("javaVersion 缺失");
        assert_eq!(java.major_version, 17);
        assert_eq!(java.component.as_deref(), Some("java-runtime-alpha"));

        // 显式声明键
        assert_eq!(parsed.compliance_level, Some(1));
        assert_eq!(parsed.minimum_launcher_version, Some(21));

        // 未知字段经 extra 保留
        assert_eq!(parsed.extra.get("inheritsFrom").and_then(|v| v.as_str()), Some(""));
    }

    #[test]
    fn version_json_roundtrip_pretty() {
        let parsed: VersionJson = serde_json::from_str(sample_version_json()).expect("解析失败");
        let pretty = serde_json::to_string_pretty(&parsed).expect("序列化失败");
        assert!(pretty.contains('\n'), "应使用美观格式（多行）");
        assert!(pretty.contains("  \"id\": \"1.20.4\""), "应使用 2 空格缩进");

        let reparsed: VersionJson = serde_json::from_str(&pretty).expect("重解析失败");
        assert_eq!(parsed.id, reparsed.id);
        assert_eq!(parsed.libraries.len(), reparsed.libraries.len());
        assert_eq!(
            parsed.libraries[1].natives.as_ref().unwrap().len(),
            reparsed.libraries[1].natives.as_ref().unwrap().len()
        );
        assert_eq!(
            parsed.extra.len(),
            reparsed.extra.len(),
            "extra 字段应在 round-trip 后保留"
        );
    }

    #[test]
    fn asset_index_layout_matches_wiki_table() {
        // pre-1.6：13w23b 及以前
        assert_eq!(asset_index_layout("pre-1.6"), AssetIndexLayout::Pre16);
        // legacy：13w24a ~ 13w48b
        assert_eq!(asset_index_layout("legacy"), AssetIndexLayout::Legacy);
        // 22w42a 前的版本号索引名
        for name in [
            "1.7.3", "1.7.4", "1.7.10", "14w25a", "14w31a", "1.8", "1.9", "1.10", "1.11",
            "1.12", "1.13", "1.14", "1.15", "1.16", "1.17", "1.18", "1.19",
            "1.19_deep_dark_side_snapshot",
        ] {
            assert_eq!(asset_index_layout(name), AssetIndexLayout::Normal, "{}", name);
        }
        // 22w42a 起的数字索引名
        for n in 1..=33 {
            assert_eq!(
                asset_index_layout(&n.to_string()),
                AssetIndexLayout::Normal,
                "索引名 {}",
                n
            );
        }
        // 未知名称同样回退到现代布局
        assert_eq!(asset_index_layout("9999"), AssetIndexLayout::Normal);
        assert_eq!(asset_index_layout(""), AssetIndexLayout::Normal);
    }

    #[test]
    fn asset_store_path_matches_wiki_layouts() {
        let hash = "0123456789abcdef0123456789abcdef01234567";
        // 现代布局：按哈希存放 objects/{前两位}/{哈希}
        assert_eq!(
            asset_store_path(AssetIndexLayout::Normal, "minecraft/icon.png", hash),
            "objects/01/0123456789abcdef0123456789abcdef01234567"
        );
        // legacy：按资源路径存放于 virtual/legacy/
        assert_eq!(
            asset_store_path(AssetIndexLayout::Legacy, "minecraft/icon.png", hash),
            "virtual/legacy/minecraft/icon.png"
        );
        // pre-1.6：按资源路径存放于 virtual/pre-1.6/
        assert_eq!(
            asset_store_path(AssetIndexLayout::Pre16, "minecraft/icon.png", hash),
            "virtual/pre-1.6/minecraft/icon.png"
        );
    }
}
