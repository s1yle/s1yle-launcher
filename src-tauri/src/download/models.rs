use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::ModLoaderType;

/// 版本清单（包含最新版本和所有版本列表）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionManifest {
    /// 最新的稳定发布版和快照版
    pub latest: LatestVersion,
    /// 可用版本列表
    pub versions: Vec<GameVersion>, 
}

/// 最新版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatestVersion {
    /// 最新稳定发布版的版本ID
    pub release: String,
    /// 最新快照版的版本ID
    pub snapshot: String,
}

/// 游戏版本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameVersion {
    /// 该版本的ID
    pub id: String,
    #[serde(rename = "type", default)]
    /// 版本类型，可以是：release（正式版）、snapshot（快照）、old_beta（Beta版）或old_alpha（Alpha及更早的版本）
    pub type_: String,
    /// 下载版本对应的<version id>.json文件链接
    pub url: String,
    /// 使用ISO 8601格式化的数据，用于表示版本的更新时间
    pub time: String,
    /// 使用ISO 8601格式化的数据，用于表示版本的发布时间
    pub release_time: String,
    /// (仅v2) 该版本的SHA1散列值，也是JSON文件的ID
    pub sha1: Option<String>,
    /// (仅v2) 如果为0，启动器会警告用户此版本因老旧而不足以支持最新的玩家安全特性。其他情况为1
    pub compliance_level: Option<i8>,
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

/// 下载进度信息（通过 `download-progress` 事件统一推送给前端）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    /// 版本 ID（多版本并发下载时区分）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_id: Option<String>,
    /// 当前阶段（downloading_libraries / downloading_assets / downloading_natives / downloading_client / downloading_index）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phase: Option<String>,
    /// 当前处理中的文件相对路径
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    /// 已下载字节数（跨阶段累计）
    pub downloaded: u64,
    /// 部署文件总字节数
    pub total: u64,
    /// 已完成文件数
    #[serde(default)]
    pub files_done: u64,
    /// 文件总数
    #[serde(default)]
    pub files_total: u64,
    /// 下载速度（bytes/s）
    pub speed: f64,
    /// 状态（downloading/completed/failed）
    pub status: String,
}

/// 文件下载信息
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FileDownload {
    /// 下载 URL
    pub url: String,
    /// SHA1 校验值
    pub sha1: Option<String>,
    /// 文件大小
    pub size: u64,
    /// 存储路径
    pub path: String,
    /// 解压排除规则（仅原生库使用，普通文件为 None）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extract: Option<LibraryExtract>,
}

/// 版本下载清单（包含客户端 jar、库文件、资源文件等）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionJsonManifest {
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
    /// log4j 日志配置文件
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub log_config: Option<FileDownload>,
}

/// 库信息（来自版本 JSON）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Library {
    /// 下载相关信息（artifact 主构件 + classifiers 分类器构件）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub downloads: Option<LibraryDownloads>,
    /// 该库的 Maven 名称，以 <code>groupId:artifactId:version</code> 的形式出现。
    pub name: String,
    /// 原生库分类器映射（系统名称 → 分类器后缀，如 linux → natives-linux）；
    /// 1.19-pre1 起已从官方 JSON 中移除。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub natives: Option<HashMap<String, String>>,
    /// 对该库的规则列表：可以是 allow（允许）或 disallow（不允许），
    /// 若满足其余键值，则执行该 action。
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rules: Vec<Rule>,
    /// 原生库解压配置
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extract: Option<LibraryExtract>,
    /// 未知的额外字段（重序列化时原样保留）
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

/// 库文件下载信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryDownloads {
    /// 主构件（库本体）的下载信息。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub artifact: Option<LibraryArtifact>,
    /// 分类器构件的下载信息（如 natives-* 原生库）；
    /// 1.19-pre1 起已从官方 JSON 中移除。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub classifiers: Option<HashMap<String, LibraryArtifact>>,
}

/// 库构件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryArtifact {
    /// 下载该构件的 URL。
    pub url: String,
    /// 构件文件相对于 libraries 文件夹的路径，并包含文件名。
    pub path: String,
    /// 构件文件的 SHA1 校验码。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sha1: Option<String>,
    /// 构件文件的文件大小。
    pub size: u64,
}

/// 原生库解压配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryExtract {
    /// 解压时需要排除的文件路径列表
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exclude: Option<Vec<String>>,
}

/// 平台规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    /// 对当前项执行的操作，可以是 allow（允许）或 disallow（不允许）
    pub action: String,
    /// 对应启动器内设置的特性，通常是一个布尔变量。
    /// 已知键：is_demo_user（是否为演示版用户）、has_custom_resolution（是否使用自定义分辨率）、
    /// has_quick_plays_support（是否支持快速进入游戏）、is_quick_play_singleplayer、
    /// is_quick_play_multiplayer、is_quick_play_realms（是否支持单人/多人/Realms 快速进入游戏）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub features: Option<HashMap<String, bool>>,
    /// 当前系统相关的要求（name / version / arch）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub os: Option<RuleOs>,
}

/// 操作系统规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleOs {
    /// 系统名称（如 linux / windows / osx）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// 系统版本要求（如 Windows 10）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    /// 系统版本区间
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version_range: Option<SystemVersionRange>,
    /// 系统架构（x86 / x64）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub arch: Option<String>,
}

/// 系统版本区间（os.versionRange）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemVersionRange {
    /// 版本区间的上限（最高版本号）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max: Option<String>,
    /// 版本区间的下限（最低版本号）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min: Option<String>,
}

