//! 游戏完整性校验（基于版本 JSON 与本地文件，不触网）
//!
//! 校验范围：
//! - 客户端 jar（{game_dir}/{version}.jar）— SHA1
//! - 库文件（{root}/libraries/{path}）— SHA1
//! - 原生库分类器构件（{root}/libraries/{path}）— SHA1
//! - 资源索引（{root}/assets/indexes/{id}.json）— SHA1
//! - 资源文件（{root}/assets/objects/{xx}/{hash}）— 大小；`deep` 时追加 SHA1

use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;

use super::manager::GameManager;
use crate::app_context::AppContext;
use crate::download::models::{AssetObject, FileDownload, Library, VersionJsonManifest};
use crate::download::utils::{get_native_classifier, should_use_library, verify_file_sha1};
use crate::download::version::{asset_index_layout, asset_store_path};
use crate::{log_info, log_warn};

/// 单文件校验结果
#[derive(Debug, Clone, Serialize)]
pub struct FileCheck {
    /// 分类：client / library / native / index / asset
    pub category: String,
    /// 相对路径（用于展示）
    pub path: String,
    /// 状态：ok / missing / corrupt
    pub status: String,
    /// 期望 SHA1（版本 JSON 未提供时为 null）
    pub expected_sha1: Option<String>,
    /// 期望大小
    pub expected_size: Option<u64>,
    /// 实际大小（文件缺失时为 null）
    pub actual_size: Option<u64>,
}

/// 游戏完整性校验报告
#[derive(Debug, Clone, Serialize)]
pub struct GameValidation {
    /// 是否完整可启动（无缺失 / 无损坏）
    pub valid: bool,
    /// 目录是否为空（除 .wecraft 记录与 .smcl 图标外无任何文件，即未下载的"空壳"游戏）
    pub empty: bool,
    pub game_name: String,
    pub version_id: String,
    /// 已检查文件数 / 通过 / 缺失 / 损坏
    pub checked: usize,
    pub ok: usize,
    pub missing: usize,
    pub corrupt: usize,
    /// 失败项明细（仅缺失/损坏；资源上千条时避免撑爆载荷）
    pub failed: Vec<FileCheck>,
}

