use tauri::State;

use super::manager::GameManager;
use super::models::{Game, GameSettings};

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
