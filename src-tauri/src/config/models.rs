use std::{collections::HashMap, path::PathBuf, sync::Mutex};

use chrono::Local;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::to_string_pretty;
use tauri::Manager;

use crate::{APP_HANDLE, account::AccountType, config::{get_config, get_config_path, get_config_value}};

/// 配置文件版本
pub const CONFIG_VERSION: u32 = 1;

/// BASE_PATH (使用 exe 所在目录而非当前工作目录)
pub static BASE_PATH: Lazy<PathBuf> =
    Lazy::new(|| {
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from(""))
    });

/// minecraft 根目录（旧版，保持兼容）
pub static DEAMON_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join("minecraft"));

/// 默认的实例名称（旧版，保持兼容）
pub static DEFAULT_DEAMON_PATH: Lazy<PathBuf> =
    Lazy::new(|| BASE_PATH.join("minecraft").join("default"));

/// Minecraft 根目录
pub static MINECRAFT_DIR: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join(".minecraft"));

/// 版本库目录
pub static VERSIONS_DIR: Lazy<PathBuf> = Lazy::new(|| MINECRAFT_DIR.join("versions"));

/// 共享库目录
pub static LIBRARIES_DIR: Lazy<PathBuf> = Lazy::new(|| MINECRAFT_DIR.join("libraries"));

/// 资源目录
pub static ASSETS_DIR: Lazy<PathBuf> = Lazy::new(|| MINECRAFT_DIR.join("assets"));

/// 实例配置目录
pub static INSTANCE_CONFIGS_DIR: Lazy<PathBuf> = 
    Lazy::new(|| CONFIG_APPLICATION.join("instance_configs"));

/// 下载路径（/.smcl/download/）
pub static DOWNLOAD_BASE_PATH: Lazy<PathBuf> = 
    Lazy::new(|| CONFIG_APPLICATION.join("download").join("versions"));

/// 实例元数据文件名（旧版，保持兼容）
pub static INSTANCE_META_FILE_NAME: &str = "instance_meta.json";

/// InstanceMeta 路径（旧版，保持兼容）
pub static INSTANCE_META_PATH: Lazy<PathBuf> =
    Lazy::new(|| DEAMON_BASE_PATH.join(INSTANCE_META_FILE_NAME));

/// 元数据存储模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MetaMode {
    /// 分布式模式（默认）：minecraft/{instance_name}/{version}.json
    Distributed,
    /// 集中式模式（兼容）：minecraft/instance_meta.json
    Centralized,
}

impl Default for MetaMode {
    fn default() -> Self {
        MetaMode::Distributed
    }
}

/// 元数据存储模式（运行时配置）
pub static INSTANCE_META_MODE: Lazy<MetaMode> = Lazy::new(|| {
    // 默认使用分布式模式
    // 后续可以从配置文件读取
    MetaMode::Distributed
});

/// 应用配置目录（隐藏文件夹 /.smcl）
pub static CONFIG_APPLICATION: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&BASE_PATH)
        .unwrap_or(&PathBuf::new())
        .join(".smcl")
});

/// 应用配置文件名 /.smcl/app_config.json
pub static CONFIG_FILE_PATH: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&CONFIG_APPLICATION)
        .unwrap_or(&PathBuf::from(".smcl"))
        .join("app_config.json")
});

/// 隐藏文件夹属性（Windows）
#[cfg(target_os = "windows")]
pub fn _set_hidden_attribute(path: &std::path::Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows::Win32::Storage::FileSystem::{SetFileAttributesW, FILE_ATTRIBUTE_HIDDEN};
    use windows::core::PCWSTR;
    
    if path.exists() {
        // 使用 Windows API 设置隐藏属性
        let wide_path: Vec<u16> = std::ffi::OsStr::new(path)
            .encode_wide()
            .chain(Some(0))
            .collect();
        
        unsafe {
            let result = SetFileAttributesW(PCWSTR(wide_path.as_ptr()), FILE_ATTRIBUTE_HIDDEN);
            if result.is_err() {
                return Err(format!("设置隐藏属性失败"));
            }
        }
    }
    Ok(())
}

/// 隐藏文件夹属性（跨平台）
#[cfg(not(target_os = "windows"))]
pub fn _set_hidden_attribute(_path: &std::path::Path) -> Result<(), String> {
    // Unix-like 系统使用 . 前缀已经是隐藏文件夹
    Ok(())
}

/// 路径配置结构
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PathConfig {
    /// 实例根目录（默认：{base}/minecraft）
    #[serde(default = "default_daemon_base_path")]
    pub daemon_base_path: PathBuf,
    
    /// 下载根目录（默认：{config_app}/download）
    #[serde(default = "default_download_base_path")]
    pub download_base_path: PathBuf,
}

