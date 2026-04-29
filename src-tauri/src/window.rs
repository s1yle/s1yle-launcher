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
    cm: State<'_, ConfigManager>,  // ✅ 添加 ConfigManager 参数
) -> Result<(), String> {
    let mut position = WindowPosition {
        x,
        y,
        width,
        height,
        maximized,
    };

    window_check(&mut position);
    
    // ✅ 使用 ConfigManager 更新配置，不再直接写文件
    cm.update_window_pos(position)
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
