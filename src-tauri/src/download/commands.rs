use crate::app_context::AppContext;
use crate::download::downloader::{ByteProgressCb, DownloadProgressTracker};
use crate::download::manager::DownloadManager;
use crate::download::models::DownloadTask;
use crate::download::{
    DownloadOptions, DownloadResult, VERSION_MANIFEST_URL, VersionManifest,
    extract_jar, fetch_version_value, parse_version_json,
};
use crate::{GameManager, log_info};
use std::fs;
use std::sync::Arc;
use std::time::Instant;
use tauri::{Emitter, State};

/// 获取所有下载任务列表
#[tauri::command]
pub fn get_download_tasks(download_manager: State<'_, DownloadManager>) -> Vec<DownloadTask> {
    download_manager.get_all_tasks()
}

/// 取消指定 ID 的下载任务（删除已下载的文件）
#[tauri::command]
pub fn cancel_download(
    task_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("取消下载任务: {}", task_id);

    if let Some(task) = download_manager.get_task(&task_id) {
        if fs::remove_file(&task.path).is_ok() {
            download_manager.remove_task(&task_id);
            return Ok(format!("任务 {} 已取消", task_id));
        }
    }

    Err(format!("任务 {} 不存在", task_id))
}

/// 取消指定版本的整个部署流程（触发取消令牌，下载链路各环节立即中断）
#[tauri::command]
pub fn cancel_version_download(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("请求取消版本下载: {}", version_id);

    let tokens = download_manager.cancellations.lock().unwrap();
    if let Some(token) = tokens.get(&version_id) {
        token.cancel();
        return Ok(format!("已请求取消版本 {} 的下载", version_id));
    }

    Err(format!("版本 {} 没有进行中的下载", version_id))
}

/// 清理所有已完成状态的下载任务
#[tauri::command]
pub fn clear_completed_tasks(
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("清理已完成任务");
    let tasks = download_manager.get_all_tasks();
    let mut removed = 0;

    for task in tasks {
        if task.status == "completed" {
            download_manager.remove_task(&task.id);
            removed += 1;
        }
    }

    Ok(format!("已清理 {} 个已完成任务", removed))
}

/// 获取 Minecraft 版本列表（从 Mojang API）
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

/// 获取指定版本的详细信息（原始 JSON，注册为 Tauri 命令）
#[tauri::command]
pub async fn get_version_detail(version_id: String) -> Result<serde_json::Value, String> {
    fetch_version_value(&version_id).await
}

