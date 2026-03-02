// src-tauri/src/lib.rs

mod account;
mod config;
mod json;
mod launch;
mod window;
use std::fs;
use std::sync::Mutex;

pub use crate::account::{add_account, get_account_list, get_current_account, delete_account, set_current_account, init_account_manager, save_accounts_to_disk, load_accounts_from_disk, initialize_account_system};
pub use crate::config::{get_config, init_config, DEV};
pub use crate::launch::{
    init_launch_manager,
    tauri_launch_instance,
    tauri_stop_instance,
    tauri_get_launch_status,
    tauri_get_launch_config,
    tauri_update_launch_config,
    LaunchConfig,
    LaunchStatus,
};
pub use crate::window::{
    close_window,
    tauri_close_window
};
use once_cell::sync::Lazy;
use tauri::Manager;
use tracing::info;
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::{prelude::*};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{EnvFilter, fmt as tracing_fmt};


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

    Ok(SystemInfo { os: os.to_string(), arch: arch.to_string() })
}

// 初始化日志系统
pub fn init_logging(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 1. 获取日志存储目录（跨平台：app_data_dir/logs）
    let log_dir = app.path()
        .app_data_dir()?
        .join("logs");
    fs::create_dir_all(&log_dir)?; // 自动创建目录

    println!("日志存储位置，{}",log_dir.to_string_lossy());

    // 2. 配置日志文件：按天滚动，保留 30 天，文件名格式 mc-launcher-2026-02-28.log
    let file_appender = RollingFileAppender::builder()
        .rotation(Rotation::DAILY)
        .filename_prefix("mc-launcher")
        .filename_suffix("log")
        .max_log_files(30)
        .build(log_dir)?;

    // 3. 配置日志级别：从环境变量 RUST_LOG 读取，默认 info
    // 开发时设 RUST_LOG=debug，生产默认 info
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

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
        .with(file_layer)    // 文件输出
        .init();

    tracing::info!("日志系统初始化完成");
    Ok(())
}


enum LogLevel {
    Info,
    Warn,
    Debug,
    Error
}

struct Logger {
    level: LogLevel
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
            LogLevel::Warn=> tracing::warn!("[Internal] {}", msg),
            LogLevel::Error => tracing::error!("[Internal] {}", msg),
            _ => tracing::info!("[Internal] [Unknown] {}", msg),
        }
    }
}

static GLOBAL_LOGGER: Lazy<Mutex<Logger>> = Lazy::new(|| {
    Mutex::new(Logger::new(LogLevel::Info)) // 默认级别为 Info
});

#[macro_export]
macro_rules! log_internal {
    ($level:expr, $($arg:tt)*) => ({
        if let Ok(logger) = $crate::GLOBAL_LOGGER.lock() {
            // 利用 format! 把模板转成 String
            let msg = format!($($arg)*);
            // 调用真正的实例方法
            logger.log_internal($level, msg);
        }
    })
}

// 为了方便调用，我们也可以给每个级别单独定义宏
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


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())

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
            tauri_close_window,
            log_frontend,
            save_accounts_to_disk,
            load_accounts_from_disk,
            initialize_account_system
        ])

        .run(tauri::generate_context!())
        .expect("启动失败！");
}
