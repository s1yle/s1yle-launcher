// src-tauri/src/lib.rs

mod account;
mod admin_account;
mod background;
mod config;
mod download;
mod font;
mod instance;
mod java;
mod launch;
mod logging;
mod modloader;
mod render;
mod window;

use crate::account::AccountType;
use crate::config::{
    AppConfig, ConfigManager, WindowPosition, clear_login_state, export_config, get_config_value,
    get_instance_config, import_config, remove_instance_config, reset_config, save_login_state,
    set_config_value, update_instance_config,
};

use crate::download::DownloadManager;
use crate::window::{WindowType, apply_window_config};
use chrono::Utc;
use core::time;
use std::sync::OnceLock;
use std::thread::sleep;
use tauri::Manager;
use tauri::webview::PageLoadEvent;

pub use crate::account::{
    add_account, delete_account, get_account_list, get_current_account, init_account_manager,
    initialize_account_system, load_accounts_from_disk, save_accounts_to_disk, set_current_account,
};
pub use crate::admin_account::{
    bind_player_to_admin, get_admin_info, get_bound_players, init_admin_manager,
    initialize_admin_system, is_admin_registered, login_admin, register_admin,
    unbind_player_from_admin,
};
pub use crate::launch::{
    LaunchConfig, LaunchStatus, init_launch_manager, tauri_get_launch_config,
    tauri_get_launch_status, tauri_launch_instance, tauri_stop_instance,
    tauri_update_launch_config,
};
pub use crate::window::{load_window_position, save_window_position};

pub use download::{
    cancel_download, clear_completed_tasks, deploy_version_files, deploy_version_global,
    deploy_version_to_instance, download_and_deploy, download_file, get_download_base_path,
    get_download_task, get_download_tasks, get_game_versions, get_version_detail,
    get_version_download_manifest, get_version_manifest, is_version_deployed,
    set_download_base_path,
};

pub use crate::instance::{
    GameInstance, InstanceManager, add_known_path, add_validated_folder, copy_instance,
    create_instance, delete_instance, get_instance, get_instance_settings, get_instances_path,
    get_system_memory, migrate_directory_structure, remove_known_path, rename_instance,
    scan_instances, scan_known_mc_paths, select_java_path, set_default_folder, update_instance,
    update_instance_settings, validate_folder,
};

pub use crate::modloader::{
    LibraryInfo, ModLoaderInfo, ModLoaderManager, ModLoaderType, ModLoaderVersionItem,
    ModLoaderVersionList, build_fabric_launch_config, build_forge_launch_config,
    get_fabric_version_detail, get_fabric_versions, get_forge_versions, get_installed_mod_loaders,
};

pub use crate::java::{JavaInstallation, scan_java_installations};

pub use logging::{init_logging, log_frontend};

pub use font::{get_font, get_system_fonts};

/// 全局 Tauri AppHandle，用于在非命令上下文中访问 Tauri 状态
pub static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

/// 测试用的问候命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! 来自Rust后端的问候", name)
}

/// 系统信息结构体
#[derive(serde::Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
}

/// 获取当前操作系统和架构信息
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    let arch = if cfg!(target_arch = "x86") {
        "x86"
    } else if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "arm") {
        "arm"
    } else if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        "unknown"
    };

    Ok(SystemInfo {
        os: os.to_string(),
        arch: arch.to_string(),
    })
}

/// 使用系统默认浏览器打开指定 URL
#[tauri::command]
fn open_url(url: String) -> Result<String, String> {
    log_info!("打开链接: {}", url);
    tauri_plugin_opener::open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(url)
}

/// 使用系统文件管理器打开指定文件夹
#[tauri::command]
fn open_folder(path: String) -> Result<String, String> {
    log_info!("打开文件夹: {}", path);
    tauri_plugin_opener::open_path(&path, None::<&str>)
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(path)
}

