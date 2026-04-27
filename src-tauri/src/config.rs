use once_cell::sync::Lazy;
use tauri::is_dev;

pub const DEV: bool = is_dev();
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};

use crate::log_info;

/// # BASE_PATH
pub static BASE_PATH: Lazy<PathBuf> =
    Lazy::new(|| std::env::current_dir().unwrap_or(PathBuf::from("")));

/// # APP 的名字
#[allow(dead_code)]
pub static APP_NAME: Lazy<PathBuf> = Lazy::new(|| PathBuf::from(".smcl"));

/// # minecraft 根目录
pub static DEAMON_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join("minecraft"));

/// # 默认的 实例名称
pub static DEFAULT_DEAMON_PATH: Lazy<PathBuf> =
    Lazy::new(|| BASE_PATH.join("minecraft").join("default"));

/// # 下载路径
pub static DOWNLOAD_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| CONFIG_APPLICATION.join("download"));

pub static INSTANCE_META_FILE_NAME: &str = "instance_meta.json";

/// # InstanceMeta 路径
pub static INSTANCE_META_PATH: Lazy<PathBuf> =
    Lazy::new(|| DEAMON_BASE_PATH.join(PathBuf::from(INSTANCE_META_FILE_NAME)));

/// # 应用配置目录
pub static CONFIG_APPLICATION: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&BASE_PATH)
        .unwrap_or(&PathBuf::new())
        .join(".smcl")
});

/// # 应用配置文件名  /.smcl/app_config.json
pub static CONFIG_FILE_PATH: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&CONFIG_APPLICATION)
        .unwrap_or(&PathBuf::from(".smcl"))
        .join("app_config.json")
});

/// # 最小窗口宽度
pub static MIN_WIDTH: Lazy<u32> = Lazy::new(|| 960);

/// # 最小窗口高度
pub static MIN_HEIGHT: Lazy<u32> = Lazy::new(|| 600);

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppSettings {
    pub java_path: String,
    pub memory_mb: u32,
    pub download_threads: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct DownloadConfig {
    pub base_path: String,
    pub max_concurrent: u32,
    pub timeout_seconds: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[allow(dead_code)]
pub struct PathConfig {
    pub app_data: PathBuf,
    pub download_cache: PathBuf,
    pub instances: PathBuf,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub game_settings: AppSettings,
    pub download_config: DownloadConfig,
    pub language: String,
    pub theme: String,
    pub accent_color: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            game_settings: AppSettings {
                java_path: "java".to_string(),
                memory_mb: 2048,
                download_threads: 4,
            },
            download_config: DownloadConfig {
                base_path: String::new(),
                max_concurrent: 4,
                timeout_seconds: 300,
            },
            language: "zh-CN".to_string(),
            theme: "dark".to_string(),
            accent_color: "indigo".to_string(),
        }
    }
}

struct ConfigManager {
    config: AppConfig,
}

impl Default for ConfigManager {
    fn default() -> Self {
        Self {
            config: AppConfig::default(),
        }
    }
}

static CONFIG_MANAGER: OnceCell<Mutex<ConfigManager>> = OnceCell::new();

pub fn get_config_path() -> Result<PathBuf, String> {
    let config_dir = &*CONFIG_APPLICATION;
    fs::create_dir_all(config_dir.clone()).map_err(|e| format!("创建配置目录失败: {}", e))?;

    Ok((*CONFIG_FILE_PATH.clone()).to_path_buf())
}

pub fn init_config() {
    CONFIG_MANAGER
        .set(Mutex::new(ConfigManager::default()))
        .unwrap_or_else(|_| panic!("配置管理器已初始化"));

    if let Err(e) = load_config_from_disk_internal() {
        eprintln!("加载配置失败: {}", e);
    }

    println!("✅ 配置管理器初始化完成");
}

fn load_config_from_disk_internal() -> Result<(), String> {
    let path = get_config_path()?;

    if !path.exists() {
        println!("ℹ️ 配置文件不存在，使用默认配置");
        return Ok(());
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("读取配置文件失败: {}", e))?;

    let loaded_config: AppConfig =
        serde_json::from_str(&content).map_err(|e| format!("解析配置文件失败: {}", e))?;

    let mut manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    manager.config = loaded_config;
    println!("✅ 配置加载成功");

    Ok(())
}

fn save_config_to_disk_internal() -> Result<(), String> {
    let path = get_config_path()?;

    let manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    let json_str = serde_json::to_string_pretty(&manager.config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&path, json_str).map_err(|e| format!("写入配置文件失败: {}", e))?;

    log_info!("配置保存成功: {}", path.to_string_lossy());

    Ok(())
}

#[allow(dead_code)]
pub fn get_config() -> Result<AppConfig, String> {
    let manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(manager.config.clone())
}

#[allow(dead_code)]
pub fn update_config(new_config: AppConfig) -> Result<(), String> {
    let mut manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    manager.config = new_config;

    drop(manager);
    save_config_to_disk_internal()?;

    Ok(())
}

pub fn get_game_settings() -> Result<AppSettings, String> {
    let manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(manager.config.game_settings.clone())
}

pub fn update_game_settings(settings: AppSettings) -> Result<(), String> {
    let mut manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    manager.config.game_settings = settings;

    drop(manager);
    save_config_to_disk_internal()?;

    Ok(())
}

pub fn get_download_config() -> Result<DownloadConfig, String> {
    let manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(manager.config.download_config.clone())
}

pub fn update_download_config(config: DownloadConfig) -> Result<(), String> {
    let mut manager = CONFIG_MANAGER
        .get()
        .ok_or("配置管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    manager.config.download_config = config;

    drop(manager);
    save_config_to_disk_internal()?;

    Ok(())
}
