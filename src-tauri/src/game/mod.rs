/// 游戏管理命令
pub mod commands;
/// 游戏管理器（门面，持有全部游戏域逻辑）
pub mod manager;
/// 游戏数据模型
pub mod models;
/// 游戏设置命令
pub mod settings;
/// 游戏完整性校验
pub mod validator;

pub use commands::*;
pub use manager::GameManager;
pub use models::Game;
pub use settings::*;