/// 资源对象（资源索引 objects 中的一项）
#[derive(Debug, Clone, Deserialize)]
pub struct AssetObject {
    /// 资源文件的 SHA1 哈希（也是资源文件名）
    pub hash: String,
    /// 资源文件的文件大小（pre-1.6 索引对象可能缺失）
    #[serde(default)]
    pub size: u64,
}


/// 部署选项（下载并部署请求参数）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadOptions {
    /// 游戏名称
    pub game_name: String,
    /// 版本 ID
    pub version_id: String,
    /// 加载器类型
    pub loader_type: ModLoaderType,
    /// 加载器版本
    pub loader_version: Option<String>,
}

/// 部署结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadResult {
    /// 是否成功
    pub success: bool,
    /// 游戏 ID
    pub game_id: String,
    /// 游戏名称
    pub game_name: String,
    /// 版本
    pub version: String,
    /// 已部署文件数
    pub deployed_files_count: usize,
    /// 总文件数
    pub total_files_count: usize,
    /// 消息
    pub message: String,
}

// ===================== version.json 完整模型 =====================

/// 版本根对象（version.json 完整结构）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionJson {
    /// 参数列表，分为 jvm 及 game 类型（1.13 之前由 minecraftArguments 代替）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub arguments: Option<VersionArguments>,
    /// 1.13 及更早版本使用的命令行参数字符串
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub minecraft_arguments: Option<String>,
    /// 当前版本的资源文件索引（含下载地址等信息）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub asset_index: Option<AssetIndex>,
    /// 当前版本的资源文件版本
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub assets: Option<String>,
    /// 如果为0，启动器会警告用户此版本因老旧而不足以支持最新的玩家安全特性。其他情况为1
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compliance_level: Option<i8>,
    /// 包含客户端及服务端下载地址等信息
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub downloads: Option<VersionDownloads>,
    /// 版本 ID
    pub id: String,
    /// Java 版本要求
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub java_version: Option<JavaVersion>,
    /// 游戏所有依赖库，包含其下载地址等信息
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub libraries: Vec<Library>,
    /// log4j 配置文件，包含其下载地址等信息
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logging: Option<VersionLogging>,
    /// 主类名
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub main_class: Option<String>,
    /// 可以运行该版本的最小启动器版本
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub minimum_launcher_version: Option<u8>,
    /// 使用 ISO 8601 格式化的数据，用于表示版本的发布时间
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release_time: Option<String>,
    /// 使用 ISO 8601 格式化的数据，用于表示版本的更新时间
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub time: Option<String>,
    /// 版本类型：release（正式版）、snapshot（快照）、old_beta（Beta版）或 old_alpha（Alpha版）
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
    /// 未知的额外字段（重序列化时原样保留）
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

/// 参数列表（arguments 根对象）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionArguments {
    /// 游戏参数
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub game: Vec<ArgumentItem>,
    /// JVM 参数
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub jvm: Vec<ArgumentItem>,
    /// (26.1-snapshot-2 起) 默认用户 JVM 参数
    #[serde(rename = "default-user-jvm", default, skip_serializing_if = "Option::is_none")]
    pub default_user_jvm: Option<Vec<ArgumentItem>>,
}

/// 参数项：可为纯字符串，或包含 rules 的 Map
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ArgumentItem {
    /// 简单字符串参数
    String(String),
    /// 带规则的参数对象
    Rules(RuleArgument),
}

/// 带规则的参数对象
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleArgument {
    /// 使用规则（26.x 起可为空：仅 `{"value": [...]}` 表示无条件参数）
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rules: Vec<Rule>,
    /// 参数值（可为单个字符串或字符串列表）
    pub value: ArgumentValue,
}

/// 参数值：单个字符串或字符串列表
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ArgumentValue {
    /// 单个字符串
    String(String),
    /// 字符串列表
    List(Vec<String>),
}

/// 资源文件索引（assetIndex）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIndex {
    /// 资源索引的标识符
    pub id: String,
    /// 资源索引文件的 SHA1 校验码
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sha1: Option<String>,
    /// 资源索引文件的文件大小
    pub size: u64,
    /// 所有资源文件的总大小
    pub total_size: u64,
    /// 下载资源索引文件的完整 URL
    pub url: String,
}

/// 客户端/服务端下载信息（downloads 根对象）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionDownloads {
    /// 客户端核心文件 (<version_id>.jar 文件)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client: Option<DownloadEntry>,
    /// 客户端混淆映射 (client.txt)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_mappings: Option<DownloadEntry>,
    /// 服务端核心文件 (server.jar)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server: Option<DownloadEntry>,
    /// 服务端混淆映射 (server.txt)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_mappings: Option<DownloadEntry>,
    /// 未知的额外键（如 windows_server 等）
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

/// 文件下载信息（sha1 / size / url 三件套）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadEntry {
    /// SHA1 校验码
    pub sha1: String,
    /// 文件大小
    pub size: u64,
    /// 完整下载 URL
    pub url: String,
}

/// 游戏日志配置（logging）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionLogging {
    /// 客户端日志配置
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client: Option<LoggingClient>,
}

/// 客户端日志配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoggingClient {
    /// 启动游戏时需要的额外 JVM 参数
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub argument: Option<String>,
    /// 日志配置文件信息
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<LoggingFile>,
    /// 配置文件的类型（如 log4j2）
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
}

/// 日志配置文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingFile {
    /// 日志配置文件的文件名
    pub id: String,
    /// 日志配置文件的 SHA1 校验码
    pub sha1: String,
    /// 日志配置文件的文件大小
    pub size: u64,
    /// 日志配置文件的完整 URL
    pub url: String,
}

/// Java 版本要求（javaVersion）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JavaVersion {
    /// Java 运行时环境（JRE）的代号
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub component: Option<String>,
    /// Java 运行时环境的主版本号
    pub major_version: u32,
}