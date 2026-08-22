//! 持久化数据结构（纯 DTO，零业务逻辑）
//!
//! 这些结构体对应 `.wecraft.json` 中的各个顶层键。
//! 每个业务模块读写自己的顶层键，互不影响。

use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::game::models::{GameFolder, GameSettings};

/// 游戏模块的持久化数据（顶层键 `game`）
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct GamePersist {
    /// 已添加的游戏文件夹列表
    #[serde(default)]
    pub folders: Vec<GameFolder>,
    /// 全局游戏设置（未启用游戏独立设置时的默认值）
    #[serde(default)]
    pub global_settings: GameSettings,
}

/// 应用模块的持久化数据（顶层键 `app`）
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppPersist {
    /// 配置文件版本号
    #[serde(default = "default_version")]
    pub version: u32,
    /// 是否显示迎新界面
    #[serde(default = "default_true")]
    pub first_run: bool,
    /// 背景配置（统一存入 `app` 节，避免与顶层 `background` 键重复）
    #[serde(default)]
    pub background: serde_json::Value,
}

fn default_version() -> u32 {
    1
}

fn default_true() -> bool {
    true
}

// ==================== 窗口位置 ====================

/// 最小窗口宽度
pub const MIN_WIDTH: u32 = 800;
/// 最小窗口高度
pub const MIN_HEIGHT: u32 = 600;

/// 单个窗口的位置和大小配置
#[derive(Serialize, Deserialize, Clone, Debug)]
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
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
            maximized: false,
        }
    }
}

/// 多窗口位置存储（按 label 索引）
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct WindowPositions {
    #[serde(default)]
    pub main: Option<WindowPosition>,
}

/// 校验并修正窗口位置（避免负坐标和过小尺寸）
pub fn window_check(pos: &mut WindowPosition) {
    if pos.x <= 0 {
        pos.x = 1;
    }
    if pos.y <= 0 {
        pos.y = 1;
    }
    if pos.height < MIN_HEIGHT {
        pos.height = MIN_HEIGHT;
    }
    if pos.width < MIN_WIDTH {
        pos.width = MIN_WIDTH;
    }
}

// ==================== 应用配置（顶层键 `app`） ====================

/// 配置文件版本
pub const CONFIG_VERSION: u32 = 1;

/// 全局应用配置（.wecraft.json 的 app 节）
/// 登录状态已移入 accounts 节（AccountManager.login_state），此处不存储
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemConfig {
    /// 已添加的游戏文件夹列表（持久化于 app.game_folders）
    #[serde(default)]
    pub game_folders: Vec<GameFolder>,

    /// 多窗口位置配置
    #[serde(default)]
    pub window_positions: WindowPositions,

    /// 全局游戏设置（未启用游戏独立设置时的默认值，所有游戏共用）
    #[serde(default)]
    pub game_settings: GameSettings,

    /// 配置文件版本
    #[serde(default = "default_config_version")]
    pub version: u32,

    /// 背景配置（前端 BackgroundConfig 的 JSON 镜像，缺省为 null）
    #[serde(default)]
    pub background: Value,

    /// 是否显示迎新界面（首次运行 / 重装后为 true，进入启动器后置 false）
    #[serde(default = "default_true")]
    pub first_run: bool,
}

fn default_config_version() -> u32 {
    CONFIG_VERSION
}

impl Default for SystemConfig {
    fn default() -> Self {
        Self {
            game_folders: Vec::new(),
            window_positions: WindowPositions::default(),
            game_settings: GameSettings::default(),
            version: CONFIG_VERSION,
            background: Value::Null,
            first_run: true,
        }
    }
}

/// 系统信息（供前端访问操作系统 / 架构 / 启动器数据目录）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    /// 启动器数据目录（.wecraft），供前端访问全局兜底图标等
    pub wecraft_dir: String,
}
