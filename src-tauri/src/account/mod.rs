//! 账户模块
//!
//! 职责划分：
//! - `models.rs`：类型定义（AccountInfo / Account / AccountManager / StoreLoginState）
//! - `manager.rs`：核心逻辑（全局状态 / 系统密钥环 token 存取 / 磁盘持久化）
//! - `command.rs`：Tauri 前端命令
//!
//! 安全约定：token 只存在系统密钥环 + 后端内存，绝不落盘、绝不经前端传递。

pub mod command;
pub mod manager;
pub mod models;

pub use command::*;
pub use manager::*;
pub use models::*;
