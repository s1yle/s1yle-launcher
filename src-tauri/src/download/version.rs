use crate::download::manager::DownloadManager;
use crate::download::models::*;
use crate::download::utils::{get_native_classifier, should_use_library};
use crate::log_info;
use serde::Deserialize;
use std::collections::HashMap;
use tauri::State;

const VERSION_MANIFEST_URL: &str =
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

#[tauri::command]
pub async fn get_version_manifest() -> Result<VersionManifest, String> {
    log_info!("正在获取游戏版本列表...");

    let response = reqwest::get(VERSION_MANIFEST_URL)
        .await
        .map_err(|e| format!("获取版本列表失败: {}", e))?;

    let manifest: VersionManifest = response
        .json()
        .await
        .map_err(|e| format!("解析版本列表失败: {}", e))?;

    log_info!("成功获取 {} 个游戏版本", manifest.versions.len());
    Ok(manifest)
}

#[tauri::command]
pub async fn get_version_detail(version_id: String) -> Result<serde_json::Value, String> {
    log_info!("正在获取版本详情: {}", version_id);

    let manifest = get_version_manifest().await?;
    let version = manifest
        .versions
        .iter()
        .find(|v| v.id == version_id)
        .ok_or_else(|| format!("未找到版本: {}", version_id))?;

    let response = reqwest::get(&version.url)
        .await
        .map_err(|e| format!("获取版本详情失败: {}", e))?;

    let detail: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析版本详情失败: {}", e))?;

    Ok(detail)
}

async fn parse_version_downloads(
    version_json: &serde_json::Value,
) -> Result<VersionDownloadManifest, String> {
    let version_id = version_json["id"]
        .as_str()
        .ok_or("Missing version id")?
        .to_string();

    log_info!("解析版本 {} 的下载清单", version_id);

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
                        sha1: artifact.sha1.clone(),
                        size: artifact.size,
                        path: artifact.path.clone(),
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
        let index_id = version_json["assetIndex"]["id"]
            .as_str()
            .unwrap_or("pre-1.6");

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
                    let is_legacy = version_json["assets"].as_str() == Some("pre-1.6")
                        || version_json["assets"].is_null()
                        || version_json["assets"].as_str().is_none();

                    for (virtual_path, obj) in asset_objects {
                        let hash = &obj.hash;
                        let path = if is_legacy {
                            format!("virtual/legacy/{}", virtual_path)
                        } else {
                            format!("objects/{}/{}", &hash[..2], hash)
                        };
                        assets.push(FileDownload {
                            url: format!(
                                "https://resources.download.minecraft.net/{}/{}",
                                &hash[..2],
                                hash
                            ),
                            sha1: Some(hash.clone()),
                            size: obj.size,
                            path,
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

    Ok(VersionDownloadManifest {
        version_id,
        client_jar,
        libraries,
        assets,
        natives,
        asset_index,
    })
}

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

#[tauri::command]
pub async fn get_version_download_manifest(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<VersionDownloadManifest, String> {
    log_info!("正在获取版本下载清单: {}", version_id);

    {
        let cache = download_manager.manifest_cache.lock().unwrap();
        if let Some(cached) = cache.get(&version_id) {
            log_info!("使用缓存的版本下载清单: {}", version_id);
            return Ok(cached.clone());
        }
    }

    let version_json = get_version_detail(version_id.clone()).await?;
    let manifest = parse_version_downloads(&version_json).await?;

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
