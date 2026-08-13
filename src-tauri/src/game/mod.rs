/// 实例管理命令
pub mod commands;
/// 实例管理器（门面，持有全部实例域逻辑）
pub mod manager;
/// 实例数据模型
pub mod models;
/// 实例设置命令
pub mod settings;

pub use commands::*;
pub use manager::GameManager;
pub use models::Game;
pub use settings::*;