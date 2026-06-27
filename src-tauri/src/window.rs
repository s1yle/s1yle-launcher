use std::{thread::sleep, time};

use crate::{
    config::{ConfigManager, WindowPosition, window_check},
    log_info,
};
use tauri::{
    EventLoopMessage, Manager, State, WebviewWindowBuilder, Wry, utils::config::WindowEffectsConfig, webview::PageLoadEvent, window::{Effect::Acrylic, EffectState},
};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum WindowType {
    Main,
    Login,
    Loading,
}

impl WindowType {
    pub fn label(&self) -> &'static str {
        match self {
            WindowType::Main => "main",
            WindowType::Login => "login",
            WindowType::Loading => "loading",
        }
    }

    pub fn title(&self) -> &'static str {
        match self {
            WindowType::Main => "WeCraft! Launcher",
            WindowType::Login => "WeCraft! Launcher - 登录",
            WindowType::Loading => "WeCraft! Launcher - loading...",
        }
    }

    pub fn url(&self) -> tauri::WebviewUrl {
        match self {
            WindowType::Loading => tauri::WebviewUrl::App("/loading.html".into()),
            _ => tauri::WebviewUrl::App("".into()),
        }
    }
}

pub fn apply_window_config<'a>(
    builder: WebviewWindowBuilder<'a, tauri::Wry, tauri::AppHandle>,
    window_type: WindowType,
) -> Result<WebviewWindowBuilder<'a, tauri::Wry, tauri::AppHandle>, String> {
    let effect = WindowEffectsConfig {
        effects: vec![Acrylic],
        state: Some(EffectState::Active),
        color: None,
        radius: Some(50.0),
    };

    let builder = match window_type {
        WindowType::Main => builder
            .title(window_type.title())
            .effects(effect)
            .visible(false)
            .transparent(true)
            .inner_size(1200.0, 800.0)
            .min_inner_size(800.0, 600.0)
            .resizable(true)
            .decorations(false)
            .center(),
        WindowType::Login => builder
            .title(window_type.title())
            .effects(effect)
            .visible(false)
            .inner_size(480.0, 640.0)
            .min_inner_size(480.0, 640.0)
            .decorations(false)
            .resizable(false)
            .center(),
        WindowType::Loading => builder
            .title(window_type.title())
            .effects(effect)
            .transparent(true)
            .inner_size(400.0, 320.0)
            .min_inner_size(400.0, 320.0)
            .fullscreen(false)
            .maximizable(false)
            .decorations(false)
            .resizable(false),
    };

    Ok(builder)
}


/// 统一创建窗口，如果已存在则直接显示
#[tauri::command]
pub async fn create_window(app: tauri::AppHandle, window_type: WindowType) -> Result<(), String> {
    let label = window_type.label();

    log_info!("创建窗口: {}", label);

    if let Some(win) = app.get_webview_window(label) {
        win.show().map_err(|e| format!("显示窗口失败: {}", e))?;
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(&app, label, window_type.url());

    builder = apply_window_config(builder, window_type)?;

    builder
        .build()
        .map_err(|e| format!("创建窗口失败({}): {}", label, e))?;

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

/// 关闭指定窗口并打开另一个窗口（如退出登录：关闭 main，打开 login）
#[tauri::command]
pub async fn switch_window(app: tauri::AppHandle, close_label: String, open_type: WindowType) -> Result<(), String> {
    log_info!("切换窗口: 关闭 {} → 打开 {:?}", close_label, open_type);

    if let Some(window) = app.get_webview_window(&close_label) {
        window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        window.close().map_err(|e| format!("关闭窗口失败: {}", e))?;
    }

    create_window(app, open_type).await
}

