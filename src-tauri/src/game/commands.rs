use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager, State};

use super::manager::GameManager;
use super::models::Game;
use crate::app_context::AppContext;
use crate::config::ConfigManager;
use crate::log_info;
use crate::log_warn;
use crate::modloader::ModLoaderType;

/// 兜底加载器图标文件名（写入 {work_dir}/.wecraft/assets/icons/，全局一份）
const LOADER_ICON_NAMES: [&str; 5] = [
    "vanilla.png",
    "fabric.png",
    "forge.png",
    "neoforge.png",
    "grass.png",
];

/// 兜底图标内容（打包的应用图标，按加载器名落盘后可由用户替换）
const FALLBACK_ICON: &[u8] = include_bytes!("../../icons/32x32.png");

/// 准备全局兜底图标：
/// 1. 将启动器数据目录递归加入 asset 协议 scope，使前端 asset://localhost/ 可访问兜底图标
/// 2. 缺失时写入兜底加载器图标（{work_dir}/.wecraft/assets/icons/{loader}.png，仅一次）
/// 3. 清理游戏目录内的遗留 .smcl 目录（旧版本按游戏落盘图标），保持游戏目录纯净
fn prepare_game_icons(app: &AppHandle, dir: &Path, ctx: &AppContext) {
    let stale = dir.join(".smcl");
    if stale.exists() {
        if std::fs::remove_dir_all(&stale).is_ok() {
            log_info!("已清理游戏遗留图标目录: {}", stale.display());
        }
    }

    let icon_dir = ctx.wecraft_icons_dir();
    if let Err(e) = std::fs::create_dir_all(&icon_dir) {
        log_warn!("创建全局图标目录失败 {}: {}", icon_dir.display(), e);
        return;
    }
    for name in LOADER_ICON_NAMES {
        let dest = icon_dir.join(name);
        if !dest.exists() {
            if let Err(e) = std::fs::write(&dest, FALLBACK_ICON) {
                log_warn!("写入全局图标失败 {}: {}", dest.display(), e);
            }
        }
    }
    let _ = app.asset_protocol_scope().allow_directory(dir, true);
    let _ = app
        .asset_protocol_scope()
        .allow_directory(ctx.wecraft_data_dir(), true);
}

/// 扫描所有已安装的游戏（同时准备全局兜底图标：asset scope 授权 + 兜底图标落盘）
#[tauri::command]
pub fn scan_games(
    app: AppHandle,
    app_context: State<'_, AppContext>,
    game_manager: State<'_, GameManager>,
) -> Result<Vec<Game>, String> {
    let games = game_manager.scan_games()?;
    for game in &games {
        prepare_game_icons(&app, Path::new(&game.path), app_context.inner());
    }
    Ok(games)
}

/// 获取指定名称的游戏信息
#[tauri::command]
pub fn get_game(game_name: String, game_manager: State<'_, GameManager>) -> Option<Game> {
    game_manager.get_game(&game_name)
}

/// 创建新游戏（指定名称、版本、加载器类型等）
#[tauri::command]
pub fn create_game(
    name: String,
    version: String,
    loader_type: ModLoaderType,
    loader_version: Option<String>,
    icon_path: Option<String>,
    game_manager: State<'_, GameManager>,
) -> Result<Game, String> {
    game_manager.create_game(&name, &version, loader_type, loader_version, icon_path)
}

/// 删除指定名称的游戏（delete_files=true 同时删除游戏目录）
#[tauri::command]
pub fn delete_game(
    game_name: String,
    delete_files: bool,
    game_manager: State<'_, GameManager>,
) -> Result<(), String> {
    game_manager.delete_game(&game_name, delete_files)
}

/// 重命名指定游戏
#[tauri::command]
pub fn rename_game(
    game_name: String,
    new_name: String,
    game_manager: State<'_, GameManager>,
) -> Result<Game, String> {
    game_manager.rename_game(&game_name, &new_name)
}

/// 更新游戏信息（名称、启用状态等）
#[tauri::command]
pub fn update_game(
    game_name: String,
    name: Option<String>,
    enabled: Option<bool>,
    game_manager: State<'_, GameManager>,
) -> Result<Game, String> {
    game_manager.update_game(&game_name, name, enabled)
}

/// 校验游戏完整性（基于版本 JSON：客户端 jar / 库文件 / 原生库 / 资源索引 / 资源文件）
///
/// `deep=true` 时对资源文件也做 SHA1 校验（耗时较长），默认仅校验大小。
///
/// 异步命令 + `spawn_blocking`：全量 SHA1 哈希耗时约 1s，避免占用 IPC 同步命令线程池
/// （否则会阻塞同池的 `scan_games` 等命令，导致进入游戏页 UI 卡顿）。
#[tauri::command]
pub async fn validate_game(
    game_name: String,
    deep: Option<bool>,
    app_context: State<'_, AppContext>,
    game_manager: State<'_, GameManager>,
) -> Result<super::validator::GameValidation, String> {
    let ctx = app_context.inner().clone();
    let gm = game_manager.inner().clone();
    let deep = deep.unwrap_or(false);
    tauri::async_runtime::spawn_blocking(move || {
        super::validator::validate_game_integrity(&ctx, &gm, &game_name, deep)
    })
    .await
    .map_err(|e| format!("校验任务执行失败: {}", e))?
}

/// 获取当前游戏根目录（.minecraft 所在目录）
#[tauri::command]
pub fn get_game_root(app_context: State<'_, AppContext>) -> String {
    app_context.game_root().to_string_lossy().to_string()
}

/// 切换游戏根目录（校验 + 持久化 + 运行时生效）
#[tauri::command]
pub fn set_game_root(
    path: String,
    app_context: State<'_, AppContext>,
    config_manager: State<'_, ConfigManager>,
) -> Result<String, String> {
    let root = std::path::PathBuf::from(&path);
    if !root.exists() {
        return Err(format!("路径不存在: {}", path));
    }
    if !root.is_dir() {
        return Err(format!("路径不是目录: {}", path));
    }

    config_manager.set_game_root(&PathBuf::from(path.clone()))?;
    app_context.ensure_dirs()?;
    Ok(path)
}
