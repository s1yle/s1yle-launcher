// src-tauri/src/download.rs

use crate::log_info;

use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

const CHUNK_SIZE: u64 = 4 * 1024 * 1024;
const MAX_CHUNKS: usize = 8;
const MAX_RETRIES: u32 = 3;

fn calculate_file_sha1(path: &std::path::Path) -> Result<String, String> {
    let mut file = fs::File::open(path)
        .map_err(|e| format!("打开文件失败: {}", e))?;

    let mut hasher = Sha1::new();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = file.read(&mut buffer)
            .map_err(|e| format!("读取文件失败: {}", e))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    let result = hasher.finalize();
    Ok(hex::encode(result))
}

fn verify_file_sha1(path: &std::path::Path, expected_sha1: &str) -> Result<bool, String> {
    let actual_sha1 = calculate_file_sha1(path)?;
    let matches = actual_sha1.eq_ignore_ascii_case(expected_sha1);

    if !matches {
        log_info!("SHA1 校验失败: 期望 {} 实际 {}", expected_sha1, actual_sha1);
    }

    Ok(matches)
}

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

fn get_current_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

fn get_current_arch() -> &'static str {
    if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "aarch64") {
        "arm64"
    } else {
        "x86"
    }
}

fn should_use_library(library: &Library) -> bool {
    if library.rules.is_empty() {
        return true;
    }

    let mut allowed = true;
    for rule in &library.rules {
        match rule.action.as_str() {
            "allow" => {
                if let Some(ref os) = rule.os {
                    let os_match = os.name.as_ref().map_or(true, |n| n == get_current_os());
                    let arch_match = os.arch.as_ref().map_or(true, |a| {
                        if a.contains("64") {
                            get_current_arch().contains("64")
                        } else {
                            !get_current_arch().contains("64")
                        }
                    });
                    if os_match && arch_match {
                        allowed = true;
                    }
                } else {
                    allowed = true;
                }
            }
            "disallow" => {
                if let Some(ref os) = rule.os {
                    let os_match = os.name.as_ref().map_or(true, |n| n == get_current_os());
                    let arch_match = os.arch.as_ref().map_or(true, |a| {
                        if a.contains("64") {
                            get_current_arch().contains("64")
                        } else {
                            !get_current_arch().contains("64")
                        }
                    });
                    if os_match && arch_match {
                        allowed = false;
                    }
                } else {
                    allowed = false;
                }
            }
            _ => {}
        }
    }
    allowed
}

fn get_native_classifier(library: &Library) -> Option<(String, String)> {
    let natives = library.natives.as_ref()?;
    let os = get_current_os();
    let arch = get_current_arch();

    let native_key = match os {
        "windows" => {
            if arch == "x64" {
                "windows-x64"
            } else {
                "windows-x86"
            }
        }
        "osx" => "osx",
        "linux" => {
            if arch == "x64" {
                "linux-x64"
            } else if arch == "arm64" {
                "linux-arm64"
            } else {
                "linux-x86"
            }
        }
        _ => return None,
    };

    let classifier_suffix = natives.get(native_key)?;
    let classifier = format!("natives-{}-{}", os, classifier_suffix);
    Some((classifier, native_key.to_string()))
}

pub struct DownloadManager {
    pub tasks: Mutex<HashMap<String, DownloadTask>>,
    pub base_path: Mutex<PathBuf>,
    pub manifest_cache: Mutex<HashMap<String, VersionDownloadManifest>>,
    pub client: reqwest::Client,
}

