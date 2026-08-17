use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager, State};

use super::manager::GameManager;
use super::models::Game;
use crate::app_context::AppContext;
use crate::config::ConfigManager;
use crate::modloader::ModLoaderType;

/// 扫描所有已安装的游戏（同时准备全局兜底图标：asset scope 授权 + 兜底图标落盘）
#[tauri::command]
pub fn scan_games(
    game_manager: State<'_, GameManager>,
) -> Result<Vec<Game>, String> {
    game_manager.scan_games()
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
