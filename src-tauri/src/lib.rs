// src-tauri/src/lib.rs
mod account;
mod app_context;
mod background;
mod bootstrap;
mod config_io;
mod download;
mod font;
mod game;
mod java;
mod launch;
mod logging;
mod modloader;
mod render;
mod shared;
mod system;
mod window;

use crate::app_context::AppContext;

use crate::download::DownloadManager;
use crate::window::{WindowType, create_and_show_window, restore_main_window_state};
use std::sync::Mutex;
use std::time::Instant;
use tauri::webview::PageLoadEvent;
use tauri::{Manager, State, WebviewUrl};
use tauri_plugin_keyring::KeyringExt;

pub use crate::account::{
    add_player_account, clear_login_state, delete_account, get_account_list, get_current_account,
    get_current_account_token, get_login_state, init_account_manager, initialize_account_system,
    save_login_state, set_current_account, cancel_device_code,
    get_login_status, poll_and_complete_login, start_device_code,
};
pub use crate::bootstrap::get_bootstrap_data;
pub use crate::launch::{
    GameLogResult, LaunchConfig, LaunchGameInfo, LaunchStatus, LaunchStatusInfo,
    front_get_game_log, front_get_launch_config, front_get_launch_games,
    front_get_launch_status, front_get_launch_status_by_key, front_launch_game,
    front_stop_game, front_update_launch_config, init_launch_manager,
};
pub use crate::window::{load_window_position, save_window_position};

pub use download::{
    cancel_download, cancel_version_download, clear_completed_tasks, download, get_download_tasks,
    get_version_detail, get_version_download_manifest, get_version_manifest,
};

pub use crate::game::{
    Game, GameManager, GameState, create_game, delete_game, get_game, get_game_folders,
    get_game_root, get_game_settings, get_global_game_settings, rename_game, scan_games,
    set_game_root, update_game, update_game_settings, update_global_game_settings,
    validate_game, add_game_folder, remove_game_folder, duplicate_game,
};

pub use crate::system::{
    get_config, get_disk_free_space, get_display_resolutions, get_memory_usage,
    get_system_info, get_system_memory, open_folder, open_url, set_config_value,
};

pub use crate::java::{
    JavaInstallation, get_java_version, scan_java_installations, select_java_path,
};

pub use crate::modloader::{
    LibraryInfo, ModLoaderInfo, ModLoaderManager, ModLoaderType, ModLoaderVersionItem,
    ModLoaderVersionList, build_fabric_launch_config, build_forge_launch_config,
    get_fabric_version_detail, get_fabric_versions, get_forge_versions, get_installed_mod_loaders,
    get_neoforge_versions, get_optifine_versions,
};

pub use logging::{init_logging, log_frontend};

pub use font::{get_font, get_system_fonts};

/// 启动器可见性：游戏运行时关闭主窗口后保持进程存活（阻止默认退出），
/// 游戏结束后由启动管线重建窗口并置回 false。
pub static LAUNCHER_KEEP_ALIVE: Mutex<bool> = Mutex::new(false);