impl DownloadManager {
    pub fn new(base_path: PathBuf) -> Self {
        fs::create_dir_all(&base_path).ok();

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            tasks: Mutex::new(HashMap::new()),
            base_path: Mutex::new(base_path),
            manifest_cache: Mutex::new(HashMap::new()),
            client,
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

async fn parse_version_downloads(version_json: &serde_json::Value) -> Result<VersionDownloadManifest, String> {
    let version_id = version_json["id"]
        .as_str()
        .ok_or("Missing version id")?
        .to_string();

    log_info!("解析版本 {} 的下载清单", version_id);

    let mut libraries = Vec::new();
    let mut natives = Vec::new();

    if let Some(libraries_json) = version_json["libraries"].as_array() {
        for lib_json in libraries_json {
            let library: Library = serde_json::from_value(lib_json.clone())
                .map_err(|e| format!("解析库失败: {}", e))?;

            if !should_use_library(&library) {
                continue;
            }

            if let Some(downloads) = &library.downloads {
                if let Some(artifact) = &downloads.artifact {
                    libraries.push(FileDownload {
                        url: artifact.url.clone(),
                        sha1: artifact.sha1.clone(),
                        size: artifact.size,
                        path: artifact.path.clone(),
                    });
                }

                if let Some(ref classifiers) = downloads.classifiers {
                    if let Some((classifier_key, _)) = get_native_classifier(&library) {
                        if let Some(native_artifact) = classifiers.get(&classifier_key) {
                            natives.push(FileDownload {
                                url: native_artifact.url.clone(),
                                sha1: native_artifact.sha1.clone(),
                                size: native_artifact.size,
                                path: native_artifact.path.clone(),
                            });
                        }
                    }
                }
            }
        }
    }

    log_info!("解析到 {} 个库文件, {} 个原生库", libraries.len(), natives.len());

    let mut assets = Vec::new();
    let mut asset_index: Option<FileDownload> = None;

    if version_json["assetIndex"].is_object() {
        let index_id = version_json["assetIndex"]["id"]
            .as_str()
            .unwrap_or("pre-1.6");

        asset_index = Some(FileDownload {
            url: version_json["assetIndex"]["url"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            sha1: version_json["assetIndex"]["sha1"].as_str().map(String::from),
            size: version_json["assetIndex"]["size"].as_u64().unwrap_or(0),
            path: format!("indexes/{}.json", index_id),
        });

        let url = version_json["assetIndex"]["url"].as_str().unwrap_or("");
        if !url.is_empty() {
            match fetch_asset_objects(url).await {
                Ok(asset_objects) => {
                    let is_legacy = version_json["assets"].as_str() == Some("pre-1.6")
                        || version_json["assets"].is_null()
                        || version_json["assets"].as_str().is_none();

                    for (virtual_path, obj) in asset_objects {
                        let hash = &obj.hash;
                        let path = if is_legacy {
                            format!("virtual/legacy/{}", virtual_path)
                        } else {
                            format!("objects/{}/{}", &hash[..2], hash)
                        };
                        assets.push(FileDownload {
                            url: format!("https://resources.download.minecraft.net/{}/{}", &hash[..2], hash),
                            sha1: Some(hash.clone()),
                            size: obj.size,
                            path,
                        });
                    }
                }
                Err(e) => {
                    log_info!("获取资源对象失败: {}", e);
                }
            }
        }
    }

    log_info!("解析到 {} 个资源文件", assets.len());

    let mut client_jar = None;
    if let Some(downloads) = version_json["downloads"].as_object() {
        if let Some(client) = downloads.get("client") {
            client_jar = Some(FileDownload {
                url: client["url"].as_str().unwrap_or("").to_string(),
                sha1: client["sha1"].as_str().map(String::from),
                size: client["size"].as_u64().unwrap_or(0),
                path: format!("versions/{}/{}.jar", version_id, version_id),
            });
        }
    }

    Ok(VersionDownloadManifest {
        version_id,
        client_jar,
        libraries,
        assets,
        natives,
        asset_index,
    })
}

async fn fetch_asset_objects(url: &str) -> Result<HashMap<String, AssetObject>, String> {
    if url.is_empty() {
        return Ok(HashMap::new());
    }

    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("获取资源索引失败: {}", e))?;

    #[derive(Deserialize)]
    struct AssetIndexResponse {
        objects: HashMap<String, AssetObject>,
    }

    let index: AssetIndexResponse = response
        .json()
        .await
        .map_err(|e| format!("解析资源索引失败: {}", e))?;

    Ok(index.objects)
}

#[tauri::command]
pub async fn get_version_download_manifest(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<VersionDownloadManifest, String> {
    log_info!("正在获取版本下载清单: {}", version_id);

    {
        let cache = download_manager.manifest_cache.lock().unwrap();
        if let Some(cached) = cache.get(&version_id) {
            log_info!("使用缓存的版本下载清单: {}", version_id);
            return Ok(cached.clone());
        }
    }

    let version_json = get_version_detail(version_id.clone()).await?;
    let manifest = parse_version_downloads(&version_json).await?;

    {
        let mut cache = download_manager.manifest_cache.lock().unwrap();
        cache.insert(version_id.clone(), manifest.clone());
    }

    log_info!(
        "下载清单解析完成: {} 个库, {} 个原生库, {} 个资源",
        manifest.libraries.len(),
        manifest.natives.len(),
        manifest.assets.len()
    );

    Ok(manifest)
}

async fn get_content_length(client: &reqwest::Client, url: &str) -> Result<u64, String> {
    let resp = client
        .head(url)
        .send()
        .await
        .map_err(|e| format!("HEAD 请求失败: {}", e))?;

    resp.content_length()
        .ok_or_else(|| "无法获取文件大小".to_string())
}

struct ChunkResult {
    chunk_index: usize,
    data: Vec<u8>,
}

async fn download_chunk(
    client: &reqwest::Client,
    url: &str,
    start: u64,
    end: u64,
    chunk_index: usize,
) -> Result<ChunkResult, String> {
    let mut retries = 0;
    loop {
        let resp = client
            .get(url)
            .header("Range", format!("bytes={}-{}", start, end))
            .send()
            .await
            .map_err(|e| format!("分块请求失败: {}", e));

        match resp {
            Ok(resp) => {
                let status = resp.status();
                if !status.is_success() && status != 206 {
                    return Err(format!("分块请求返回状态码: {}", status));
                }

                let data = resp
                    .bytes()
                    .await
                    .map_err(|e| format!("读取分块数据失败: {}", e))
                    .map(|b| b.to_vec())?;

                return Ok(ChunkResult { chunk_index, data });
            }
            Err(e) => {
                retries += 1;
                if retries >= MAX_RETRIES {
                    return Err(format!("分块 {} 下载失败 (已重试 {} 次): {}", chunk_index, retries, e));
                }
                tokio::time::sleep(std::time::Duration::from_millis(500 * retries as u64)).await;
            }
        }
    }
}

async fn download_file_chunked(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    total_size: u64,
    task_id: &str,
    download_manager: &State<'_, DownloadManager>,
) -> Result<u64, String> {
    let num_chunks = std::cmp::min(
        MAX_CHUNKS,
        std::cmp::max(1, (total_size + CHUNK_SIZE - 1) / CHUNK_SIZE) as usize,
    );

    if num_chunks == 1 {
        return download_file_single(client, url, save_path, task_id, download_manager).await;
    }

    log_info!("开始分块下载: {} ({} 块, {} bytes)", url, num_chunks, total_size);

    let mut file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(true)
        .open(save_path)
        .map_err(|e| format!("创建文件失败: {}", e))?;

    file.set_len(total_size)
        .map_err(|e| format!("预分配文件空间失败: {}", e))?;

    let mut handles = Vec::new();
    for i in 0..num_chunks {
        let start = i as u64 * CHUNK_SIZE;
        let end = std::cmp::min(start + CHUNK_SIZE - 1, total_size - 1);

        let client = client.clone();
        let url = url.to_string();
        handles.push(tokio::spawn(async move {
            download_chunk(&client, &url, start, end, i).await
        }));
    }

    let mut downloaded: u64 = 0;
    let mut results = Vec::with_capacity(num_chunks);

    for handle in handles {
        let result = handle
            .await
            .map_err(|e| format!("任务执行失败: {}", e))??;

        downloaded += result.data.len() as u64;
        results.push(result);

        if let Some(t) = download_manager.get_task(task_id) {
            let mut updated = t;
            updated.downloaded_size = downloaded;
            updated.total_size = total_size;
            download_manager.update_task(updated);
        }
    }

    for result in &results {
        let offset = result.chunk_index as u64 * CHUNK_SIZE;
        file.seek(SeekFrom::Start(offset))
            .map_err(|e| format!("文件定位失败: {}", e))?;
        file.write_all(&result.data)
            .map_err(|e| format!("写入分块数据失败: {}", e))?;
    }

    file.flush()
        .map_err(|e| format!("刷新文件失败: {}", e))?;

    log_info!("分块下载完成: {} ({} bytes)", url, downloaded);
    Ok(downloaded)
}

async fn download_file_single(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    task_id: &str,
    download_manager: &State<'_, DownloadManager>,
) -> Result<u64, String> {
    log_info!("开始下载: {}", url);

    let mut resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let total = resp.content_length().unwrap_or(0);
    let mut file = fs::File::create(save_path)
        .map_err(|e| format!("创建文件失败: {}", e))?;

    let mut downloaded: u64 = 0;

    while let Some(chunk) = resp
        .chunk()
        .await
        .map_err(|e| format!("读取数据失败: {}", e))?
    {
        file.write_all(&chunk)
            .map_err(|e| format!("写入文件失败: {}", e))?;
        downloaded += chunk.len() as u64;

        if let Some(t) = download_manager.get_task(task_id) {
            let mut updated = t;
            updated.downloaded_size = downloaded;
            updated.total_size = total;
            download_manager.update_task(updated);
        }
    }

    log_info!("下载完成: {} ({} bytes)", url, downloaded);
    Ok(downloaded)
}

#[tauri::command]
pub async fn download_file(
    url: String,
    filename: String,
    sha1: Option<String>,
    skip_verify: Option<bool>,
    total_size: Option<u64>,
    download_manager: State<'_, DownloadManager>,
) -> Result<DownloadProgress, String> {
    log_info!("开始下载文件: {} -> {}", url, filename);

    let task_id = format!("{:x}", md5::compute(&url));
    let save_path = download_manager.base_path.lock().unwrap().join("temp").join(&filename);

    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let existing_size = if save_path.exists() {
        fs::metadata(&save_path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    let expected_total = total_size.unwrap_or(0);

    let should_verify = skip_verify.unwrap_or(false) == false;
    if should_verify && save_path.exists() {
        if let Some(ref expected_sha1) = sha1 {
            if let Ok(true) = verify_file_sha1(&save_path, expected_sha1) {
                log_info!("文件已存在且校验通过，跳过下载: {}", filename);
                if let Some(t) = download_manager.get_task(&task_id) {
                    let mut updated = t;
                    updated.status = "completed".to_string();
                    updated.downloaded_size = existing_size;
                    updated.total_size = existing_size;
                    download_manager.update_task(updated);
                }
                return Ok(DownloadProgress {
                    task_id,
                    downloaded: existing_size,
                    total: existing_size,
                    speed: 0.0,
                    status: "completed".to_string(),
                });
            } else {
                log_info!("文件 SHA1 不匹配，将重新下载: {}", filename);
            }
        }
    }

    let task = DownloadTask {
        id: task_id.clone(),
        url: url.clone(),
        path: save_path.to_string_lossy().to_string(),
        filename: filename.clone(),
        total_size: expected_total,
        downloaded_size: existing_size,
        status: "downloading".to_string(),
    };
    download_manager.add_task(task);

    let actual_size = if expected_total > 0 {
        expected_total
    } else {
        match get_content_length(&download_manager.client, &url).await {
            Ok(size) => size,
            Err(_) => 0,
        }
    };

    let downloaded = if actual_size > CHUNK_SIZE {
        download_file_chunked(
            &download_manager.client,
            &url,
            &save_path,
            actual_size,
            &task_id,
            &download_manager,
        )
        .await?
    } else {
        download_file_single(
            &download_manager.client,
            &url,
            &save_path,
            &task_id,
            &download_manager,
        )
        .await?
    };

    if should_verify {
        if let Some(ref expected_sha1) = sha1 {
            match verify_file_sha1(&save_path, expected_sha1) {
                Ok(true) => {
                    log_info!("SHA1 校验通过: {}", filename);
                }
                Ok(false) => {
                    fs::remove_file(&save_path).ok();
                    if let Some(t) = download_manager.get_task(&task_id) {
                        let mut updated = t;
                        updated.status = "failed".to_string();
                        download_manager.update_task(updated);
                    }
                    return Err(format!("SHA1 校验失败: {}", filename));
                }
                Err(e) => {
                    fs::remove_file(&save_path).ok();
                    if let Some(t) = download_manager.get_task(&task_id) {
                        let mut updated = t;
                        updated.status = "failed".to_string();
                        download_manager.update_task(updated);
                    }
                    return Err(format!("SHA1 校验出错: {} - {}", filename, e));
                }
            }
        }
    }

    if let Some(t) = download_manager.get_task(&task_id) {
        let mut updated = t;
        updated.status = "completed".to_string();
        updated.downloaded_size = downloaded;
        updated.total_size = downloaded;
        download_manager.update_task(updated);
    }

    log_info!("文件下载完成: {}", filename);

    Ok(DownloadProgress {
        task_id,
        downloaded,
        total: downloaded,
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
    let game_dir = download_manager.base_path.lock().unwrap().clone();
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
    download_manager.base_path.lock().unwrap().to_string_lossy().to_string()
}

#[tauri::command]
pub fn set_download_base_path(
    path: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    let new_path = PathBuf::from(&path);
    fs::create_dir_all(&new_path)
        .map_err(|e| format!("创建目录失败: {}", e))?;

    let mut base_path = download_manager.base_path.lock().unwrap();
    *base_path = new_path;

    log_info!("下载目录已更改为: {}", path);
    Ok(format!("下载目录已更改为: {}", path))
}

#[allow(dead_code)]
fn deploy_file_to_path(base_path: &PathBuf, file: &FileDownload) -> Result<String, String> {
    let dest_path = base_path.join(&file.path);

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let source_path = base_path.join("temp").join(&file.path);

    if source_path.exists() {
        fs::rename(&source_path, &dest_path)
            .map_err(|e| format!("移动文件失败: {}", e))?;
        log_info!("部署文件: {} -> {}", file.path, dest_path.display());
    } else if dest_path.exists() {
        log_info!("文件已存在: {}", file.path);
    } else {
        return Err(format!("源文件不存在: {}", source_path.display()));
    }

    Ok(dest_path.to_string_lossy().to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct DeployProgress {
    pub total: usize,
    pub current: usize,
    pub current_file: String,
    pub status: String,
}

#[tauri::command]
pub async fn deploy_version_files(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("开始部署版本文件: {}", version_id);

    let manifest = get_version_download_manifest(version_id.clone(), download_manager.clone()).await?;
    deploy_manifest(&manifest, version_id, &download_manager).await
}

async fn deploy_manifest(
    manifest: &VersionDownloadManifest,
    version_id: String,
    download_manager: &State<'_, DownloadManager>,
) -> Result<String, String> {
    let base_path = download_manager.base_path.lock().unwrap().clone();
    let base_path = &base_path;

    let mut deployed = 0;

    for lib in &manifest.libraries {
        let source = base_path.join("temp").join(&lib.path);
        let dest = base_path.join("libraries").join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest)
                .map_err(|e| format!("部署库文件失败: {}", e))?;
            deployed += 1;
            log_info!("[{} / {}] 部署库: {}", deployed, manifest.libraries.len(), lib.path);
        } else if dest.exists() {
            deployed += 1;
            log_info!("[{} / {}] 库已存在: {}", deployed, manifest.libraries.len(), lib.path);
        }
    }

    let natives_dir = base_path.join("natives").join(&version_id);
    if manifest.natives.first().is_some() {
        fs::create_dir_all(&natives_dir)
            .map_err(|e| format!("创建原生库目录失败: {}", e))?;

        for native in &manifest.natives {
            let source = base_path.join("temp").join(&native.path);

            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                fs::remove_file(&source).ok();
                log_info!("解压原生库: {}", native.path);
            }
        }
    }

    for asset in &manifest.assets {
        let source = base_path.join("temp").join(&asset.path);
        let dest = base_path.join("assets").join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建资源目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest)
                .map_err(|e| format!("部署资源文件失败: {}", e))?;
            deployed += 1;
        } else if dest.exists() {
            deployed += 1;
        }
    }

    if let Some(ref client) = manifest.client_jar {
        let source = base_path.join("temp").join(&client.path);
        let dest = base_path.join("versions").join(&version_id).join(format!("{}.jar", &version_id));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建版本目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest)
                .map_err(|e| format!("部署客户端 jar 失败: {}", e))?;
        }
    }

    let temp_dir = base_path.join("temp");
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).ok();
    }

