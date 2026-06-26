use crate::{config::{ConfigManager, WindowPosition, window_check}, log_info};
use tauri::{Manager, State, WebviewWindowBuilder};

/// 保存窗口位置和大小信息
#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
    cm: State<'_, ConfigManager>,
) -> Result<(), String> {
    let mut position = WindowPosition {
        x,
        y,
        width,
        height,
        maximized,
    };

    window_check(&mut position);

    cm.update_window_pos(position)
}

/// 加载上次保存的窗口位置
#[tauri::command]
pub fn load_window_position(
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos()
}

/// 获取已保存的窗口位置信息
#[tauri::command]
pub fn get_saved_window_position(
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos()
}

/// 创建主窗口（1200x800，无边框）
#[tauri::command]
pub async fn create_main_window(app: tauri::AppHandle) -> Result<(), String> {
    log_info!("创建主窗口！");
    let _ = WebviewWindowBuilder::new(
        &app,
        "main",
        tauri::WebviewUrl::App("".into()),
    )
    .title("WeCraft! Launcher")
    .visible(false)
    .transparent(true)
    .focused(false)
    .focusable(true)
    .inner_size(1200.0, 800.0)
    .min_inner_size(800.0, 600.0)
    .resizable(true)
    .decorations(false)
    .center()
    .build()
    .map_err(|e| format!("创建主窗口失败: {}", e))?;

    // webview_window.set_ignore_cursor_events(true).map_err(|e| format!("显示窗口失败: {}", e))?;
    // webview_window.show().map_err(|e| format!("显示窗口失败: {}", e))?;

    Ok(())
}

/// 退出登录并显示登录窗口（关闭主窗口）
#[tauri::command]
pub async fn logout_and_show_login(app: tauri::AppHandle) -> Result<(), String> {
    log_info!("退出登录且创建登录器窗口！");
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        window.close().map_err(|e| format!("关闭窗口失败: {}", e))?;
    }
    
    let _ = WebviewWindowBuilder::new(
        &app,
        "login",
        tauri::WebviewUrl::App("".into()),
    )
    .title("WeCraft! Launcher - 登录")
    .visible(false)
    .focused(false)
    .focusable(false)
    .inner_size(480.0, 640.0)
    .min_inner_size(480.0, 640.0)
    .resizable(false)
    .decorations(false)
    .center()
    .build()
    .map_err(|e| format!("创建登录窗口失败: {}", e))?;

    // webview_window.set_ignore_cursor_events(true).map_err(|e| format!("显示窗口失败: {}", e))?;
    // webview_window.show().map_err(|e| format!("显示窗口失败: {}", e))?;

    Ok(())
}

/// 关闭登录窗口
#[tauri::command]
pub fn close_login_window(app: tauri::AppHandle) -> Result<(), String> {
    log_info!("关闭登陆器窗口！");
    if let Some(window) = app.get_webview_window("login") {
        window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        window.close().map_err(|e| format!("关闭登录窗口失败: {}", e))?;
    }
    Ok(())
}

/// 关闭指定标签的窗口
#[tauri::command]
pub fn close_window(app: tauri::AppHandle, label: String) -> Result<(), String> {
    log_info!("关闭窗口: {}", label);
    if let Some(window) = app.get_webview_window(&label) {
        window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        window.close().map_err(|e| format!("关闭窗口失败: {}", e))?;
    }
    Ok(())
}
