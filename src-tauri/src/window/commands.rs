//! 窗口管理命令

use tauri::State;
use crate::app_context::AppContext;
use crate::window::models::{WindowPosition, window_check};
use crate::window::store;

/// 保存窗口位置和大小信息（向后兼容，默认保存到 main）
#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
    ctx: State<'_, AppContext>,
) -> Result<(), String> {
    let mut position = WindowPosition { x, y, width, height, maximized };
    window_check(&mut position);
    store::save_position(&ctx.launcher_config_path(), "main", &position)
}

/// 加载上次保存的窗口位置（向后兼容，默认加载 main）
#[tauri::command]
pub fn load_window_position(
    ctx: State<'_, AppContext>,
) -> Result<Option<WindowPosition>, String> {
    Ok(store::load_position(&ctx.launcher_config_path(), "main"))
}

/// 保存指定窗口的位置和大小
#[tauri::command]
pub fn save_window_position_by_label(
    label: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
    ctx: State<'_, AppContext>,
) -> Result<(), String> {
    let mut position = WindowPosition { x, y, width, height, maximized };
    window_check(&mut position);
    store::save_position(&ctx.launcher_config_path(), &label, &position)
}

/// 加载指定窗口的位置
#[tauri::command]
pub fn load_window_position_by_label(
    label: String,
    ctx: State<'_, AppContext>,
) -> Result<Option<WindowPosition>, String> {
    Ok(store::load_position(&ctx.launcher_config_path(), &label))
}
