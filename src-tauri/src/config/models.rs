use std::path::PathBuf;
use std::sync::Mutex;

use chrono::Local;
use serde::{Deserialize, Serialize};

use crate::app_context::AppContext;
use crate::types::AccountType;

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

/// 登录状态（持久化到配置）
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
            login_time: Local::now().to_rfc3339(),
        }
    }
}

impl StoreLoginState {
    pub fn new_logged_in(role: AccountType, uuid: Option<String>) -> Self {
        Self {
            is_logged_in: true,
            logged_in_type: role,
            current_acc_uuid: uuid,
            login_time: Local::now().to_rfc3339(),
        }
    }
}

/// 全局应用配置（.wecraft.json 的 app 节）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemConfig {
    /// 选中的游戏根
    pub game_root: PathBuf,

    /// 多窗口位置配置
    #[serde(default)]
    pub window_positions: WindowPositions,

    /// 登录状态
    #[serde(default)]
    pub login_state: StoreLoginState,

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
            login_state: StoreLoginState::default(),
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
