use crate::download::manager::DownloadManager;
use crate::download::models::{DownloadProgress, DownloadTask};
use crate::download::utils::{CHUNK_SIZE, MAX_CHUNKS, MAX_RETRIES, verify_file_sha1};
use crate::log_info;
use md5;
use reqwest;
use std::fs;
use std::io::{Seek, SeekFrom, Write};
use tauri::State;
use tokio;

/// 通过 HEAD 请求获取文件总大小
async fn get_content_length(client: &reqwest::Client, url: &str) -> Result<u64, String> {
    let resp = client
        .head(url)
        .send()
        .await
        .map_err(|e| format!("HEAD 请求失败：{}", e))?;

    resp.content_length()
        .ok_or_else(|| "无法获取文件大小".to_string())
}

/// 分块下载结果
struct ChunkResult {
    chunk_index: usize,
    data: Vec<u8>,
}

/// 下载单个分块（支持 Range 请求）
async fn download_chunk(
    client: &reqwest::Client,
    url: &str,
    start: u64,
    end: u64,
    index: usize,
) -> Result<ChunkResult, String> {
    let resp = client
        .get(url)
        .header("Range", format!("bytes={}-{}", start, end))
        .send()
        .await
        .map_err(|e| format!("分块请求失败：{}", e))?;

    let data = resp
        .bytes()
        .await
        .map_err(|e| format!("读取分块数据失败：{}", e))?;

    log_info!(
        "分块下载完成：{} ({}-{} / {} bytes)",
        url,
        start,
        end,
        data.len()
    );

    Ok(ChunkResult {
        chunk_index: index,
        data: data.to_vec(),
    })
}

/// 分块下载大文件（并发下载多个分块，所有块都要覆盖，仅限制并发数）
async fn download_file_chunked(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    total_size: u64,
    task_id: &str,
    download_manager: &DownloadManager,
) -> Result<u64, String> {
    let num_chunks = (total_size as f64 / CHUNK_SIZE as f64).ceil() as usize;

    log_info!(
        "开始分块下载：{} (总大小：{} bytes, 分块数：{})",
        url,
        total_size,
        num_chunks
    );

    let mut file = fs::File::create(save_path).map_err(|e| format!("创建文件失败：{}", e))?;

    file.set_len(total_size)
        .map_err(|e| format!("预分配文件空间失败：{}", e))?;

    let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(MAX_CHUNKS));
    let mut set = tokio::task::JoinSet::new();

    for i in 0..num_chunks {
        let start = i as u64 * CHUNK_SIZE;
        let end = std::cmp::min(start + CHUNK_SIZE - 1, total_size - 1);

        let client = client.clone();
        let url = url.to_string();
        let semaphore = semaphore.clone();
        set.spawn(async move {
            let _permit = semaphore
                .acquire()
                .await
                .map_err(|e| format!("获取并发许可失败：{}", e))?;

            // 单个分块失败自动重试（最多 2 次额外尝试）
            let mut last_err = None;
            for attempt in 0..=2 {
                match download_chunk(&client, &url, start, end, i).await {
                    Ok(chunk) => return Ok(chunk),
                    Err(e) => {
                        last_err = Some(format!("第 {} 次尝试失败：{}", attempt + 1, e));
                    }
                }
            }
            Err(last_err.unwrap_or_else(|| format!("分块 {} 下载失败", i)))
        });
    }

    let mut downloaded: u64 = 0;
    let mut results = Vec::with_capacity(num_chunks);

    while let Some(res) = set.join_next().await {
        let result = res.map_err(|e| format!("任务执行失败：{}", e))??;

        downloaded += result.data.len() as u64;
        results.push(result);

        if let Some(t) = download_manager.get_task(task_id) {
            let mut updated = t;
            updated.downloaded_size = downloaded;
            updated.total_size = total_size;
            download_manager.update_task(updated);
        }
    }

    for result in results {
        let offset = result.chunk_index as u64 * CHUNK_SIZE;
        file.seek(SeekFrom::Start(offset))
            .map_err(|e| format!("文件定位失败：{}", e))?;
        file.write_all(&result.data)
            .map_err(|e| format!("写入分块数据失败：{}", e))?;
    }

    file.flush().map_err(|e| format!("刷新文件失败：{}", e))?;

    log_info!("分块下载完成：{} ({} bytes)", url, downloaded);
    Ok(downloaded)
}

/// 单线程下载小文件（含自动重试）
async fn download_file_single(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    task_id: &str,
    download_manager: &DownloadManager,
) -> Result<u64, String> {
    let mut retries = 0;

    while retries <= MAX_RETRIES {
        if retries > 0 {
            log_info!("重试下载 (第 {} 次): {}", retries, url);
            tokio::time::sleep(std::time::Duration::from_millis(1000 * retries as u64)).await;
        }

        match download_attempt(client, url, save_path, task_id, download_manager).await {
            Ok(size) => {
                log_info!("下载完成：{} ({} bytes)", url, size);
                return Ok(size);
            }
            Err(e) => {
                retries += 1;
                log_info!("下载失败 (第 {} 次): {} - {}", retries, url, e);

                if retries > MAX_RETRIES {
                    return Err(format!("下载失败 (已重试 {} 次): {}", MAX_RETRIES, e));
                }
            }
        }
    }

    Err("下载失败：超过最大重试次数".to_string())
}

