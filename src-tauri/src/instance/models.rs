use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceMeta {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub icon_path: Option<String>,
    pub created_at: i64,
    pub last_played: Option<i64>,
}

impl Default for InstanceMeta {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: String::new(),
            version: String::new(),
            loader_type: ModLoaderType::Vanilla,
            loader_version: None,
            icon_path: None,
            created_at: 0,
            last_played: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IsolationMode {
    Global,
    Version,
    Instance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    // 基础设置
    #[serde(default)]
    pub use_instance_settings: bool,
    
    // Java 配置
    pub java_path: Option<String>,
    pub java_version: Option<String>,
    pub min_memory: Option<u64>,
    pub max_memory: Option<u64>,
    pub jvm_args: Option<Vec<String>>,
    
    // 版本隔离
    pub isolation_mode: Option<IsolationMode>,
    
    // 窗口配置
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fullscreen: Option<bool>,
    pub maximized: Option<bool>,
    pub vsync: Option<bool>,
    
    // 高级设置
    pub launcher_visible: Option<bool>,
    pub player_name: Option<String>,
    pub server_address: Option<String>,
    pub server_port: Option<u16>,
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            use_instance_settings: false,
            java_path: None,
            java_version: None,
            min_memory: Some(4096),
            max_memory: Some(8192),
            jvm_args: None,
            isolation_mode: Some(IsolationMode::Global),
            width: Some(1280),
            height: Some(720),
            fullscreen: Some(false),
            maximized: Some(true),
            vsync: Some(true),
            launcher_visible: Some(true),
            player_name: None,
            server_address: None,
            server_port: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInstance {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub path: String,
    pub icon_path: Option<String>,
    pub last_played: Option<i64>,
    pub created_at: i64,
    pub enabled: bool,
    pub game_settings: Option<GameSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnownPath {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_default: bool,
}

impl Default for KnownPath {
    fn default() -> Self {
        Self {
            id: String::from("default"),
            name: String::from("default"),
            path: String::new(),
            is_default: true,
        }
    }
}