/// 校验指定游戏的完整性
///
/// - `deep=true` 时对资源文件也做 SHA1 校验（全量哈希，数千文件耗时较长）；
///   默认仅校验客户端 jar / 库文件 / 原生库 / 资源索引的 SHA1，
///   资源文件只做存在性 + 大小检查。
pub fn validate_game_integrity(
    ctx: &AppContext,
    manager: &GameManager,
    game_name: &str,
    deep: bool,
) -> Result<GameValidation, String> {
    let game = manager
        .get_game(game_name)
        .ok_or_else(|| format!("游戏不存在: {}", game_name))?;

    let game_dir = ctx.game_dir(&game.name);

    // 第 1 层：目录是否为空壳（除 .wecraft 记录与 .smcl 图标外无任何文件）→ 前端不显示
    // 优先于版本未知判断：空目录（手动创建/下载未开始）无 version_id，也必须识别为空壳
    if is_game_dir_empty(&game_dir) {
        log_info!("游戏 {} 目录为空壳，跳过常规校验", game_name);
        return Ok(GameValidation {
            valid: false,
            empty: true,
            game_name: game.name.clone(),
            version_id: game.version_id.clone(),
            checked: 0,
            ok: 0,
            missing: 0,
            corrupt: 0,
            failed: Vec::new(),
        });
    }

    let version_id = game.version_id.clone();
    if version_id.is_empty() {
        return Err(format!("游戏 {} 版本未知（未完成下载）", game_name));
    }

    // 第 2 层：版本 JSON 与客户端 jar 是否存在
    let version_json_path = ctx.version_json_in_dir(&game_dir, &version_id);
    if !version_json_path.is_file() {
        log_info!("游戏 {} 缺版本 JSON: {}", game_name, version_json_path.display());
        let jar_path = ctx.version_jar_in_dir(&game_dir, &version_id);
        let mut failed = vec![FileCheck {
            category: "version".to_string(),
            path: format!("{}.json", version_id),
            status: "missing".to_string(),
            expected_sha1: None,
            expected_size: None,
            actual_size: None,
        }];
        if !jar_path.is_file() {
            failed.push(FileCheck {
                category: "client".to_string(),
                path: format!("{}.jar", version_id),
                status: "missing".to_string(),
                expected_sha1: None,
                expected_size: None,
                actual_size: None,
            });
        }
        return Ok(GameValidation {
            valid: false,
            empty: false,
            game_name: game.name.clone(),
            version_id,
            checked: failed.len(),
            ok: 0,
            missing: failed.len(),
            corrupt: 0,
            failed,
        });
    }

    log_info!("校验游戏 {} 完整性 (deep={})", game_name, deep);
    let content =
        std::fs::read_to_string(&version_json_path).map_err(|e| format!("读取版本 JSON 失败: {}", e))?;
    let version_json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("解析版本 JSON 失败: {}", e))?;

    let manifest = parse_local_manifest(ctx, &version_json)?;

    let mut checked = 0usize;
    let mut ok = 0usize;
    let mut missing = 0usize;
    let mut corrupt = 0usize;
    let mut failed: Vec<FileCheck> = Vec::new();

    // 1. 客户端 jar（平放：{game_dir}/{version_id}.jar）
    if let Some(ref jar) = manifest.client_jar {
        check_file(
            "client",
            &format!("{version_id}.jar"),
            &ctx.version_jar_in_dir(&game_dir, &version_id),
            jar.sha1.as_deref(),
            jar.size,
            true,
            &mut checked,
            &mut ok,
            &mut missing,
            &mut corrupt,
            &mut failed,
        );
    } else if !ctx.version_jar_in_dir(&game_dir, &version_id).is_file() {
        // 版本 JSON 未声明 client 构件且 jar 缺失 → 按缺失计（json 不完整）
        checked += 1;
        missing += 1;
        failed.push(FileCheck {
            category: "client".to_string(),
            path: format!("{}.jar", version_id),
            status: "missing".to_string(),
            expected_sha1: None,
            expected_size: None,
            actual_size: None,
        });
    }

    // 2. 库文件（{root}/libraries/{path}，含原生库分类器构件）
    for lib in &manifest.libraries {
        check_file(
            "library",
            &lib.path,
            &ctx.libraries_dir().join(&lib.path),
            lib.sha1.as_deref(),
            lib.size,
            true,
            &mut checked,
            &mut ok,
            &mut missing,
            &mut corrupt,
            &mut failed,
        );
    }
    for native in &manifest.natives {
        check_file(
            "native",
            &native.path,
            &ctx.libraries_dir().join(&native.path),
            native.sha1.as_deref(),
            native.size,
            true,
            &mut checked,
            &mut ok,
            &mut missing,
            &mut corrupt,
            &mut failed,
        );
    }

    // 3. 资源索引（{root}/assets/indexes/{id}.json）
    if let Some(ref index) = manifest.asset_index {
        check_file(
            "index",
            &index.path,
            &ctx.assets_dir().join(&index.path),
            index.sha1.as_deref(),
            index.size,
            true,
            &mut checked,
            &mut ok,
            &mut missing,
            &mut corrupt,
            &mut failed,
        );
    }

    // 4. 资源文件（{root}/assets/objects/...，deep 时追加 SHA1）
    for asset in &manifest.assets {
        check_file(
            "asset",
            &asset.path,
            &ctx.assets_dir().join(&asset.path),
            asset.sha1.as_deref(),
            asset.size,
            deep,
            &mut checked,
            &mut ok,
            &mut missing,
            &mut corrupt,
            &mut failed,
        );
    }

    log_info!(
        "游戏 {} 校验完成: 检查 {} 项, 通过 {} 项, 缺失 {} 项, 损坏 {} 项",
        game_name,
        checked,
        ok,
        missing,
        corrupt
    );

    Ok(GameValidation {
        valid: missing == 0 && corrupt == 0,
        empty: false,
        game_name: game.name.clone(),
        version_id,
        checked,
        ok,
        missing,
        corrupt,
        failed,
    })
}

/// 判断游戏目录是否为"空壳"：除 `.wecraft_*` 记录文件与 `.smcl` 图标目录外无任何文件
pub fn is_game_dir_empty(game_dir: &Path) -> bool {
    let Ok(entries) = std::fs::read_dir(game_dir) else {
        return true;
    };
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with(".wecraft_") {
            continue;
        }
        if name == ".smcl" && entry.path().is_dir() {
            continue;
        }
        return false;
    }
    true
}

