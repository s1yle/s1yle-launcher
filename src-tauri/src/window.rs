mod commands;
pub mod models;
pub mod store;
pub use commands::*;

use crate::app_context::AppContext;
use tauri::{
    Manager, WebviewWindowBuilder,
    utils::config::WindowEffectsConfig,
    webview::{Color, PageLoadPayload},
    window::EffectState,
};

/// 窗口类型（主窗口 + 启动加载窗口）
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum WindowType {
    Main,
    Loading,
}

impl WindowType {
    pub fn title(&self) -> &'static str {
        match self {
            WindowType::Main => "WeCraft! Launcher",
            WindowType::Loading => "WeCraft! Launcher - loading...",
        }
    }
}

pub fn apply_window_config<'a>(
    builder: WebviewWindowBuilder<'a, tauri::Wry, tauri::AppHandle>,
    window_type: WindowType,
    ctx: &AppContext,
) -> Result<WebviewWindowBuilder<'a, tauri::Wry, tauri::AppHandle>, String> {
    let mut builder = builder
        .title(window_type.title())
        .visible(false)
        .transparent(true)
        .decorations(false);

    builder = match window_type {
        WindowType::Main => {
            let effect = WindowEffectsConfig {
                effects: vec![],
                state: Some(EffectState::Active),
                color: None,
                radius: Some(12.0),
            };
            builder = builder
                .effects(effect)
                .resizable(true)
                .inner_size(1200.0, 800.0)
                .min_inner_size(800.0, 600.0);

            if let Some(pos) = store::load_position(&ctx.launcher_config_path(), "main") {
                builder = builder
                    .position(pos.x.into(), pos.y.into())
                    .inner_size(pos.width.into(), pos.height.into());
            }

            builder
        }
        WindowType::Loading => {
            let effect = WindowEffectsConfig {
                effects: vec![],
                state: Some(EffectState::Inactive),
                color: None,
                radius: None,
            };
            builder = builder
                .effects(effect)
                .background_color(Color(0, 0, 0, 0))
                .resizable(false)
                .inner_size(250.0, 250.0)
                .min_inner_size(250.0, 250.0)
                .max_inner_size(250.0, 250.0)
                .fullscreen(false)
                .maximizable(false)
                .shadow(false)
                .center();
            builder
        }
    };

    Ok(builder)
}

/// 创建并显示窗口的统一入口（普通函数，用于 setup 上下文）
pub fn create_and_show_window<F>(
    app: &tauri::AppHandle,
    label: &str,
    url: tauri::WebviewUrl,
    window_type: WindowType,
    on_page_loaded: F,
) -> Result<tauri::WebviewWindow, String>
where
    F: Fn(tauri::WebviewWindow, PageLoadPayload<'_>) + Send + Sync + 'static,
{
    let ctx = app.state::<AppContext>();
    let builder = WebviewWindowBuilder::new(app, label, url);

    let window = apply_window_config(builder, window_type, ctx.inner())?
        .on_page_load(move |window, payload| {
            on_page_loaded(window.clone(), payload);
        })
        .build()
        .map_err(|e| format!("创建窗口失败 ({}): {}", label, e))?;

    Ok(window)
}

/// 应用主窗口的保存状态（位置/尺寸/最大化）
pub fn restore_main_window_state(window: &tauri::WebviewWindow, ctx: &AppContext) {
    if let Some(pos) = store::load_position(&ctx.launcher_config_path(), "main") {
        if pos.maximized {
            let _ = window.maximize();
        } else {
            let _ = window.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x: pos.x, y: pos.y },
            ));
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: pos.width,
                height: pos.height,
            }));
        }
    }
}
