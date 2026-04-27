// src-tauri/src/lib.rs

mod account;
mod config;
mod download;
mod instance;
mod launch;
mod modloader;
mod window;
use crate::download::DownloadManager;
use std::fs;
use std::sync::Mutex;

pub use crate::account::{
    add_account, delete_account, get_account_list, get_current_account, init_account_manager,
    initialize_account_system, load_accounts_from_disk, save_accounts_to_disk, set_current_account,
};
pub use crate::config::{
    get_config, get_download_config, get_game_settings, init_config, update_config,
    update_download_config, update_game_settings, AppConfig, AppSettings, DownloadConfig, DEV,
};
pub use crate::launch::{
    init_launch_manager, tauri_get_launch_config, tauri_get_launch_status, tauri_launch_instance,
    tauri_stop_instance, tauri_update_launch_config, LaunchConfig, LaunchStatus,
};
pub use crate::window::{
    get_saved_window_position, load_window_position, save_window_position, WindowPosition,
};

pub use download::{
    cancel_download, clear_completed_tasks, deploy_version_files, deploy_version_to_instance,
    download_file, get_download_base_path, get_download_task, get_download_tasks,
    get_game_versions, get_version_detail, get_version_download_manifest, get_version_manifest,
    is_version_deployed, set_download_base_path,
};

pub use crate::instance::{
    add_known_path, copy_instance, create_instance, delete_instance, get_instance,
    get_instances_path, rename_instance, scan_instances, scan_known_mc_paths, update_instance,
    GameInstance, InstanceManager,
};
pub use crate::modloader::{
    build_fabric_launch_config, build_forge_launch_config, get_fabric_version_detail,
    get_fabric_versions, get_forge_versions, get_installed_mod_loaders, LibraryInfo, ModLoaderInfo,
    ModLoaderManager, ModLoaderType, ModLoaderVersionItem, ModLoaderVersionList,
};
use once_cell::sync::Lazy;
use tauri::Manager;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::prelude::*;
use tracing_subscriber::{fmt as tracing_fmt, EnvFilter};

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

// 初始化日志系统
pub fn init_logging(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 1. 获取日志存储目录（跨平台：app_data_dir/logs）
    let log_dir = app.path().app_data_dir()?.join("logs");
    fs::create_dir_all(&log_dir)?; // 自动创建目录

    println!("日志存储位置，{}", log_dir.to_string_lossy());

    // 2. 配置日志文件：按天滚动，保留 30 天，文件名格式 mc-launcher-2026-02-28.log
    let file_appender = RollingFileAppender::builder()
        .rotation(Rotation::DAILY)
        .filename_prefix("mc-launcher")
        .filename_suffix("log")
        .max_log_files(30)
        .build(log_dir)?;

    // 3. 配置日志级别：从环境变量 RUST_LOG 读取，默认 info
    // 开发时设 RUST_LOG=debug，生产默认 info
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    let time_format = UtcTime::rfc_3339();

    // 4. 构建「控制台 layer」
    let console_layer = tracing_fmt::layer()
        .with_target(true)
        .with_level(true)
        .with_ansi(true)
        .with_timer(time_format)
        .with_writer(std::io::stdout);

    // 5. 构建「文件 layer」
    let file_layer = tracing_fmt::layer()
        .with_target(true)
        .with_level(true)
        .with_timer(UtcTime::rfc_3339())
        .with_ansi(false)
        .with_writer(file_appender);

    // 5. 初始化订阅者：同时输出到控制台和文件
    tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer) // 控制台输出
        .with(file_layer) // 文件输出
        .init();

    tracing::info!("日志系统初始化完成");
    Ok(())
}

#[allow(dead_code)]
enum LogLevel {
    Info,
    Warn,
    Debug,
    Error,
}

#[allow(dead_code)]
struct Logger {
    level: LogLevel,
}

impl Logger {
    fn new(level: LogLevel) -> Self {
        Logger { level }
    }

    fn log_internal(&self, level: LogLevel, message: impl AsRef<str>) {
        let msg = message.as_ref();
        match level {
            LogLevel::Debug => tracing::debug!("[Internal] {}", msg),
            LogLevel::Info => tracing::info!("[Internal] {}", msg),
            LogLevel::Warn => tracing::warn!("[Internal] {}", msg),
            LogLevel::Error => tracing::error!("[Internal] {}", msg),
        }
    }
}

#[allow(dead_code)]
static GLOBAL_LOGGER: Lazy<Mutex<Logger>> = Lazy::new(|| Mutex::new(Logger::new(LogLevel::Info)));

#[macro_export]
macro_rules! log_internal {
    ($level:expr, $($arg:tt)*) => ({
        if let Ok(logger) = $crate::GLOBAL_LOGGER.lock() {
            let msg = format!($($arg)*);
            logger.log_internal($level, msg);
        }
    })
}

#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => ($crate::log_internal!($crate::LogLevel::Info, $($arg)*));
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => ($crate::log_internal!($crate::LogLevel::Error, $($arg)*));
}

#[tauri::command]
fn log_frontend(level: String, message: String) {
    match level.as_str() {
        "debug" => tracing::debug!("[Frontend] {}", message),
        "info" => tracing::info!("[Frontend] {}", message),
        "warn" => tracing::warn!("[Frontend] {}", message),
        "error" => tracing::error!("[Frontend] {}", message),
        _ => tracing::info!("[Frontend] [Unknown] {}", message),
    }
}

#[tauri::command]
fn open_url(url: String) -> Result<String, String> {
    tracing::info!("打开链接: {}", url);
    tauri_plugin_opener::open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(url)
}

#[tauri::command]
fn open_folder(path: String) -> Result<String, String> {
    tracing::info!("打开文件夹: {}", path);
    tauri_plugin_opener::open_path(&path, None::<&str>)
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_path = &*config::DOWNLOAD_BASE_PATH;
    let instance_path = &*config::DEFAULT_DEAMON_PATH;

    let download_manager = DownloadManager::new(download_path.to_path_buf().clone());
    let mod_loader_manager = ModLoaderManager::new(download_path.to_path_buf());
    let instance_manager = InstanceManager::new(instance_path.to_path_buf());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(download_manager)
        .manage(mod_loader_manager)
        .manage(instance_manager)
        .setup(|app| {
            init_logging(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
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
            get_download_tasks,
            get_download_task,
            cancel_download,
            clear_completed_tasks,
            get_game_versions,
            get_download_base_path,
            set_download_base_path,
            deploy_version_files,
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
            open_url,
            open_folder
        ])
        .run(tauri::generate_context!())
        .expect("启动失败！");
}
