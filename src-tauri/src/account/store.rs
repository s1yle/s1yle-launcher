//! 账户模块持久化层（Repository）
//!
//! 读写 `.wecraft.json` 的 `accounts` 顶层键。`Account` 的 token 字段由
//! `#[serde(skip)]` 保证绝不落盘，仅存系统密钥环（见 `manager.rs`）。

use std::path::Path;
use crate::account::models::AccountManager;
use crate::config_io;
use serde_json::Value;

/// 从磁盘加载账户数据（反序列化为 AccountManager）
pub fn load_accounts(config_path: &Path) -> AccountManager {
    config_io::read_section::<AccountManager>(config_path, "accounts").unwrap_or_default()
}

/// 将账户数据写入磁盘（token 字段因 `#[serde(skip)]` 自动剥离）
pub fn save_accounts(config_path: &Path, manager: &AccountManager) -> Result<(), String> {
    let value =
        serde_json::to_value(manager).map_err(|e| format!("序列化账户失败: {}", e))?;
    config_io::write_section_value(config_path, "accounts", &value)
}

/// 读取账号节的原始 JSON（用于旧格式 token 迁移检测）
pub fn load_accounts_raw(config_path: &Path) -> Value {
    config_io::read_section::<Value>(config_path, "accounts").unwrap_or_default()
}

/// 读取 app 节的原始 JSON（用于 login_state 迁移检测）
pub fn load_app_raw(config_path: &Path) -> Option<Value> {
    config_io::read_section::<Value>(config_path, "app")
}
