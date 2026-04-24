use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionManifest {
    pub latest: LatestVersion,
    pub versions: Vec<GameVersion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatestVersion {
    pub release: String,
    pub snapshot: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub path: String,
    pub filename: String,
    pub total_size: u64,
    pub downloaded_size: u64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub task_id: String,
    pub downloaded: u64,
    pub total: u64,
    pub speed: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDownload {
    pub url: String,
    pub sha1: Option<String>,
    pub size: u64,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionDownloadManifest {
    pub version_id: String,
    pub client_jar: Option<FileDownload>,
    pub libraries: Vec<FileDownload>,
    pub assets: Vec<FileDownload>,
    pub natives: Vec<FileDownload>,
    pub asset_index: Option<FileDownload>,
}

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

#[derive(Debug, Clone, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<LibraryArtifact>,
    pub classifiers: Option<HashMap<String, LibraryArtifact>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LibraryArtifact {
    pub url: String,
    pub path: String,
    pub sha1: Option<String>,
    pub size: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Rule {
    pub action: String,
    #[serde(default)]
    pub os: Option<RuleOs>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RuleOs {
    pub name: Option<String>,
    pub arch: Option<String>,
}

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

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct AssetObject {
    pub hash: String,
    pub size: u64,
}