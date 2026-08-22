//! 启动引导数据结构

use crate::account::models::AccountInfo;
use crate::game::models::GameFolder;
use crate::shared::models::SystemInfo;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 前端初始化所需的全部数据（一次性聚合）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BootstrapData {
    /// 是否首次运行（迎新界面）
    pub first_run: bool,
    /// 背景配置（JSON 镜像）
    pub background: Value,
    /// 当前游戏根目录
    pub game_root: String,
    /// 已添加的游戏文件夹列表
    pub game_folders: Vec<GameFolder>,
    /// 账户列表
    pub accounts: Vec<AccountInfo>,
    /// 当前活动账户
    pub current_account: Option<AccountInfo>,
    /// 系统信息
    pub system_info: SystemInfo,
    /// 配置版本
    pub version: u32,
}