/// 单文件检查：存在性 + 大小 +（可选）SHA1
#[allow(clippy::too_many_arguments)]
fn check_file(
    category: &str,
    rel_path: &str,
    abs_path: &Path,
    expected_sha1: Option<&str>,
    expected_size: u64,
    verify_sha1: bool,
    checked: &mut usize,
    ok: &mut usize,
    missing: &mut usize,
    corrupt: &mut usize,
    failed: &mut Vec<FileCheck>,
) {
    *checked += 1;

    let actual_size = std::fs::metadata(abs_path).ok().filter(|m| m.is_file()).map(|m| m.len());
    let Some(actual_size) = actual_size else {
        *missing += 1;
        failed.push(FileCheck {
            category: category.to_string(),
            path: rel_path.to_string(),
            status: "missing".to_string(),
            expected_sha1: expected_sha1.map(String::from),
            expected_size: Some(expected_size),
            actual_size: None,
        });
        return;
    };

    let mut status = "ok".to_string();
    if verify_sha1 {
        if let Some(expected) = expected_sha1 {
            match verify_file_sha1(abs_path, expected) {
                Ok(true) => {}
                Ok(false) | Err(_) => status = "corrupt".to_string(),
            }
        }
    }
    if expected_size != 0 && actual_size != expected_size {
        status = "corrupt".to_string();
    }

    if status == "ok" {
        *ok += 1;
    } else {
        *corrupt += 1;
        failed.push(FileCheck {
            category: category.to_string(),
            path: rel_path.to_string(),
            status,
            expected_sha1: expected_sha1.map(String::from),
            expected_size: Some(expected_size),
            actual_size: Some(actual_size),
        });
    }
}

/// 基于版本 JSON 解析本地下载清单（不触网；资源文件来自本地索引）
fn parse_local_manifest(
    ctx: &AppContext,
    version_json: &serde_json::Value,
) -> Result<VersionJsonManifest, String> {
    let version_id = version_json["id"]
        .as_str()
        .ok_or("版本 JSON 缺少 id")?
        .to_string();

    let mut libraries = Vec::new();
    let mut natives = Vec::new();
    if let Some(libs) = version_json["libraries"].as_array() {
        for lib_json in libs {
            let library: Library = serde_json::from_value(lib_json.clone())
                .map_err(|e| format!("解析库失败: {}", e))?;
            if !should_use_library(&library) {
                continue;
            }
            if let Some(downloads) = &library.downloads {
                if let Some(artifact) = &downloads.artifact {
                    libraries.push(FileDownload {
                        url: String::new(),
                        path: artifact.path.clone(),
                        sha1: artifact.sha1.clone(),
                        size: artifact.size,
                        ..Default::default()
                    });
                }
                if let Some(classifiers) = &downloads.classifiers {
                    if let Some((classifier_key, _)) = get_native_classifier(&library) {
                        if let Some(native) = classifiers.get(&classifier_key) {
                            natives.push(FileDownload {
                                url: String::new(),
                                path: native.path.clone(),
                                sha1: native.sha1.clone(),
                                size: native.size,
                                ..Default::default()
                            });
                        }
                    }
                }
            }
        }
    }

    let mut assets = Vec::new();
    let mut asset_index = None;
    if version_json["assetIndex"].is_object() {
        let index_id = version_json["assetIndex"]["id"]
            .as_str()
            .unwrap_or("legacy")
            .to_string();
        let layout = asset_index_layout(&index_id);

        asset_index = Some(FileDownload {
            url: String::new(),
            sha1: version_json["assetIndex"]["sha1"].as_str().map(String::from),
            size: version_json["assetIndex"]["size"].as_u64().unwrap_or(0),
            path: format!("indexes/{}.json", index_id),
            ..Default::default()
        });

        // 资源对象枚举自本地索引文件（下载时已落盘），缺失时跳过资源明细
        let index_path = ctx.assets_dir().join("indexes").join(format!("{}.json", index_id));
        match load_local_index(&index_path) {
            Ok(objects) => {
                for (virtual_path, obj) in objects {
                    let hash = &obj.hash;
                    assets.push(FileDownload {
                        url: String::new(),
                        path: asset_store_path(layout, &virtual_path, hash),
                        sha1: Some(hash.clone()),
                        size: obj.size,
                        ..Default::default()
                    });
                }
            }
            Err(e) => {
                log_warn!("{}，资源文件明细跳过", e);
            }
        }
    }

    let client_jar = version_json["downloads"]["client"].as_object().map(|client| FileDownload {
        url: String::new(),
        path: format!("{}.jar", version_id),
        sha1: client["sha1"].as_str().map(String::from),
        size: client["size"].as_u64().unwrap_or(0),
        ..Default::default()
    });

    Ok(VersionJsonManifest {
        version_id,
        client_jar,
        libraries,
        assets,
        natives,
        asset_index,
    })
}