/// 解析启动器工作目录：
/// - `WECRAFT_WORK_DIR` 环境变量优先（开发/便携工具）
/// - 默认：exe 所在目录（配置/日志/缓存与启动器同目录存放）
fn resolve_work_dir() -> std::path::PathBuf {
    use std::path::PathBuf;

    if let Ok(dir) = std::env::var("WECRAFT_WORK_DIR") {
        return PathBuf::from(dir);
    }

    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

/// 初始化应用上下文（组合根）
///
/// - 工作目录：`resolve_work_dir()`（见上）
/// - 游戏根目录：配置文件中 `app.game_dir` → 回退工作目录
fn init_app_context() -> AppContext {
    let work_dir = resolve_work_dir();

    let game_root = resolve_game_root(&work_dir);
    log_info!(
        "工作目录: {} | 游戏根目录: {}",
        work_dir.display(),
        game_root.display()
    );
    let app_context = AppContext::new(work_dir, game_root);
    app_context
}

/// 从配置文件读取持久化的游戏根目录（app.game_dir），读取失败/为空时回退 /工作目录/.minecraft
fn resolve_game_root(work_dir: &std::path::Path) -> std::path::PathBuf {
    // 新位置优先：{work_dir}/.wecraft/.wecraft.json（旧位置已废弃，仅作兼容回退）
    let config_path = work_dir.join(".wecraft").join(".wecraft.json");
    let legacy_config_path = work_dir.join(".wecraft.json");
    for path in [config_path, legacy_config_path] {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(root) = serde_json::from_str::<serde_json::Value>(&content) {
                // 与 set_game_root 的持久化键（game.game_root）保持一致，兼容旧 app.game_root
                for section in ["game", "app"] {
                    if let Some(dir) = root
                        .get(section)
                        .and_then(|s| s.get("game_root"))
                        .and_then(|g| g.as_str())
                    {
                        if !dir.trim().is_empty() {
                            return std::path::PathBuf::from(dir);
                        }
                    }
                }
            }
        }
    }
    work_dir.join(".minecraft").to_path_buf()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ====== 组合根（Composition Root）：ctx → 管理器 → manage ======
    // AppContext 是唯一"路径事实源"，四个管理器通过构造注入持有其克隆，
    // 运行时共享同一份游戏根目录（set_game_root 即时生效）。
    let app_context = init_app_context();
    app_context.ensure_dirs().expect("初始化基础目录失败");

    let download_manager = DownloadManager::new();
    let mod_loader_manager = ModLoaderManager::new(app_context.clone());
    let game_manager = GameManager::new(app_context.clone());
    let game_state = GameState::load(&app_context);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .manage(app_context)
        .manage(download_manager)
        .manage(mod_loader_manager)
        .manage(game_manager)
        .manage(game_state)
        .setup(|app| {
            app.keyring()
                .initialize_service("com.wecraft.launcher".to_string())?;

            app.state::<AppContext>().set_app_handle(app.handle().clone());

            // asset 协议 scope 是静态配置，无法表达可变的 launchdir；
            // 启动时把真实的 .wecraft 数据目录动态加入（{work_dir}/.wecraft/**）
            if let Err(e) = app
                .asset_protocol_scope()
                .allow_directory(app.state::<AppContext>().wecraft_data_dir(), true)
            {
                log_error!("asset scope 注册失败: {}", e);
            }

            let handle = app.handle().clone();
            let _loading_window = create_and_show_window(
                &handle,
                "loading",
                WebviewUrl::App("/loading.html".into()),
                WindowType::Loading,
                |window, payload| {
                    if let PageLoadEvent::Finished = payload.event() {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                },
            )?;

            init_logging(app)?;

            // 预先加载账户数据（登录状态在 accounts 节）
            let _ = crate::account::load_accounts_from_disk_internal(app.handle());

            // 主窗口（隐藏创建）：页面加载完成后关闭 loading 窗口并显示
            let handle_clone = handle.clone();
            let _main_window = create_and_show_window(
                &handle,
                "main",
                WebviewUrl::App("".into()),
                WindowType::Main,
                move |window, payload| {
                    if let PageLoadEvent::Finished = payload.event() {
                        if let Some(win) = handle_clone.get_webview_window("loading") {
                            let _ = win.close();
                        }
                        restore_main_window_state(&window, handle_clone.state::<AppContext>().inner());
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                },
            )?;

            Ok(())
        })
        .on_window_event(|_window, _event| {})
        .invoke_handler(tauri::generate_handler![
            shared::commands::greet,
            get_system_info,
            get_bootstrap_data,
            // 窗口管理
            window::save_window_position,
            window::load_window_position,
            window::save_window_position_by_label,
            window::load_window_position_by_label,
            add_player_account,
            get_account_list,
            get_current_account,
            get_current_account_token,
            get_login_state,
            delete_account,
            set_current_account,
            // 启动/停止 游戏
            front_launch_game,
            front_stop_game,
            front_get_launch_status,
            front_get_launch_status_by_key,
            front_get_launch_games,
            front_get_launch_config,
            front_update_launch_config,
            front_get_game_log,
            log_frontend,
            initialize_account_system,
            get_version_manifest,
            get_version_detail,
            get_version_download_manifest,
            download,
            get_download_tasks,
            cancel_download,
            cancel_version_download,
            clear_completed_tasks,
            get_fabric_versions,
            get_fabric_version_detail,
            build_fabric_launch_config,
            get_forge_versions,
            build_forge_launch_config,
            get_installed_mod_loaders,
            get_neoforge_versions,
            get_optifine_versions,
            get_disk_free_space,
            scan_games,
            get_game,
            create_game,
            delete_game,
            rename_game,
            update_game,
            get_game_root,
            set_game_root,
            get_game_folders,
            add_game_folder,
            remove_game_folder,
            duplicate_game,
            validate_game,
            // 游戏设置相关命令
            get_game_settings,
            update_game_settings,
            get_global_game_settings,
            update_global_game_settings,
            // 系统相关命令
            system::get_system_memory,
            system::get_memory_usage,
            system::get_display_resolutions,
            java::select_java_path,
            open_url,
            open_folder,
            // 配置相关命令
            get_config,
            set_config_value,
            save_login_state,
            clear_login_state,
            // 背景相关命令
            background::select_background_image,
            scan_java_installations,
            get_java_version,
            // 字体
            get_system_fonts,
            get_font,
            // 皮肤渲染
            render::render_avatar,
            render::get_skin_head,
            render::get_skin_cape,
            render::render_isometric_avatar_cmd,
            render::get_skin_model,
            render::get_uuid_by_username,
            render::get_uuids_by_usernames,
            // 正版登录
            start_device_code,
            cancel_device_code,
            poll_and_complete_login,
            get_login_status,
        ])
        .build(tauri::generate_context!())
        .expect("启动失败！")
        .run(|_app, event| match event {
            // 启动器可见性：游戏运行时关闭主窗口，需阻止默认退出以保留轻量监听
            tauri::RunEvent::ExitRequested { api, .. } => {
                if let Ok(g) = crate::LAUNCHER_KEEP_ALIVE.lock() {
                    if *g {
                        api.prevent_exit();
                    }
                }
            }
            _ => {}
        });
}
