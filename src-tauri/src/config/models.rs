use std::{collections::HashMap, path::PathBuf, sync::Mutex};

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

/// # 配置文件版本
pub const CONFIG_VERSION: u32 = 1;

/// # BASE_PATH
pub static BASE_PATH: Lazy<PathBuf> =
    Lazy::new(|| std::env::current_dir().unwrap_or(PathBuf::from("")));

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

// ==================== 配置结构体 ====================

/// # 全局应用配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    /// 配置文件版本
    #[serde(default = "default_version")]
    pub version: u32,
    
    /// 应用基础路径
    pub base_path: PathBuf,
    
    /// 窗口位置配置
    #[serde(default)]
    pub window_position: WindowPosition,
    
    /// 用户偏好配置
    #[serde(default)]
    pub preferences: UserPreferences,
    
    /// 下载配置
    #[serde(default)]
    pub download: DownloadConfig,
    
    /// 实例配置映射（实例 ID -> 配置）
    #[serde(default)]
    pub instance_configs: HashMap<String, InstanceConfig>,
}

fn default_version() -> u32 {
    CONFIG_VERSION
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: CONFIG_VERSION,
            base_path: (&*CONFIG_FILE_PATH).clone(),
            window_position: WindowPosition::default(),
            preferences: UserPreferences::default(),
            download: DownloadConfig::default(),
            instance_configs: HashMap::new(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

impl Default for WindowPosition {
    fn default() -> Self {
        Self {
            x: 0,
            y: 0,
            width: (&*MIN_WIDTH).clone(),
            height: (&*MIN_HEIGHT).clone(),
            maximized: false,
        }
    }
}

pub static SAVED_POSITION: Lazy<Mutex<Option<WindowPosition>>> = Lazy::new(|| Mutex::new(None));

/// # 用户偏好配置
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserPreferences {
    /// 主题模式 (dark/light/system)
    #[serde(default = "default_theme")]
    pub theme: String,
    
    /// 强调色
    #[serde(default = "default_accent")]
    pub accent_color: String,
    
    /// 语言
    #[serde(default = "default_language")]
    pub language: String,
    
    /// 是否启用动画
    #[serde(default = "default_true")]
    pub enable_animation: bool,
}

fn default_theme() -> String { "dark".to_string() }
fn default_accent() -> String { "indigo".to_string() }
fn default_language() -> String { "zh-CN".to_string() }
fn default_true() -> bool { true }

impl UserPreferences {
    pub fn new() -> Self {
        Self::default()
    }
}

/// # 下载配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DownloadConfig {
    /// 下载目录路径
    pub download_path: PathBuf,
    
    /// 并发下载数量
    #[serde(default = "default_concurrent")]
    pub concurrent_limit: u32,
    
    /// 是否自动校验文件
    #[serde(default = "default_true")]
    pub auto_verify: bool,
}

fn default_concurrent() -> u32 { 16 }

impl Default for DownloadConfig {
    fn default() -> Self {
        Self {
            download_path: (&*DOWNLOAD_BASE_PATH).clone(),
            concurrent_limit: 16,
            auto_verify: true,
        }
    }
}

/// # 实例配置结构
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstanceConfig {
    /// 实例 ID（与 GameInstance.id 一致）
    pub id: String,
    
    /// 实例名称
    pub name: String,
    
    /// 游戏版本
    pub version: String,
    
    /// 模组加载器类型
    pub loader_type: crate::modloader::ModLoaderType,
    
    /// 模组加载器版本
    pub loader_version: Option<String>,
    
    /// Java 配置
    #[serde(default)]
    pub java: JavaConfig,
    
    /// 内存配置
    #[serde(default)]
    pub memory: MemoryConfig,
    
    /// 图形配置
    #[serde(default)]
    pub graphics: GraphicsConfig,
    
    /// 自定义参数
    #[serde(default)]
    pub custom_args: Vec<String>,
    
    /// 图标路径
    pub icon_path: Option<String>,
    
    /// 最后游玩时间
    pub last_played: Option<i64>,
    
    /// 创建时间
    pub created_at: i64,
    
    /// 是否启用
    #[serde(default = "default_true")]
    pub enabled: bool,
}

impl Default for InstanceConfig {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            version: String::new(),
            loader_type: crate::modloader::ModLoaderType::Vanilla,
            loader_version: None,
            java: JavaConfig::default(),
            memory: MemoryConfig::default(),
            graphics: GraphicsConfig::default(),
            custom_args: Vec::new(),
            icon_path: None,
            last_played: None,
            created_at: chrono::Utc::now().timestamp(),
            enabled: true,
        }
    }
}

/// # Java 配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JavaConfig {
    /// Java 可执行文件路径
    pub java_path: Option<String>,
    
    /// Java 参数
    #[serde(default)]
    pub java_args: Vec<String>,
    
    /// 是否使用 bundled Java
    #[serde(default = "default_true")]
    pub use_bundled: bool,
}

impl Default for JavaConfig {
    fn default() -> Self {
        Self {
            java_path: None,
            java_args: Vec::new(),
            use_bundled: true,
        }
    }
}

/// # 内存配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MemoryConfig {
    /// 最小内存 (MB)
    #[serde(default = "default_min_memory")]
    pub min_memory: u32,
    
    /// 最大内存 (MB)
    #[serde(default = "default_max_memory")]
    pub max_memory: u32,
}

fn default_min_memory() -> u32 { 512 }
fn default_max_memory() -> u32 { 2048 }

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            min_memory: default_min_memory(),
            max_memory: default_max_memory(),
        }
    }
}

/// # 图形配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GraphicsConfig {
    /// 窗口宽度
    #[serde(default = "default_width")]
    pub width: u32,
    
    /// 窗口高度
    #[serde(default = "default_height")]
    pub height: u32,
    
    /// 是否全屏
    #[serde(default)]
    pub fullscreen: bool,
}

fn default_width() -> u32 { 1920 }
fn default_height() -> u32 { 1080 }

impl Default for GraphicsConfig {
    fn default() -> Self {
        Self {
            width: default_width(),
            height: default_height(),
            fullscreen: false,
        }
    }
}

pub struct ConfigManager {
    pub config: Mutex<AppConfig>,
    pub window: Mutex<WindowPosition>,
}

impl Default for ConfigManager {
    fn default() -> Self {
        Self {
            config: Mutex::new(AppConfig::default()),
            window: Mutex::new(WindowPosition::default())
        }
    }
}