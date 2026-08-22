//! 账户模块
//!
//! 职责划分：
//! - `models.rs`：账户类型（Account / AccountInfo / AccountManager / StoreLoginState）
//! - `manager.rs`：核心逻辑（全局状态 / 系统密钥环 token 存取 / 磁盘持久化）
//! - `store.rs`：持久化层（Repository，读写 config_io）
//! - `command.rs`：账户 CRUD 等前端命令
//! - `login.rs`：Microsoft 设备码登录流程命令
//! - `oauth.rs` / `xbox.rs` / `uuid.rs` / `token_store.rs` / `types.rs`：登录支撑
//!
//! 安全约定：token 只存在系统密钥环 + 后端内存，绝不落盘、绝不经前端传递。

pub mod command;
pub mod login;
pub mod manager;
pub mod models;
pub mod oauth;
pub mod store;
pub mod token_store;
pub mod types;
pub mod uuid;
pub mod xbox;

#[cfg(test)]
mod tests;

pub use command::*;
pub use login::*;
pub use manager::*;
pub use models::*;
pub use types::*;