fn default_daemon_base_path() -> PathBuf {
    BASE_PATH.join("minecraft")
}

fn default_download_base_path() -> PathBuf {
    CONFIG_APPLICATION.join("download")
}

impl Default for PathConfig {
    fn default() -> Self {
        Self {
            daemon_base_path: default_daemon_base_path(),
            download_base_path: default_download_base_path(),
        }
    }
}

impl PathConfig {
    /// 获取实例元数据路径（自动计算）
    pub fn get_instance_meta_path(&self) -> PathBuf {
        self.daemon_base_path.join(INSTANCE_META_FILE_NAME)
    }
    
    /// 获取指定实例的目录路径
    pub fn get_instance_dir(&self, instance_name: &str) -> PathBuf {
        self.daemon_base_path.join(instance_name)
    }
    
    /// 获取指定实例的 versions 目录
    pub fn get_versions_dir(&self, instance_name: &str) -> PathBuf {
        self.get_instance_dir(instance_name).join("versions")
    }
    
    /// 获取指定实例的 libraries 目录
    pub fn get_libraries_dir(&self, instance_name: &str) -> PathBuf {
        self.get_instance_dir(instance_name).join("libraries")
    }
    
    /// 获取指定实例的 assets 目录
    pub fn get_assets_dir(&self, instance_name: &str) -> PathBuf {
        self.get_instance_dir(instance_name).join("assets")
    }
    
    /// 获取指定实例的 natives 目录
    pub fn get_natives_dir(&self, instance_name: &str) -> PathBuf {
        self.get_instance_dir(instance_name).join("natives")
    }
    
    // ==================== 版本目录路径方法 ====================
    
    /// 获取版本目录
    pub fn get_version_dir(&self, version_id: &str) -> PathBuf {
        (*VERSIONS_DIR).join(version_id)
    }
    
    /// 获取全局库目录
    pub fn get_global_libraries_dir(&self) -> PathBuf {
        (*LIBRARIES_DIR).clone()
    }
    
    /// 获取全局资源目录
    pub fn get_global_assets_dir(&self) -> PathBuf {
        (*ASSETS_DIR).clone()
    }
    
    /// 获取实例配置文件路径
    pub fn get_instance_config_path(&self, instance_id: &str) -> PathBuf {
        (*INSTANCE_CONFIGS_DIR).join(format!("{}.json", instance_id))
    }
}

/// 最小窗口宽度
pub static MIN_WIDTH: Lazy<u32> = Lazy::new(|| 800);

/// 最小窗口高度
pub static MIN_HEIGHT: Lazy<u32> = Lazy::new(|| 600);

// ==================== 配置结构体 ====================

/// 全局应用配置
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
    
    /// 路径配置
    #[serde(default)]
    pub path_config: PathConfig,
    
    /// 已知文件夹列表
    #[serde(default)]
    pub known_folders: Vec<serde_json::Value>,
    
    /// 实例配置映射（实例 ID -> 配置）
    #[serde(default)]
    pub instance_configs: HashMap<String, InstanceConfig>,

    #[serde(default)]
    pub login_state: StoreLoginState,
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
            path_config: PathConfig::default(),
            known_folders: Vec::new(),
            instance_configs: HashMap::new(),
            login_state: StoreLoginState::default(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct StoreLoginState {
    pub is_logged_in: bool,
    pub logged_in_type: AccountType,
    pub current_acc_uuid: Option<String>,
    pub login_time: String,
}

impl Default for StoreLoginState {
    fn default() -> Self {
        Self {
            is_logged_in: false,
            logged_in_type: AccountType::None,
            current_acc_uuid: None,
            login_time: Local::now().to_rfc3339()
        }
    }
}

impl StoreLoginState {
    pub fn new_logged_in(role: AccountType, uuid:Option<String>) -> Self {
        Self {
            is_logged_in: true,
            logged_in_type: role,
            current_acc_uuid: uuid,
            login_time: Local::now().to_rfc3339(),
        }
    }
}

/// 窗口位置和大小配置
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct WindowPosition {
    /// 窗口 X 坐标
    pub x: i32,
    /// 窗口 Y 坐标
    pub y: i32,
    /// 窗口宽度
    pub width: u32,
    /// 窗口高度
    pub height: u32,
    /// 是否最大化
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

/// 用户偏好配置
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
    /// 创建默认用户偏好
    pub fn new() -> Self {
        Self::default()
    }
}

/// 下载配置
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

/// 实例配置结构
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

/// Java 配置
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

/// 内存配置
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

/// 图形配置
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

/// 配置管理器（Tauri 可管理状态）
pub struct ConfigManager {
    /// 应用配置（线程安全）
    pub config: Mutex<AppConfig>,
    /// 窗口位置（线程安全）
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
