/// 下载命令
pub mod commands;
/// 版本部署逻辑
pub mod deploy;
/// 文件下载器
pub mod downloader;
/// 下载管理器
pub mod manager;
/// 下载相关数据模型
pub mod models;
/// 下载工具函数
pub mod utils;
/// 版本清单解析
pub mod version;

// 重导出常用类型，方便外部使用
pub use commands::*;
pub use deploy::*;
pub use downloader::*;
pub use manager::DownloadManager;
pub use models::*;
pub use version::*;
