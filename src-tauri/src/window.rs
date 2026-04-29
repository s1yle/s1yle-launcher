use crate::config::{self, window_check, ConfigManager, WindowPosition, SAVED_POSITION};
use std::fs;
use tauri::State;

#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
) -> Result<(), String> {
    let mut position = WindowPosition {
        x,
        y,
        width,
        height,
        maximized,
    };

    window_check(&mut position);
    let mut map = serde_json::Map::new();
    map.insert(
        "window_pos".to_string(),
        serde_json::to_value(&position).unwrap(),
    );
    let json = serde_json::to_string_pretty(&map).map_err(|e| e.to_string())?;

    let config_dir = &*config::CONFIG_APPLICATION;
    if !config_dir.exists() {
        fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    }

    let pos_file = &*config::CONFIG_FILE_PATH;
    fs::write(&pos_file, json).map_err(|e| e.to_string())?;

    if let Ok(mut saved) = SAVED_POSITION.lock() {
        *saved = Some(position);
    }

    tracing::info!("窗口位置已保存: {:?}", pos_file);
    Ok(())
}

#[tauri::command]
pub fn load_window_position(
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos()
}

#[tauri::command]
pub fn get_saved_window_position(
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos()
}
