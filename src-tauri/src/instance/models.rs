use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 实例元数据（旧版元数据格式，用于兼容迁移）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceMeta {
    /// 实例唯一标识
    pub id: String,
    /// 实例显示名称
    pub name: String,
    /// 版本 ID（如 "1.20.1"、"1.19.2-forge-43.2.0"）
    #[serde(alias = "version")]
    pub version_id: String,
    /// 模组加载器类型
    pub loader_type: ModLoaderType,
    /// 模组加载器版本
    pub loader_version: Option<String>,
    /// 自定义图标路径
    pub icon_path: Option<String>,
    /// 创建时间（Unix 时间戳）
    pub created_at: i64,
    /// 最后游玩时间
    pub last_played: Option<i64>,
    /// 游戏设置（可选）
    #[serde(default)]
    pub game_settings: Option<GameSettings>,
}

impl Default for InstanceMeta {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: String::new(),
            version_id: String::new(),
            loader_type: ModLoaderType::Vanilla,
            loader_version: None,
            icon_path: None,
            created_at: 0,
            last_played: None,
            game_settings: None,
        }
    }
}

/// 版本隔离模式
///
/// 决定依赖库（libraries/assets）的存储方式：
/// - `Global`：所有实例共享同一份依赖
/// - `Version`：按 Minecraft 版本隔离
/// - `Instance`：每个实例完全独立
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IsolationMode {
    /// 全局共享模式
    Global,
    /// 按版本隔离
    Version,
    /// 按实例完全隔离
    Instance,
}

/// 实例游戏设置
///
/// 涵盖 Java 参数、内存分配、窗口尺寸、版本隔离等可配置项。
/// 所有字段均为 Option，允许按需覆盖全局默认值。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    /// 是否使用实例独立的设置（否则继承全局配置）
    #[serde(default)]
    pub use_instance_settings: bool,
    /// Java 可执行文件路径
    pub java_path: Option<String>,
    /// Java 版本标识
    pub java_version: Option<String>,
    /// 最小内存（MB）
    pub min_memory: Option<u64>,
    /// 最大内存（MB）
    pub max_memory: Option<u64>,
    /// JVM 附加参数列表
    pub jvm_args: Option<Vec<String>>,
    /// 版本隔离模式
    pub isolation_mode: Option<IsolationMode>,
    /// 窗口宽度（像素）
    pub width: Option<u32>,
    /// 窗口高度（像素）
    pub height: Option<u32>,
    /// 是否全屏
    pub fullscreen: Option<bool>,
    /// 是否最大化
    pub maximized: Option<bool>,
    /// 是否启用垂直同步
    pub vsync: Option<bool>,
    /// 游戏内启动器是否可见
    pub launcher_visible: Option<bool>,
    /// 强制使用的玩家名称（离线模式）
    pub player_name: Option<String>,
    /// 自动连接服务器地址
    pub server_address: Option<String>,
    /// 自动连接服务器端口
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

/// 游戏实例（运行时表示）
///
/// 代表一个可启动/已扫描到的 Minecraft 实例，
/// 包含版本、路径、模组加载器等信息。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInstance {
    /// 实例唯一标识
    pub id: String,
    /// 实例显示名称
    pub name: String,
    /// 版本 ID（如 "1.20.1"）
    #[serde(alias = "version")]
    pub version_id: String,
    /// 模组加载器类型
    pub loader_type: ModLoaderType,
    /// 模组加载器版本
    pub loader_version: Option<String>,
    /// 实例所在目录路径
    pub path: String,
    /// 自定义图标路径
    pub icon_path: Option<String>,
    /// 最后游玩时间
    pub last_played: Option<i64>,
    /// 创建时间（Unix 时间戳）
    pub created_at: i64,
    /// 是否启用
    pub enabled: bool,
    /// 游戏设置（可选）
    pub game_settings: Option<GameSettings>,
}

/// 已知的 Minecraft 目录路径
///
/// 用户添加的自定义 .minecraft 目录记录，
/// 支持多目录管理与默认目录标记。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnownPath {
    /// 目录唯一标识
    pub id: String,
    /// 目录显示名称
    pub name: String,
    /// 目录绝对路径
    pub path: String,
    /// 是否为默认目录
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
