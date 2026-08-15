use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 版本隔离模式
///
/// 决定依赖库（libraries/assets）的存储方式：
/// - `Global`：所有游戏共享同一份依赖
/// - `Version`：按 Minecraft 版本隔离
/// - `Game`：每个游戏完全独立
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

/// 游戏游戏设置（前端契约 DTO）
///
/// 全字段 Option，前端增量提交，由 [`Game`] 与记录字段双向转换。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    /// 是否使用游戏独立的设置（否则继承全局配置）
    #[serde(default)]
    pub use_game_settings: bool,
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
            use_game_settings: false,
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

/// 游戏（唯一游戏结构）
///
/// 既是持久化记录（`{base}/.minecraft/versions/{game_name}/wecraft_{game_name}.json`），
/// 也是返回前端的运行时视图。`path` 与 `game_settings` 为计算字段，不持久化。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    /// 游戏唯一标识
    pub id: String,
    /// 游戏显示名称（与游戏目录名一致）
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
    // ==================== 计算字段（不持久化，但必须序列化给前端） ====================
    // 注意：不能使用 `#[serde(skip)]`（序列化+反序列化都跳过，前端收不到字段）。
    // `skip_deserializing` = 反序列化忽略（读记录文件时用默认值），序列化保留（invoke 返回前端）。
    /// 游戏所在目录路径
    #[serde(skip_deserializing)]
    pub path: String,
    /// 游戏设置视图（由记录字段派生）
    #[serde(skip_deserializing)]
    pub game_settings: Option<GameSettings>,
    /// 版本损坏标记（扫描时计算：目录内缺少对应 jar/json 产物）
    #[serde(skip_deserializing)]
    pub broken: bool,
    /// 空壳标记（扫描时计算：目录内除记录与外置资源外无任何文件，未下载的"空壳"游戏）
    #[serde(skip_deserializing)]
    pub empty: bool,
}

impl Game {
    /// 创建新游戏记录（默认设置）
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
            broken: false,
            empty: false,
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
            use_game_settings: true,
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
    fn from(game: &Game) -> Self {
        game.to_game_settings()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 计算字段（path/game_settings/broken/empty）必须能序列化给前端，
    /// 禁止使用 `#[serde(skip)]`（会把字段从序列化中一并剔除）
    #[test]
    fn computed_fields_are_serialized() {
        let mut game = Game::new("test", "1.20.4", ModLoaderType::Vanilla, None, None);
        game.broken = true;
        game.empty = true;
        game.path = "/tmp/game-root/versions/test".to_string();
        game.game_settings = Some((&game).into());

        let json = serde_json::to_string(&game).unwrap();
        assert!(json.contains("\"broken\":true"), "broken 未序列化: {}", json);
        assert!(json.contains("\"empty\":true"), "empty 未序列化: {}", json);
        assert!(json.contains("\"path\""), "path 未序列化: {}", json);
        assert!(json.contains("\"game_settings\""), "game_settings 未序列化: {}", json);

        // 反序列化时计算字段被忽略（记录文件不含这些字段）
        let loaded: Game = serde_json::from_str(&json).unwrap();
        assert!(!loaded.broken);
        assert!(!loaded.empty);
        assert!(loaded.path.is_empty());
        assert!(loaded.game_settings.is_none());
    }
}