/// 读取本地资源索引文件（objects 映射），等价于远端 fetch_asset_objects 的本地版
pub(crate) fn load_local_index(index_path: &Path) -> Result<HashMap<String, AssetObject>, String> {
    if !index_path.is_file() {
        return Err(format!("资源索引缺失: {}", index_path.display()));
    }
    let content = std::fs::read_to_string(index_path)
        .map_err(|e| format!("读取资源索引失败: {}", e))?;

    #[derive(serde::Deserialize)]
    struct LocalAssetIndex {
        objects: HashMap<String, AssetObject>,
    }

    let index: LocalAssetIndex =
        serde_json::from_str(&content).map_err(|e| format!("解析资源索引失败: {}", e))?;
    log_info!("读取本地资源索引 {} 个对象: {}", index.objects.len(), index_path.display());
    Ok(index.objects)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modloader::ModLoaderType;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU64, Ordering};

    fn temp_dir(tag: &str) -> PathBuf {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir()
            .join(format!("wecraft-validator-{}-{}-{}", tag, std::process::id(), n));
        let _ = std::fs::remove_dir_all(&dir);
        dir
    }

    fn context(tag: &str) -> (AppContext, GameManager) {
        let dir = temp_dir(tag);
        let ctx = AppContext::new(dir.join("work"), dir.join("games"));
        let gm = GameManager::new(ctx.clone());
        ctx.ensure_dirs().unwrap();
        (ctx, gm)
    }

    const SHA1_HELLO: &str = "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed";

    /// 构造最小可用版本 JSON（client + 1 个库 + 资源索引 + 1 个资源）
    fn sample_version_json() -> serde_json::Value {
        serde_json::json!({
            "id": "1.20.4",
            "downloads": {
                "client": { "sha1": SHA1_HELLO, "size": 11, "url": "https://example.com/client.jar" }
            },
            "libraries": [
                {
                    "name": "org.lwjgl:lwjgl:3.3.2",
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2.jar",
                            "sha1": SHA1_HELLO,
                            "size": 11,
                            "url": "https://example.com/lwjgl.jar"
                        }
                    }
                }
            ],
            "assetIndex": {
                "id": "1.20"
            }
        })
    }

    fn write_hello(dir: &Path, rel: &str) {
        let path = dir.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, b"hello world").unwrap();
    }

    fn setup_intact(tag: &str) -> (AppContext, GameManager) {
        let (ctx, gm) = context(tag);
        gm.create_game("vg1", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        let game_dir = ctx.game_dir("vg1");

        // 版本 JSON（含资源索引描述）+ client jar 平放
        std::fs::write(game_dir.join("1.20.4.json"), sample_version_json().to_string()).unwrap();
        write_hello(&game_dir, "1.20.4.jar");
        write_hello(&ctx.libraries_dir(), "org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2.jar");
        // 资源索引内容引用的对象需与磁盘一致
        let index = serde_json::json!({
            "objects": {
                "minecraft/icon.png": {
                    "hash": SHA1_HELLO,
                    "size": 11
                }
            }
        });
        let index_path = ctx.assets_dir().join("indexes/1.20.json");
        if let Some(parent) = index_path.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        std::fs::write(&index_path, index.to_string()).unwrap();
        write_hello(&ctx.assets_dir(), "objects/2a/2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");

        (ctx, gm)
    }

    #[test]
    fn validate_intact_game() {
        let (ctx, gm) = setup_intact("intact");
        let report = validate_game_integrity(&ctx, &gm, "vg1", false).unwrap();
        assert!(report.valid, "完整游戏应通过校验: {:?}", report.failed);
        assert_eq!(report.checked, 4); // client + library + index + asset
        assert_eq!(report.ok, 4);
        assert_eq!(report.missing, 0);
        assert_eq!(report.corrupt, 0);
        assert!(report.failed.is_empty());
    }

    #[test]
    fn validate_missing_client_jar() {
        let (ctx, gm) = setup_intact("missing-jar");
        std::fs::remove_file(ctx.game_dir("vg1").join("1.20.4.jar")).unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg1", false).unwrap();
        assert!(!report.valid);
        assert_eq!(report.missing, 1);
        assert_eq!(report.failed[0].category, "client");
        assert_eq!(report.failed[0].status, "missing");
    }

    #[test]
    fn validate_corrupt_library() {
        let (ctx, gm) = setup_intact("corrupt-lib");
        std::fs::write(
            ctx.libraries_dir().join("org/lwjgl/lwjgl/3.3.2/lwjgl-3.3.2.jar"),
            b"tampered",
        )
        .unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg1", false).unwrap();
        assert!(!report.valid);
        assert_eq!(report.corrupt, 1);
        assert_eq!(report.failed[0].category, "library");
        assert_eq!(report.failed[0].status, "corrupt");
        assert_eq!(report.failed[0].actual_size, Some(8));
    }

    #[test]
    fn validate_missing_index_skips_assets() {
        let (ctx, gm) = setup_intact("missing-index");
        std::fs::remove_file(ctx.assets_dir().join("indexes/1.20.json")).unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg1", false).unwrap();
        assert!(!report.valid);
        assert_eq!(report.missing, 1);
        assert_eq!(report.failed[0].category, "index");
        // 索引缺失 → 资源明细无法枚举，checked 不含 asset
        assert_eq!(report.checked, 3);
    }

    #[test]
    fn validate_unknown_game() {
        let (ctx, gm) = context("unknown");
        let err = validate_game_integrity(&ctx, &gm, "no-such-game", false).unwrap_err();
        assert!(err.contains("不存在"));
    }

    #[test]
    fn validate_missing_version_json() {
        let (ctx, gm) = context("no-json");
        gm.create_game("vg2", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        // 目录非空（有残留内容）但缺 version.json + jar → 返回明细而不是 Err
        std::fs::write(ctx.game_dir("vg2").join("1.20.4.jar.part"), b"partial").unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg2", false).unwrap();
        assert!(!report.valid);
        assert!(!report.empty);
        assert_eq!(report.missing, 2);
        assert_eq!(report.failed[0].category, "version");
        assert_eq!(report.failed[1].category, "client");
    }

    #[test]
    fn validate_empty_dir_flags_empty() {
        let (ctx, gm) = context("empty-dir");
        gm.create_game("vg3", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        // 仅记录文件 → 空壳
        let report = validate_game_integrity(&ctx, &gm, "vg3", false).unwrap();
        assert!(!report.valid);
        assert!(report.empty);
        assert_eq!(report.checked, 0);
        assert!(report.failed.is_empty());

        // 放一个 .smcl 图标目录 → 仍视为空壳（.smcl 是我们写入的资产）
        std::fs::create_dir_all(ctx.game_dir("vg3").join(".smcl/assets/icons")).unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg3", false).unwrap();
        assert!(!report.valid);
        assert!(report.empty);

        // 出现真实内容（如 version json）→ 不再空壳
        std::fs::write(ctx.game_dir("vg3").join("1.20.4.json"), r#"{"id": "1.20.4"}"#).unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg3", false).unwrap();
        assert!(!report.valid);
        assert!(!report.empty);
    }

    #[test]
    fn validate_manual_empty_dir_without_record_flags_empty() {
        let (ctx, gm) = context("manual-empty-dir");
        // 模拟手动创建的空白目录：无记录文件、无 version_id
        std::fs::create_dir_all(ctx.game_dir("test")).unwrap();
        let report = validate_game_integrity(&ctx, &gm, "test", false).unwrap();
        assert!(report.empty, "无 version_id 的空目录必须识别为空壳");
        assert!(!report.valid);
    }

    #[test]
    fn deep_mode_also_checks_asset_sha1() {
        let (ctx, gm) = setup_intact("deep");
        // 非 deep：大小一致即通过；deep：内容不符 → SHA1 失败
        std::fs::write(
            ctx.assets_dir().join("objects/2a/2aae6c35c94fcfb415dbe95f408b9ce91ee846ed"),
            b"hello worlD", // 12 字节，大小一致但内容不同
        )
        .unwrap();
        let report = validate_game_integrity(&ctx, &gm, "vg1", false).unwrap();
        assert!(report.valid, "非 deep 模式仅检查大小");

        let report = validate_game_integrity(&ctx, &gm, "vg1", true).unwrap();
        assert!(!report.valid);
        assert_eq!(report.corrupt, 1);
        assert_eq!(report.failed[0].category, "asset");
    }
}