/// 执行单次下载尝试（流式写入文件并更新进度）
async fn download_attempt(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    task_id: &str,
    download_manager: &DownloadManager,
) -> Result<u64, String> {
    let mut resp = client
        .get(url)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    let total = resp.content_length().unwrap_or(0);
    let mut file = fs::File::create(save_path).map_err(|e| format!("创建文件失败：{}", e))?;

    let mut downloaded: u64 = 0;

    while let Some(chunk) = resp
        .chunk()
        .await
        .map_err(|e| format!("读取数据失败：{}", e))?
    {
        file.write_all(&chunk)
            .map_err(|e| format!("写入文件失败：{}", e))?;
        downloaded += chunk.len() as u64;

        if let Some(t) = download_manager.get_task(task_id) {
            let mut updated = t;
            updated.downloaded_size = downloaded;
            updated.total_size = total;
            download_manager.update_task(updated);
        }
    }

    Ok(downloaded)
}

/// 下载单个文件到指定路径（支持分块下载和 SHA1 校验），返回下载字节数
///
/// 适用于部署流程复用：不依赖 Tauri State，直接传入 DownloadManager 引用。
pub(crate) async fn download_file_with_task(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    sha1: Option<&str>,
    total_size: Option<u64>,
    download_manager: &DownloadManager,
    task_id: &str,
) -> Result<u64, String> {
    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败：{}", e))?;
    }

    let urls: Vec<String> = match crate::download::utils::mirror_url(url) {
        Some(mirror) => vec![mirror, url.to_string()],
        None => vec![url.to_string()],
    };

    // 获取文件总大小（按候选源逐个尝试）
    let size = if let Some(s) = total_size {
        s
    } else {
        let mut size = None;
        for u in &urls {
            match get_content_length(client, u).await {
                Ok(s) => {
                    size = Some(s);
                    break;
                }
                Err(_) => continue,
            }
        }
        size.ok_or_else(|| format!("无法获取文件大小：{}", url))?
    };

    let task = DownloadTask {
        id: task_id.to_string(),
        url: url.to_string(),
        path: save_path.to_string_lossy().to_string(),
        filename: save_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default(),
        total_size: size,
        downloaded_size: 0,
        status: "downloading".to_string(),
    };

    download_manager.add_task(task.clone());

    // 按候选源依次尝试（镜像优先，失败自动回退官方源）
    let mut result = Err("无可用下载源".to_string());
    for u in &urls {
        log_info!("下载源尝试：{}", u);
        let attempt = if size > CHUNK_SIZE as u64 {
            download_file_chunked(client, u, save_path, size, task_id, download_manager).await
        } else {
            download_file_single(client, u, save_path, task_id, download_manager).await
        };

        match attempt {
            Ok(downloaded) => {
                result = Ok(downloaded);
                break;
            }
            Err(e) => {
                log_info!("下载源失败（尝试下一源）：{} - {}", u, e);
                result = Err(e);
            }
        }
    }
    match result {
        Ok(downloaded) => {
            if let Some(expected_sha1) = sha1 {
                log_info!("开始 SHA1 校验：{}", save_path.display());
                let valid = verify_file_sha1(save_path, expected_sha1)?;
                if !valid {
                    let mut updated = task;
                    updated.status = "failed".to_string();
                    download_manager.update_task(updated);
                    return Err(format!("SHA1 校验失败：{}", url));
                }
                log_info!("SHA1 校验通过：{}", save_path.display());
            }

            let mut updated = task;
            updated.downloaded_size = downloaded;
            updated.status = "completed".to_string();
            download_manager.update_task(updated);

            log_info!("文件下载完成：{}", save_path.display());

            Ok(downloaded)
        }
        Err(e) => {
            let mut updated = task;
            updated.status = "failed".to_string();
            download_manager.update_task(updated);

            Err(e)
        }
    }
}

/// 下载单个文件（支持分块下载和 SHA1 校验），返回下载进度
#[tauri::command]
pub async fn download_file(
    version_id: String,
    url: String,
    filename: String,
    sha1: Option<String>,
    skip_verify: Option<bool>,
    total_size: Option<u64>,
    download_manager: State<'_, DownloadManager>,
) -> Result<DownloadProgress, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败：{}", e))?;

    // 文件下载到 /.smcl/download/{version_id}/ 目录
    let base_path = download_manager.get_version_download_path(&version_id);
    let save_path = base_path.join(&filename);

    let task_id = format!("{:x}", md5::compute(&url));
    let expected_sha1 = if skip_verify.unwrap_or(false) {
        None
    } else {
        sha1
    };

    match download_file_with_task(
        &client,
        &url,
        &save_path,
        expected_sha1.as_deref(),
        total_size,
        download_manager.inner(),
        &task_id,
    )
    .await
    {
        Ok(size) => Ok(DownloadProgress {
            task_id,
            downloaded: size,
            total: size,
            speed: 0.0,
            status: "completed".to_string(),
        }),
        Err(e) => Err(e),
    }
}
