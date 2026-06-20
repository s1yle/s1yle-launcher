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

use crate::config::{
    AppConfig, ConfigManager, WindowPosition, export_config, get_config_value, get_instance_config,
    import_config, remove_instance_config, reset_config, set_config_value, update_instance_config,
};

use crate::download::DownloadManager;
use std::sync::OnceLock;
use tauri::Manager;

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
pub use crate::window::{get_saved_window_position, load_window_position, save_window_position};

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

static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

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

/// get_system_info命令
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

#[tauri::command]
fn open_url(url: String) -> Result<String, String> {
    log_info!("打开链接: {}", url);
    tauri_plugin_opener::open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(url)
}

#[tauri::command]
fn open_folder(path: String) -> Result<String, String> {
    log_info!("打开文件夹: {}", path);
    tauri_plugin_opener::open_path(&path, None::<&str>)
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(path)
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
            APP_HANDLE.set(app.handle().clone()).ok();
            init_logging(app)?;
            let cm: tauri::State<'_, ConfigManager> = app.state();
            let _ = cm.load_config_from_disk();
            log_info!("✅ 配置管理器初始化完成");
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
            window::create_main_window,
            window::close_login_window,
            window::close_window,
            window::logout_and_show_login,
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
            get_saved_window_position,
            log_frontend,
            save_accounts_to_disk,
            load_accounts_from_disk,
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
        ])
        .run(tauri::generate_context!())
        .expect("启动失败！");
}
