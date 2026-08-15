use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::app_context::AppContext;

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
    #[serde(default)]
    pub login: Option<WindowPosition>,
    #[serde(default)]
    pub loading: Option<WindowPosition>,
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

    /// 配置文件版本
    #[serde(default = "default_version")]
    pub version: u32,
}

fn default_version() -> u32 {
    CONFIG_VERSION
}

impl Default for SystemConfig {
    fn default() -> Self {
        Self {
            game_root: PathBuf::new(),
            window_positions: WindowPositions::default(),
            version: CONFIG_VERSION,
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
