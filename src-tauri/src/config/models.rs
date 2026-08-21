use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::app_context::AppContext;
use crate::game::models::GameSettings;

/// 配置文件版本
pub const CONFIG_VERSION: u32 = 1;

/// 最小窗口宽度
pub const MIN_WIDTH: u32 = 800;

/// 最小窗口高度
pub const MIN_HEIGHT: u32 = 600;

// ==================== 配置结构体 ====================

/// 单个窗口的位置和大小配置
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
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
            maximized: false,
        }
    }
}

/// 多窗口位置存储（按 label 索引）
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, Default)]
pub struct WindowPositions {
    #[serde(default)]
    pub main: Option<WindowPosition>,
}

/// 全局应用配置（.wecraft.json 的 app 节）
/// 登录状态已移入 accounts 节（AccountManager.login_state），此处不存储
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemConfig {
    /// 选中的游戏根
    pub game_root: PathBuf,

    /// 多窗口位置配置
    #[serde(default)]
    pub window_positions: WindowPositions,

    /// 全局游戏设置（未启用游戏独立设置时的默认值，所有游戏共用）
    #[serde(default)]
    pub game_settings: GameSettings,

    /// 配置文件版本
    #[serde(default = "default_version")]
    pub version: u32,

    /// 背景配置（前端 BackgroundConfig 的 JSON 镜像，缺省为 null）
    #[serde(default)]
    pub background: Value,

    /// 是否显示迎新界面（首次运行 / 重装后为 true，进入启动器后置 false）
    #[serde(default = "default_true")]
    pub first_run: bool,
}

fn default_version() -> u32 {
    CONFIG_VERSION
}

fn default_true() -> bool {
    true
}

impl Default for SystemConfig {
    fn default() -> Self {
        Self {
            game_root: PathBuf::new(),
            window_positions: WindowPositions::default(),
            game_settings: GameSettings::default(),
            version: CONFIG_VERSION,
            background: Value::Null,
            first_run: true,
        }
    }
}

/// 配置管理器（Tauri 可管理状态）
pub struct ConfigManager {
    /// 应用上下文（组合根注入，路径唯一事实源）
    pub ctx: AppContext,
    /// 应用配置（线程安全，单一事实源）
    pub config: Mutex<SystemConfig>,
}
