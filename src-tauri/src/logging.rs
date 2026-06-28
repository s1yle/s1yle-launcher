use chrono::Local;
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufWriter, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::OnceLock;
use tauri::Manager;

// ==================== LogLevel ====================

/// 日志级别枚举
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum LogLevel {
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

impl LogLevel {
    /// 返回日志级别对应的字符串
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO ",
            LogLevel::Warn => "WARN ",
            LogLevel::Error => "ERROR",
        }
    }

    /// 从字符串解析日志级别
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "debug" | "1" => Some(LogLevel::Debug),
            "info" | "2" => Some(LogLevel::Info),
            "warn" | "3" => Some(LogLevel::Warn),
            "error" | "4" => Some(LogLevel::Error),
            _ => None,
        }
    }

    /// 返回 ANSI 颜色代码
    fn ansi_color(&self) -> &'static str {
        match self {
            LogLevel::Debug => "\x1b[36m",
            LogLevel::Info => "\x1b[32m",
            LogLevel::Warn => "\x1b[33m",
            LogLevel::Error => "\x1b[31m",
        }
    }

    /// 返回 ANSI 重置代码
    fn ansi_reset() -> &'static str {
        "\x1b[0m"
    }

    /// 返回 ANSI 暗淡代码
    fn ansi_dim() -> &'static str {
        "\x1b[2m"
    }
}

// ==================== RotatingFileWriter ====================

/// 按日期轮转的文件写入器，自动清理旧日志
struct RotatingFileWriter {
    dir: PathBuf,
    prefix: String,
    suffix: String,
    max_files: usize,
    current_date: String,
    writer: Option<BufWriter<File>>,
}

impl RotatingFileWriter {
    fn new(dir: PathBuf) -> Self {
        RotatingFileWriter {
            dir,
            prefix: "wecraft".into(),
            suffix: "log".into(),
            max_files: 30,
            current_date: String::new(),
            writer: None,
        }
    }

    fn write_line(&mut self, line: &str) -> io::Result<()> {
        self.rotate_if_needed()?;
        if let Some(ref mut writer) = self.writer {
            writeln!(writer, "{}", line)?;
            writer.flush()?;
        }
        Ok(())
    }

    fn rotate_if_needed(&mut self) -> io::Result<()> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        if self.current_date == today && self.writer.is_some() {
            return Ok(());
        }

        if let Some(mut w) = self.writer.take() {
            let _ = w.flush();
        }

        self.current_date = today.clone();
        let file_path = self
            .dir
            .join(format!("{}-{}.{}", self.prefix, today, self.suffix));

        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&file_path)?;

        self.writer = Some(BufWriter::new(file));
        self.cleanup_old()?;
        Ok(())
    }

    fn cleanup_old(&mut self) -> io::Result<()> {
        let mut entries: Vec<_> = fs::read_dir(&self.dir)?
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.file_name()
                    .to_string_lossy()
                    .starts_with(&format!("{}-", self.prefix))
                    && e.file_name()
                        .to_string_lossy()
                        .ends_with(&format!(".{}", self.suffix))
            })
            .collect();

        entries.sort_by_key(|e| e.path());

        while entries.len() > self.max_files {
            if let Some(oldest) = entries.first() {
                let _ = fs::remove_file(oldest.path());
                entries.remove(0);
            }
        }
        Ok(())
    }
}

// ==================== Logger ====================

/// 日志记录器，支持控制台彩色输出和按日轮转的文件输出
struct Logger {
    min_level: LogLevel,
    file: Mutex<RotatingFileWriter>,
}

impl Logger {
    fn new(log_dir: PathBuf, min_level: LogLevel) -> Self {
        Logger {
            min_level,
            file: Mutex::new(RotatingFileWriter::new(log_dir)),
        }
    }

    fn log(&self, level: LogLevel, target: &str, message: &str) {
        if level < self.min_level {
            return;
        }

        let timestamp = Local::now().format("%Y-%m-%dT%H:%M:%S%.6f%:z");
        let line = format!("{}  {} {}: {}", timestamp, level.as_str(), target, message);

        // Console (with ANSI color)
        {
            let stdout = io::stdout();
            let mut handle = stdout.lock();
            let _ = writeln!(
                handle,
                "{}{}  {} {}{}{}: {}{}",
                level.ansi_color(),
                timestamp,
                level.as_str(),
                LogLevel::ansi_dim(),
                target,
                LogLevel::ansi_reset(),
                message,
                LogLevel::ansi_reset(),
            );
        }

        // File (without ANSI color)
        if let Ok(mut file) = self.file.lock() {
            let _ = file.write_line(&line);
        }
    }
}

// ==================== Global State ====================

/// 全局 Logger 实例
static LOGGER: OnceLock<Logger> = OnceLock::new();

// ==================== Macros ====================

/// 记录 INFO 级别日志的宏
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        $crate::logging::log_internal(
            $crate::logging::LogLevel::Info,
            module_path!(),
            format!($($arg)*)
        )
    };
}

/// 记录 ERROR 级别日志的宏
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        $crate::logging::log_internal(
            $crate::logging::LogLevel::Error,
            module_path!(),
            format!($($arg)*)
        )
    };
}

/// 记录 DEBUG 级别日志的宏
#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        $crate::logging::log_internal(
            $crate::logging::LogLevel::Debug,
            module_path!(),
            format!($($arg)*)
        )
    };
}

/// 记录 WARN 级别日志的宏
#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        $crate::logging::log_internal(
            $crate::logging::LogLevel::Warn,
            module_path!(),
            format!($($arg)*)
        )
    };
}

// ==================== Public API ====================

/// 内部初始化日志系统
fn init_inner(log_dir: PathBuf, min_level: LogLevel) {
    let level = std::env::var("WE_LOG")
        .ok()
        .and_then(|s| LogLevel::from_str(&s))
        .unwrap_or(min_level);

    let logger = Logger::new(log_dir, level);
    LOGGER.set(logger).ok();
}

/// 初始化日志系统（在应用启动时调用）
pub fn init_logging(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let log_dir = app.path().app_data_dir()?.join("logs");
    fs::create_dir_all(&log_dir)?;

    init_inner(log_dir, LogLevel::Info);
    Ok(())
}

/// 内部日志记录函数，被 log_info!/log_error! 等宏调用
pub fn log_internal(level: LogLevel, target: &str, message: String) {
    if let Some(logger) = LOGGER.get() {
        logger.log(level, target, &message);
    } else {
        let timestamp = Local::now().format("%Y-%m-%dT%H:%M:%S%.6f%:z");
        let _ = writeln!(
            io::stdout(),
            "{}  {} {}: {}",
            timestamp,
            level.as_str(),
            target,
            message,
        );
    }
}

// ==================== Tauri Commands ====================

/// 从前端接收日志并记录到后端日志系统
#[tauri::command]
pub fn log_frontend(level: String, message: String) {
    match level.as_str() {
        "debug" => log_debug!("[Frontend] {}", message),
        "info" => log_info!("[Frontend] {}", message),
        "warn" => log_warn!("[Frontend] {}", message),
        "error" => log_error!("[Frontend] {}", message),
        _ => log_info!("[Frontend] [Unknown] {}", message),
    }
}
