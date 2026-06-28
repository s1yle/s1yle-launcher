use crate::{
    APP_HANDLE,
    config::{ConfigManager, WindowPosition, window_check},
    log_info,
};
use tauri::{
    Manager, State, WebviewWindowBuilder,
    utils::config::WindowEffectsConfig,
    webview::{PageLoadEvent, PageLoadPayload},
    window::EffectState,
};
use windows::Win32::UI::Accessibility::BulletStyle;

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
        effects: vec![],
        state: Some(EffectState::Active),
        color: None,
        radius: Some(50.0),
    };

    let cm = APP_HANDLE
        .get()
        .ok_or("APP_HANDLE 获取失败")?
        .state::<ConfigManager>();

    let mut builder = builder
        .title(window_type.title())
        .visible(false)
        .effects(effect)
        .resizable(true)
        .transparent(true)
        .decorations(false);

    builder = match window_type {
        WindowType::Main => {
            builder = builder
                .inner_size(1200.0, 800.0)
                .min_inner_size(800.0, 600.0);

            if let Ok(main_pos) = load_window_position_by_label("main".to_string(), cm) {
                if let Some(pos) = main_pos {
                    builder = builder
                        .position(pos.x.into(), pos.y.into())
                        .inner_size(pos.width.into(), pos.height.into());
                }
            }

            builder
        }
        WindowType::Login => {
            builder = builder
                .inner_size(480.0, 640.0)
                .min_inner_size(480.0, 640.0);

            if let Ok(main_pos) = load_window_position_by_label("login".to_string(), cm) {
                if let Some(pos) = main_pos {
                    builder = builder
                        .position(pos.x.into(), pos.y.into())
                        .inner_size(pos.width.into(), pos.height.into());
                }
            }

            builder
        }
        WindowType::Loading => {
            builder = builder
                .inner_size(400.0, 320.0)
                .min_inner_size(400.0, 320.0)
                .fullscreen(false)
                .maximizable(false)
                .center();

            if let Ok(main_pos) = load_window_position_by_label("loading".to_string(), cm) {
                if let Some(pos) = main_pos {
                    builder = builder
                        .position(pos.x.into(), pos.y.into())
                        .inner_size(pos.width.into(), pos.height.into());
                }
            }

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
    let builder = WebviewWindowBuilder::new(app, label, url);

    let window = apply_window_config(builder, window_type)?
        .on_page_load(on_page_loaded)
        .build()
        .map_err(|e| format!("创建窗口失败 ({}): {}", label, e))?;

    Ok(window)
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

    create_and_show_window(
        &app,
        window_type.label(),
        window_type.url(),
        window_type,
        |_window, _payload| {},
    )?;

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

/// 保存窗口位置和大小信息（向后兼容，默认保存到 main）
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

    cm.update_window_pos_by_label("main", position)
}

/// 加载上次保存的窗口位置（向后兼容，默认加载 main）
#[tauri::command]
pub fn load_window_position(
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos_by_label("main")
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

    cm.update_window_pos_by_label(&label, position)
}

/// 加载指定窗口的位置
#[tauri::command]
pub fn load_window_position_by_label(
    label: String,
    cm: State<'_, ConfigManager>,
) -> Result<Option<WindowPosition>, String> {
    cm.get_window_pos_by_label(&label)
}

/// 关闭指定窗口并打开另一个窗口（如退出登录：关闭 main，打开 login）
#[tauri::command]
pub async fn switch_window(
    app: tauri::AppHandle,
    close_label: String,
    open_type: WindowType,
) -> Result<(), String> {
    log_info!("切换窗口: 关闭 {} → 打开 {:?}", close_label, open_type);

    if let Some(window) = app.get_webview_window(&close_label) {
        window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        window.close().map_err(|e| format!("关闭窗口失败: {}", e))?;
    }

    create_window(app, open_type).await
}
