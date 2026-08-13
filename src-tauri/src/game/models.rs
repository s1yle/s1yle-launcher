use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
    Isolated,
}

impl Default for IsolationMode {
    fn default() -> Self {
        IsolationMode::Isolated
    }
}

/// 实例游戏设置（前端契约 DTO）
///
/// 全字段 Option，前端增量提交，由 [`GameInstance`] 与记录字段双向转换。
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
            isolation_mode: Some(IsolationMode::Isolated),
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

/// 游戏实例（唯一实例结构）
///
/// 既是持久化记录（`{base}/.minecraft/versions/{game_name}/wecraft_{game_name}.json`），
/// 也是返回前端的运行时视图。`path` 与 `game_settings` 为计算字段，不持久化。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    /// 实例唯一标识
    pub id: String,
    /// 实例显示名称（与实例目录名一致）
    pub name: String,
    /// 版本 ID（如 "1.20.1"）
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
    /// 是否启用
    pub enabled: bool,
    // ==================== 游戏设置（持久化，平铺） ====================
    /// Java 可执行文件路径
    pub java_path: Option<String>,
    /// Java 版本标识
    pub java_version: Option<String>,
    /// 最小内存（MB）
    pub min_memory: u64,
    /// 最大内存（MB）
    pub max_memory: u64,
    /// JVM 附加参数列表
    pub jvm_args: Vec<String>,
    /// 版本隔离模式
    pub isolation_mode: IsolationMode,
    /// 窗口宽度（像素）
    pub width: u32,
    /// 窗口高度（像素）
    pub height: u32,
    /// 是否全屏
    pub fullscreen: bool,
    /// 是否最大化
    pub maximized: bool,
    /// 是否启用垂直同步
    pub vsync: bool,
    /// 游戏内启动器是否可见
    pub launcher_visible: bool,
    /// 强制使用的玩家名称（离线模式）
    pub player_name: Option<String>,
    /// 自动连接服务器地址
    pub server_address: Option<String>,
    /// 自动连接服务器端口
    pub server_port: Option<u16>,
    // ==================== 计算字段（不持久化） ====================
    /// 实例所在目录路径
    #[serde(skip)]
    pub path: String,
    /// 游戏设置视图（由记录字段派生）
    #[serde(skip)]
    pub game_settings: Option<GameSettings>,
}

impl Game {
    /// 创建新实例记录（默认设置）
    pub fn new(
        name: &str,
        version_id: &str,
        loader_type: ModLoaderType,
        loader_version: Option<String>,
        icon_path: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            version_id: version_id.to_string(),
            loader_type,
            loader_version,
            icon_path,
            created_at: chrono::Utc::now().timestamp(),
            last_played: None,
            enabled: true,
            java_path: None,
            java_version: None,
            min_memory: 1024,
            max_memory: 2048,
            jvm_args: Vec::new(),
            isolation_mode: IsolationMode::Isolated,
            width: 1280,
            height: 720,
            fullscreen: false,
            maximized: true,
            vsync: true,
            launcher_visible: true,
            player_name: None,
            server_address: None,
            server_port: None,
            path: String::new(),
            game_settings: None,
        }
    }

    /// 应用游戏设置 DTO（增量覆盖，忽略 None 字段）
    pub fn apply_settings(&mut self, settings: &GameSettings) {
        if let Some(v) = &settings.java_path {
            self.java_path = Some(v.clone());
        }
        if let Some(v) = &settings.java_version {
            self.java_version = Some(v.clone());
        }
        if let Some(v) = settings.min_memory {
            self.min_memory = v;
        }
        if let Some(v) = settings.max_memory {
            self.max_memory = v;
        }
        if let Some(v) = &settings.jvm_args {
            self.jvm_args = v.clone();
        }
        if let Some(v) = &settings.isolation_mode {
            self.isolation_mode = v.clone();
        }
        if let Some(v) = settings.width {
            self.width = v;
        }
        if let Some(v) = settings.height {
            self.height = v;
        }
        if let Some(v) = settings.fullscreen {
            self.fullscreen = v;
        }
        if let Some(v) = settings.maximized {
            self.maximized = v;
        }
        if let Some(v) = settings.vsync {
            self.vsync = v;
        }
        if let Some(v) = settings.launcher_visible {
            self.launcher_visible = v;
        }
        if let Some(v) = &settings.player_name {
            self.player_name = Some(v.clone());
        }
        if let Some(v) = &settings.server_address {
            self.server_address = Some(v.clone());
        }
        if let Some(v) = settings.server_port {
            self.server_port = Some(v);
        }
    }

    /// 派生设置视图（供前端读取）
    pub fn to_game_settings(&self) -> GameSettings {
        GameSettings {
            use_instance_settings: true,
            java_path: self.java_path.clone(),
            java_version: self.java_version.clone(),
            min_memory: Some(self.min_memory),
            max_memory: Some(self.max_memory),
            jvm_args: Some(self.jvm_args.clone()),
            isolation_mode: Some(self.isolation_mode.clone()),
            width: Some(self.width),
            height: Some(self.height),
            fullscreen: Some(self.fullscreen),
            maximized: Some(self.maximized),
            vsync: Some(self.vsync),
            launcher_visible: Some(self.launcher_visible),
            player_name: self.player_name.clone(),
            server_address: self.server_address.clone(),
            server_port: self.server_port,
        }
    }
}

impl From<&Game> for GameSettings {
    fn from(instance: &Game) -> Self {
        instance.to_game_settings()
    }
}
