use tauri::State;

use super::manager::GameManager;
use super::models::{Game, GameSettings};
use crate::config::ConfigManager;

/// 获取游戏的游戏设置
#[tauri::command]
pub fn get_game_settings(
    game_name: String,
    game_manager: State<'_, GameManager>,
) -> Result<GameSettings, String> {
    let game = game_manager
        .get_game(&game_name)
        .ok_or_else(|| format!("游戏不存在：{}", game_name))?;

    Ok(game.game_settings.unwrap_or_default())
}

/// 更新游戏的游戏设置
#[tauri::command]
pub fn update_game_settings(
    game_name: String,
    settings: GameSettings,
    game_manager: State<'_, GameManager>,
) -> Result<Game, String> {
    game_manager.update_game_settings(&game_name, &settings)
}

/// 获取全局游戏设置（未启用独立设置时的默认值，所有游戏共用）
#[tauri::command]
pub fn get_global_game_settings(
    config_manager: State<'_, ConfigManager>,
) -> Result<GameSettings, String> {
    config_manager.get_global_game_settings()
}

/// 更新全局游戏设置
#[tauri::command]
pub fn update_global_game_settings(
    config_manager: State<'_, ConfigManager>,
    settings: GameSettings,
) -> Result<GameSettings, String> {
    config_manager.update_global_game_settings(&settings)?;
    config_manager.get_global_game_settings()
}