    log_info!("版本 {} 部署完成，共部署 {} 个文件", version_id, deployed);
    Ok(format!("版本 {} 部署完成", version_id))
}

fn extract_jar(jar_path: &PathBuf, dest_dir: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(jar_path)
        .map_err(|e| format!("打开 jar 文件失败: {}", e))?;

    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("解析 zip 失败: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("读取 zip 条目失败: {}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => dest_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("创建父目录失败: {}", e))?;
                }
            }

            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("创建文件失败: {}", e))?;
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("复制文件失败: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn is_version_deployed(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> bool {
    let base_path = download_manager.base_path.lock().unwrap();
    let version_jar = base_path.join("versions").join(&version_id).join(format!("{}.jar", version_id));
    version_jar.exists()
}

#[tauri::command]
pub async fn deploy_version_to_instance(
    instance_path: String,
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("开始部署版本 {} 到实例 {}", version_id, instance_path);

    let manifest = get_version_download_manifest(version_id.clone(), download_manager.clone()).await?;
    
    let instance_dir = PathBuf::from(&instance_path);
    let versions_dir = instance_dir.join("versions");
    let libraries_dir = instance_dir.join("libraries");
    let assets_dir = instance_dir.join("assets");
    let natives_dir = instance_dir.join("natives").join(&version_id);

    fs::create_dir_all(&versions_dir).map_err(|e| format!("创建versions目录失败: {}", e))?;
    fs::create_dir_all(&libraries_dir).map_err(|e| format!("创建libraries目录失败: {}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建assets目录失败: {}", e))?;
    fs::create_dir_all(&natives_dir).map_err(|e| format!("创建natives目录失败: {}", e))?;

    let base_path = download_manager.base_path.lock().unwrap().clone();
    
    for lib in &manifest.libraries {
        let source = base_path.join("temp").join(&lib.path);
        let dest = libraries_dir.join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建库目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署库文件失败: {}", e))?;
            log_info!("部署库: {}", lib.path);
        } else if dest.exists() {
            log_info!("库已存在: {}", lib.path);
        }
    }

    if manifest.natives.first().is_some() {
        for native in &manifest.natives {
            let source = base_path.join("temp").join(&native.path);
            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                fs::remove_file(&source).ok();
                log_info!("解压原生库: {}", native.path);
            }
        }
    }

    for asset in &manifest.assets {
        let source = base_path.join("temp").join(&asset.path);
        let dest = assets_dir.join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署资源文件失败: {}", e))?;
            log_info!("部署资源: {}", asset.path);
        } else if dest.exists() {
            log_info!("资源已存在: {}", asset.path);
        }
    }

    if let Some(ref client) = manifest.client_jar {
        let source = base_path.join("temp").join(&client.path);
        let dest = versions_dir.join(format!("{}.jar", &version_id));

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署客户端jar失败: {}", e))?;
            log_info!("部署客户端: {}", dest.display());
        }
    }

    if let Some(ref index) = manifest.asset_index {
        let source = base_path.join("temp").join(&index.path);
        let dest = instance_dir.join("assets").join("indexes").join(format!("{}.json", &version_id));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建索引目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署资源索引失败: {}", e))?;
        }
    }

    log_info!("版本 {} 部署到实例完成", version_id);
    Ok(format!("版本 {} 已部署到实例", version_id))
}