/// 下载并部署版本到目标游戏（包含下载、部署、配置写入全流程）
#[tauri::command]
pub async fn download(
    options: DownloadOptions,
    game_manager: State<'_, GameManager>,
    download_manager: State<'_, DownloadManager>,
    app_context: State<'_, AppContext>,
    app_handle: tauri::AppHandle,
) -> Result<DownloadResult, String> {
    log_info!("========== 开始下载并部署 ==========");
    log_info!(
        "目标: {} | 版本: {} | 加载器: {:?}",
        options.game_name,
        options.version_id,
        options.loader_type
    );

    let game_name = options.game_name.clone();
    let version_id = options.version_id.clone();
    let dm = download_manager.inner().clone();
    let cancel_token = dm.register_cancellation(&version_id);

    let result: Result<DownloadResult, String> = async {
let game_path = game_manager
        .create_game(
            &options.game_name,
            &options.version_id,
            options.loader_type.clone(),
            options.loader_version.clone(),
            None,
        )
        .map_err(|e| format!("创建游戏失败: {}", e))?
        .path;
    let game_dir = std::path::PathBuf::from(&game_path);

    // 下载并解析 <version>.json 文件，最终获取为 VersionJsonManifest
    let version_json_path = app_context.version_json_in_dir(&game_dir, &options.version_id);
    super::version::download_version_json(&options.version_id, &version_json_path).await?;

    let version_detail: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(&version_json_path)
            .map_err(|e| format!("读取版本 JSON 失败: {}", e))?,
    )
    .map_err(|e| format!("解析版本 JSON 失败: {}", e))?;
    let manifest = parse_version_json(&version_detail).await?;

    let total_libraries = manifest.libraries.len();
    let total_assets = manifest.assets.len();
    let total_natives = manifest.natives.len();
    let has_client_jar = manifest.client_jar.is_some();
    let has_log_config = manifest.log_config.is_some();
    let mut completed = 0usize;
    let total_files = total_libraries
        + total_assets
        + total_natives
        + if has_client_jar { 1 } else { 0 }
        + if has_log_config { 1 } else { 0 };

    let total_bytes: u64 = manifest
        .libraries
        .iter()
        .chain(manifest.assets.iter())
        .chain(manifest.natives.iter())
        .map(|f| f.size)
        .sum::<u64>()
        + manifest.client_jar.as_ref().map_or(0, |f| f.size)
        + manifest.log_config.as_ref().map_or(0, |f| f.size);

    let tracker = Arc::new(DownloadProgressTracker::new(
        app_handle.clone(),
        &options.version_id,
        total_bytes,
        total_files as u64,
    ));

    log_info!(
        "开始下载: libraries={}, assets={}, natives={}, client_jar={}",
        total_libraries,
        total_assets,
        total_natives,
        has_client_jar
    );

    // ====== Phase 1: 下载客户端 jar（平放：{game_dir}/{version_id}.jar） ======
    if let Some(ref client_jar) = manifest.client_jar {
        tracker.set_phase("downloading_client");
        let dest_path = app_context.version_jar_in_dir(&game_dir, &options.version_id);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        let bytes_cb: ByteProgressCb = {
            let tracker = tracker.clone();
            Some(Arc::new(move |n| tracker.add_bytes(n)))
        };
        let downloaded = dm
            .download_file_if_needed(
                &client_jar.url,
                &dest_path,
                client_jar.sha1.as_deref(),
                Some(client_jar.size),
                &bytes_cb,
                Some(&cancel_token),
            )
            .await?;

        if downloaded {
            log_info!("已下载客户端 jar: {}", dest_path.display());
            tracker.mark_file_done(&client_jar.path);
        } else {
            log_info!("客户端 jar 已存在（校验通过）: {}", dest_path.display());
            tracker.add_file(&client_jar.path, client_jar.size);
        }
        completed += 1;
    }

    // ====== Phase 2: 下载依赖库 + 原生库（全局共享目录，路径一律来自 app_context） ======
    for (files, dest_base, phase) in [
        (
            &manifest.libraries,
            app_context.libraries_dir(),
            "downloading_libraries",
        ),
        (
            &manifest.natives,
            app_context.libraries_dir(),
            "downloading_natives",
        ),
    ] {
        dm.download_group_with_progress(
            files,
            &dest_base,
            phase,
            &tracker,
            &mut completed,
            Some(&cancel_token),
        )
        .await?;
    }
    // 如果有 natives 的话
    if !manifest.natives.is_empty() {
        let extract_start = Instant::now();
        // 解压原生库到 natives 目录
        let natives_dir = app_context.natives_dir();
        fs::create_dir_all(&natives_dir).map_err(|e| format!("创建 natives 目录失败: {}", e))?;
        for native in &manifest.natives {
            if cancel_token.is_cancelled() {
                return Err("下载已取消".to_string());
            }
            let jar_path = app_context.libraries_dir().join(&native.path);
            extract_jar(
                &jar_path,
                &natives_dir,
                native.extract.as_ref().and_then(|e| e.exclude.as_deref()),
            )?;
            log_info!("已解压原生库: {}", native.path);
        }
        log_info!(
            "[阶段耗时] natives 解压: {} 个原生库, 耗时 {}ms",
            manifest.natives.len(),
            extract_start.elapsed().as_millis()
        );
    }

    // ====== Phase 3: 下载资源文件（全局共享目录） ======
    dm.download_group_with_progress(
        &manifest.assets,
        &app_context.assets_dir(),
        "downloading_assets",
        &tracker,
        &mut completed,
        Some(&cancel_token),
    )
    .await?;

    // ====== Phase 4: 资源索引（{root}/assets/indexes/{id}.json，全局共享） ======
    if let Some(ref index) = manifest.asset_index {
        tracker.set_phase("downloading_index");
        let dest = app_context.assets_dir().join(&index.path);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建索引目录失败: {}", e))?;
        }
        dm.download_file_if_needed(
            &index.url,
            &dest,
            index.sha1.as_deref(),
            Some(index.size),
            &None,
            Some(&cancel_token),
        )
        .await?;
        log_info!("已下载资源索引: {}", index.path);
    }

    // ====== Phase 4.5: log4j 日志配置（{root}/assets/log_configs/{id}，全局共享） ======
    if let Some(ref log_config) = manifest.log_config {
        tracker.set_phase("downloading_log_config");
        let dest = app_context.assets_dir().join(&log_config.path);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建日志配置目录失败: {}", e))?;
        }
        dm.download_file_if_needed(
            &log_config.url,
            &dest,
            log_config.sha1.as_deref(),
            Some(log_config.size),
            &None,
            Some(&cancel_token),
        )
        .await?;
        log_info!("已下载 log4j 配置: {}", log_config.path);
        tracker.add_file(&log_config.path, log_config.size);
        completed += 1;
    }

    // ====== Phase 5: 校验文件完整性 ======
    tracker.set_phase("validating");
    match crate::game::validator::validate_game_integrity(
        app_context.inner(),
        game_manager.inner(),
        &options.game_name,
        false,
    ) {
        Ok(v) if v.valid => log_info!("✅ 文件完整性校验通过: 检查 {} 项", v.checked),
        Ok(v) => log_info!("⚠️ 文件完整性校验未通过: 缺失 {} 项, 损坏 {} 项", v.missing, v.corrupt),
        Err(e) => log_info!("⚠️ 完整性校验执行失败（忽略）: {}", e),
    }

    let game = game_manager
        .get_game(&options.game_name)
        .ok_or_else(|| format!("游戏不存在：{}", options.game_name))?;

    game_manager.save_record(&game).map_err(|e| e.to_string())?;
    app_handle
        .emit(
            "download-complete",
            serde_json::json!({
                "game_name": &options.game_name,
                "version_id": &options.version_id,
                "status": "success"
            }),
        )
        .ok();

    log_info!("========== 部署完成 ==========");

    Ok(DownloadResult {
        success: true,
        game_id: game.id.clone(),
        game_name: options.game_name,
        version: options.version_id,
        deployed_files_count: completed,
        total_files_count: total_files,
        message: "版本已下载到游戏".to_string(),
    })
    }
    .await;

    dm.unregister_cancellation(&version_id);
    if cancel_token.is_cancelled() {
        log_info!("下载已取消，清理游戏: {}", game_name);
        let _ = game_manager.delete_game(&game_name, true);
        return Err("下载已取消".to_string());
    }

    result
}
