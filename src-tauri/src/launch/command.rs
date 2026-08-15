// ======================== Tauri 前端命令 ========================

use tauri::State;

use crate::{
    LaunchConfig, LaunchGameInfo, LaunchStatus, LaunchStatusInfo, app_context::AppContext,
    download::DownloadManager,
    game::GameManager,
    launch::{
        get_launch_config, get_launch_games, get_launch_status, get_launch_status_by_key,
        launch_game, stop_game, update_launch_config,
    },
};

/// 前端命令：启动 Minecraft 游戏（立即返回游戏唯一 ID，后台执行校验/下载/启动，进度可轮询）
#[tauri::command]
pub fn front_launch_game(
    config: Option<LaunchConfig>,
    ctx: State<'_, AppContext>,
    dm: State<'_, DownloadManager>,
    gm: State<'_, GameManager>,
) -> Result<String, String> {
    launch_game(config, &ctx, dm.inner().clone(), gm.inner().clone())
}

/// 前端命令：停止 Minecraft 游戏；game_id 为 None 时停止全部
#[tauri::command]
pub fn front_stop_game(game_id: Option<String>) -> Result<String, String> {
    stop_game(game_id)
}

/// 前端命令：获取聚合启动状态（任一游戏运行中即 Running）
#[tauri::command]
pub fn front_get_launch_status() -> Result<LaunchStatus, String> {
    get_launch_status()
}

/// 前端命令：获取指定游戏的启动状态与进度（以游戏 ID 标识）
#[tauri::command]
pub fn front_get_launch_status_by_key(game_id: String) -> Result<LaunchStatusInfo, String> {
    get_launch_status_by_key(&game_id)
}

/// 前端命令：获取全部运行游戏的快照列表
#[tauri::command]
pub fn front_get_launch_games() -> Result<Vec<LaunchGameInfo>, String> {
    get_launch_games()
}

/// 前端命令：获取默认启动配置
#[tauri::command]
pub fn front_get_launch_config() -> Result<LaunchConfig, String> {
    get_launch_config()
}

/// 前端命令：更新默认启动配置
#[tauri::command]
pub fn front_update_launch_config(config: LaunchConfig) -> Result<String, String> {
    update_launch_config(config)
}