//! 启动引导聚合层
//!
//! 一次性返回前端初始化所需的全部数据，避免前端多次往返 invoke。
//! 各业务模块仍是配置的唯一事实源，本模块只做"只读聚合"。

pub mod commands;
pub mod models;

pub use commands::*;
pub use models::*;
