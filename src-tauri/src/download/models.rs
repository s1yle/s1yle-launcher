use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 游戏版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameVersion {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(rename = "type", default)]
    pub type_: String,
    #[serde(rename = "releaseTime", default)]
    pub release_time: String,
    pub url: String,
}

/// 版本清单（包含最新版本和所有版本列表）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionManifest {
    pub latest: LatestVersion,
    pub versions: Vec<GameVersion>,
}

/// 最新版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatestVersion {
    pub release: String,
    pub snapshot: String,
}

/// 下载任务
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    /// 任务唯一标识
    pub id: String,
    /// 下载 URL
    pub url: String,
    /// 存储路径
    pub path: String,
    /// 文件名
    pub filename: String,
    /// 文件总大小
    pub total_size: u64,
    /// 已下载大小
    pub downloaded_size: u64,
    /// 状态（downloading/completed/failed）
    pub status: String,
}

/// 下载进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    /// 任务 ID
    pub task_id: String,
    /// 已下载字节数
    pub downloaded: u64,
    /// 总字节数
    pub total: u64,
    /// 下载速度
    pub speed: f64,
    /// 状态
    pub status: String,
}

/// 文件下载信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDownload {
    /// 下载 URL
    pub url: String,
    /// SHA1 校验值
    pub sha1: Option<String>,
    /// 文件大小
    pub size: u64,
    /// 存储路径
    pub path: String,
}

/// 版本下载清单（包含客户端 jar、库文件、资源文件等）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionDownloadManifest {
    /// 版本 ID
    pub version_id: String,
    /// 客户端 jar
    pub client_jar: Option<FileDownload>,
    /// 库文件列表
    pub libraries: Vec<FileDownload>,
    /// 资源文件列表
    pub assets: Vec<FileDownload>,
    /// 原生库列表
    pub natives: Vec<FileDownload>,
    /// 资源索引文件
    pub asset_index: Option<FileDownload>,
}

/// 库信息（来自版本 JSON）
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct Library {
    pub name: String,
    #[serde(default)]
    pub downloads: Option<LibraryDownloads>,
    #[serde(default)]
    pub natives: Option<HashMap<String, String>>,
    #[serde(default)]
    pub rules: Vec<Rule>,
}

/// 库文件下载信息
#[derive(Debug, Clone, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<LibraryArtifact>,
    pub classifiers: Option<HashMap<String, LibraryArtifact>>,
}

/// 库构件信息
#[derive(Debug, Clone, Deserialize)]
pub struct LibraryArtifact {
    pub url: String,
    pub path: String,
    pub sha1: Option<String>,
    pub size: u64,
}

/// 平台规则
#[derive(Debug, Clone, Deserialize)]
pub struct Rule {
    pub action: String,
    #[serde(default)]
    pub os: Option<RuleOs>,
}

/// 操作系统规则
#[derive(Debug, Clone, Deserialize)]
pub struct RuleOs {
    pub name: Option<String>,
    pub arch: Option<String>,
}

/// 资源索引信息
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct AssetIndex {
    pub id: String,
    pub url: String,
    pub sha1: Option<String>,
    pub size: u64,
    #[serde(rename = "totalSize")]
    pub total_size: u64,
}

/// 资源对象
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct AssetObject {
    pub hash: String,
    pub size: u64,
}