/// 检查登录时间是否已超过 7 天
fn is_login_expired(login_time: &str) -> bool {
    let login_time = match chrono::DateTime::parse_from_rfc3339(login_time) {
        Ok(t) => t,
        Err(_) => return true,
    };
    let elapsed = Utc::now().signed_duration_since(login_time);
    elapsed.num_hours() > 7 * 24
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_path = &*config::DOWNLOAD_BASE_PATH;

    let download_manager = DownloadManager::new(download_path.to_path_buf().clone());
    let mod_loader_manager = ModLoaderManager::new(download_path.to_path_buf());
    let instance_manager = InstanceManager::new();

    let app_config = AppConfig::default();
    let window_config = WindowPosition::default();
    let config_manager: ConfigManager = ConfigManager::new(app_config, window_config);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(download_manager)
        .manage(mod_loader_manager)
        .manage(instance_manager)
        .manage(config_manager)
        .setup(|app| {
            tauri::async_runtime::block_on(window::create_window(
                app.handle().clone(),
                window::WindowType::Loading,
            ))
            .map_err(|e| format!("创建加载窗口失败: {}", e))?;

            APP_HANDLE.set(app.handle().clone()).ok();
            init_logging(app)?;

            let cm: tauri::State<'_, ConfigManager> = app.state();
            let _ = cm.load_config_from_disk();
            log_info!("✅ 配置管理器初始化完成");

            // 异步执行：判断登录态 → 创建目标窗口 → 关闭加载窗口
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let cm = match APP_HANDLE.get() {
                    Some(h) => h.state::<ConfigManager>(),
                    None => return,
                };

                let lg_state = match cm.get_config() {
                    Ok(c) => c.login_state,
                    Err(_) => return,
                };

                let need_login = !lg_state.is_logged_in
                    || lg_state.logged_in_type == AccountType::None
                    || is_login_expired(&lg_state.login_time);

                if need_login {
                    // Login 窗口
                    if let Ok(builder) = tauri::WebviewWindowBuilder::from_config(
                        &handle,
                        &handle.config().app.windows[0],
                    ) {
                        let handle_clone = handle.clone();
                        let webview = builder
                            .on_page_load(move |window, payload| {
                                if let PageLoadEvent::Finished = payload.event() {
                                    if let Some(win) = handle_clone.get_webview_window("loading") {
                                        sleep(time::Duration::from_secs(1));
                                        let _ = win.close();
                                    }
                                    let _ = window.show();
                                }
                            })
                            // .accept_first_mouse(false)
                            .build()
                            .expect("webview 窗口创建失败");

                        let _ = webview.show().map_err(|e| format!("窗口显示失败: {}", e));
                    }
                } else {
                    // Main 窗口
                    let handle_clone = handle.clone();

                    let builder = tauri::WebviewWindowBuilder::new(
                        &handle,
                        "main",
                        tauri::WebviewUrl::App("".into()),
                    );

                    apply_window_config(builder, WindowType::Main)
                        .expect("apply_window_config 失败, 创建窗口失败")
                        .on_page_load(move |window, payload| {
                            if let PageLoadEvent::Finished = payload.event() {
                                if let Some(win) = handle_clone.get_webview_window("loading") {
                                    sleep(time::Duration::from_secs(1));
                                    let _ = win.close();
                                }
                                let _ = window.show();
                            }
                        })
                        .build()
                        .expect("login 窗口创建失败");
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            // 管理员账号
            register_admin,
            login_admin,
            bind_player_to_admin,
            unbind_player_from_admin,
            get_admin_info,
            get_bound_players,
            is_admin_registered,
            initialize_admin_system,
            // 窗口管理
            window::create_window,
            window::close_window,
            window::switch_window,
            add_account,
            get_account_list,
            get_current_account,
            delete_account,
            set_current_account,
            tauri_launch_instance,
            tauri_stop_instance,
            tauri_get_launch_status,
            tauri_get_launch_config,
            tauri_update_launch_config,
            save_window_position,
            load_window_position,
            log_frontend,
            save_accounts_to_disk,
            load_accounts_from_disk,
            save_login_state,
            clear_login_state,
            initialize_account_system,
            get_version_manifest,
            get_version_detail,
            get_version_download_manifest,
            download_file,
            download_and_deploy,
            get_download_tasks,
            get_download_task,
            cancel_download,
            clear_completed_tasks,
            get_game_versions,
            get_download_base_path,
            set_download_base_path,
            deploy_version_files,
            deploy_version_global,
            deploy_version_to_instance,
            is_version_deployed,
            get_fabric_versions,
            get_fabric_version_detail,
            build_fabric_launch_config,
            get_forge_versions,
            build_forge_launch_config,
            get_installed_mod_loaders,
            scan_instances,
            get_instance,
            create_instance,
            delete_instance,
            copy_instance,
            rename_instance,
            update_instance,
            get_instances_path,
            scan_known_mc_paths,
            add_known_path,
            set_default_folder,
            remove_known_path,
            validate_folder,
            add_validated_folder,
            migrate_directory_structure,
            // 游戏设置相关命令
            get_instance_settings,
            update_instance_settings,
            get_system_memory,
            select_java_path,
            open_url,
            open_folder,
            // 配置相关命令
            config::get_config,
            config::update_config,
            get_config_value,
            set_config_value,
            get_instance_config,
            update_instance_config,
            remove_instance_config,
            reset_config,
            export_config,
            import_config,
            // 背景相关命令
            background::select_background_image,
            // 路径配置命令
            config::get_path_config,
            config::update_path_config,
            config::get_instance_path,
            config::get_versions_path,
            config::get_libraries_path,
            config::get_assets_path,
            config::get_natives_path,
            scan_java_installations,
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
        ])
        .run(tauri::generate_context!())
        .expect("启动失败！");
}
