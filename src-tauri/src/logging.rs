use chrono::Local;
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufWriter, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::OnceLock;
use tauri::Manager;

// ==================== LogLevel ====================

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum LogLevel {
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

impl LogLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO ",
            LogLevel::Warn => "WARN ",
            LogLevel::Error => "ERROR",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "debug" | "1" => Some(LogLevel::Debug),
            "info" | "2" => Some(LogLevel::Info),
            "warn" | "3" => Some(LogLevel::Warn),
            "error" | "4" => Some(LogLevel::Error),
            _ => None,
        }
    }

    fn ansi_color(&self) -> &'static str {
        match self {
            LogLevel::Debug => "\x1b[36m",
            LogLevel::Info => "\x1b[32m",
            LogLevel::Warn => "\x1b[33m",
            LogLevel::Error => "\x1b[31m",
        }
    }

    fn ansi_reset() -> &'static str {
        "\x1b[0m"
    }

    fn ansi_dim() -> &'static str {
        "\x1b[2m"
    }
}

// ==================== RotatingFileWriter ====================

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

static LOGGER: OnceLock<Logger> = OnceLock::new();

// ==================== Macros ====================

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

fn init_inner(log_dir: PathBuf, min_level: LogLevel) {
    let level = std::env::var("WE_LOG")
        .ok()
        .and_then(|s| LogLevel::from_str(&s))
        .unwrap_or(min_level);

    let logger = Logger::new(log_dir, level);
    LOGGER.set(logger).ok();
}

pub fn init_logging(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let log_dir = app.path().app_data_dir()?.join("logs");
    fs::create_dir_all(&log_dir)?;
    println!("日志存储位置: {}", log_dir.to_string_lossy());

    init_inner(log_dir, LogLevel::Info);
    log_info!("日志系统初始化完成");
    Ok(())
}

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
