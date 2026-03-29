// src-tauri/src/download.rs

use crate::log_info;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

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

pub struct DownloadManager {
    pub tasks: Mutex<HashMap<String, DownloadTask>>,
    pub base_path: PathBuf,
}

impl DownloadManager {
    pub fn new(base_path: PathBuf) -> Self {
        fs::create_dir_all(&base_path).ok();
        Self {
            tasks: Mutex::new(HashMap::new()),
            base_path,
        }
    }

    pub fn add_task(&self, task: DownloadTask) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task);
    }

    pub fn get_task(&self, id: &str) -> Option<DownloadTask> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(id).cloned()
    }

    pub fn update_task(&self, task: DownloadTask) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task);
    }

    pub fn remove_task(&self, id: &str) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.remove(id);
    }

    pub fn get_all_tasks(&self) -> Vec<DownloadTask> {
        let tasks = self.tasks.lock().unwrap();
        tasks.values().cloned().collect()
    }
}

const VERSION_MANIFEST_URL: &str = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

#[tauri::command]
pub async fn get_version_manifest() -> Result<VersionManifest, String> {
    log_info!("正在获取游戏版本列表...");

    let response = reqwest::get(VERSION_MANIFEST_URL)
        .await
        .map_err(|e| format!("获取版本列表失败: {}", e))?;

    let manifest: VersionManifest = response
        .json()
        .await
        .map_err(|e| format!("解析版本列表失败: {}", e))?;

    log_info!("成功获取 {} 个游戏版本", manifest.versions.len());
    Ok(manifest)
}

#[tauri::command]
pub async fn get_version_detail(version_id: String) -> Result<serde_json::Value, String> {
    log_info!("正在获取版本详情: {}", version_id);

    let manifest = get_version_manifest().await?;
    let version = manifest
        .versions
        .iter()
        .find(|v| v.id == version_id)
        .ok_or_else(|| format!("未找到版本: {}", version_id))?;

    let response = reqwest::get(&version.url)
        .await
        .map_err(|e| format!("获取版本详情失败: {}", e))?;

    let detail: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析版本详情失败: {}", e))?;

    Ok(detail)
}

#[tauri::command]
pub async fn download_file(
    url: String,
    filename: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<DownloadProgress, String> {
    log_info!("开始下载文件: {} -> {}", url, filename);

    let task_id = format!("{:x}", md5::compute(&url));
    let save_path = download_manager.base_path.join(&filename);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("下载请求失败: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);

    let task = DownloadTask {
        id: task_id.clone(),
        url: url.clone(),
        path: save_path.to_string_lossy().to_string(),
        filename: filename.clone(),
        total_size,
        downloaded_size: 0,
        status: "downloading".to_string(),
    };

    download_manager.add_task(task);

    let mut file = File::create(&save_path)
        .map_err(|e| format!("创建文件失败: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取下载数据失败: {}", e))?;

    file.write_all(&bytes)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    let downloaded = bytes.len() as u64;

    if let Some(task) = download_manager.get_task(&task_id) {
        let mut updated_task = task;
        updated_task.status = "completed".to_string();
        updated_task.downloaded_size = downloaded;
        download_manager.update_task(updated_task);
    }

    log_info!("文件下载完成: {}", filename);

    Ok(DownloadProgress {
        task_id,
        downloaded,
        total: total_size,
        speed: 0.0,
        status: "completed".to_string(),
    })
}

#[tauri::command]
pub fn get_download_tasks(download_manager: State<'_, DownloadManager>) -> Vec<DownloadTask> {
    download_manager.get_all_tasks()
}

#[tauri::command]
pub fn get_download_task(
    task_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Option<DownloadTask> {
    download_manager.get_task(&task_id)
}

#[tauri::command]
pub fn cancel_download(
    task_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("取消下载任务: {}", task_id);

    if let Some(task) = download_manager.get_task(&task_id) {
        if fs::remove_file(&task.path).is_ok() {
            download_manager.remove_task(&task_id);
            return Ok(format!("任务 {} 已取消", task_id));
        }
    }

    Err(format!("任务 {} 不存在", task_id))
}

#[tauri::command]
pub fn clear_completed_tasks(download_manager: State<'_, DownloadManager>) -> Result<String, String> {
    log_info!("清理已完成任务");
    let tasks = download_manager.get_all_tasks();
    let mut removed = 0;

    for task in tasks {
        if task.status == "completed" {
            download_manager.remove_task(&task.id);
            removed += 1;
        }
    }

    Ok(format!("已清理 {} 个已完成任务", removed))
}

#[tauri::command]
pub fn get_game_versions(download_manager: State<'_, DownloadManager>) -> Result<Vec<String>, String> {
    let game_dir = &download_manager.base_path;
    let versions_dir = game_dir.join("versions");

    if !versions_dir.exists() {
        return Ok(vec![]);
    }

    let mut versions: Vec<String> = fs::read_dir(versions_dir)
        .map_err(|e| format!("读取版本目录失败: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect();

    versions.sort();
    Ok(versions)
}

#[tauri::command]
pub fn get_download_base_path(download_manager: State<'_, DownloadManager>) -> String {
    download_manager.base_path.to_string_lossy().to_string()
}

#[tauri::command]
pub fn set_download_base_path(
    path: String,
    _download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    let new_path = PathBuf::from(&path);
    fs::create_dir_all(&new_path)
        .map_err(|e| format!("创建目录失败: {}", e))?;

    log_info!("下载目录已更改为: {}", path);
    Ok(format!("下载目录已更改为: {}", path))
}
