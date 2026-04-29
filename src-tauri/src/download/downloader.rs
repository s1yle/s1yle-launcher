use crate::download::manager::DownloadManager;
use crate::download::models::{DownloadProgress, DownloadTask};
use crate::download::utils::{verify_file_sha1, CHUNK_SIZE, MAX_CHUNKS, MAX_RETRIES};
use crate::log_info;
use md5;
use reqwest;
use std::fs;
use std::io::{Seek, SeekFrom, Write};
use tauri::State;
use tokio;

async fn get_content_length(client: &reqwest::Client, url: &str) -> Result<u64, String> {
    let resp = client
        .head(url)
        .send()
        .await
        .map_err(|e| format!("HEAD 请求失败：{}", e))?;

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

async fn download_file_chunked(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    total_size: u64,
    task_id: &str,
    download_manager: &State<'_, DownloadManager>,
) -> Result<u64, String> {
    let num_chunks = std::cmp::min(
        (total_size as f64 / CHUNK_SIZE as f64).ceil() as usize,
        MAX_CHUNKS,
    );

    log_info!(
        "开始分块下载：{} (总大小：{} bytes, 分块数：{})",
        url,
        total_size,
        num_chunks
    );

    let mut file = fs::File::create(save_path)
        .map_err(|e| format!("创建文件失败：{}", e))?;

    file.set_len(total_size)
        .map_err(|e| format!("预分配文件空间失败：{}", e))?;

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
        let result = handle.await.map_err(|e| format!("任务执行失败：{}", e))??;

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
            .map_err(|e| format!("文件定位失败：{}", e))?;
        file.write_all(&result.data)
            .map_err(|e| format!("写入分块数据失败：{}", e))?;
    }

    file.flush().map_err(|e| format!("刷新文件失败：{}", e))?;

    log_info!("分块下载完成：{} ({} bytes)", url, downloaded);
    Ok(downloaded)
}

async fn download_file_single(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    task_id: &str,
    download_manager: &State<'_, DownloadManager>,
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

async fn download_attempt(
    client: &reqwest::Client,
    url: &str,
    save_path: &std::path::Path,
    task_id: &str,
    download_manager: &State<'_, DownloadManager>,
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

#[tauri::command]
pub async fn download_file(
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

    let base_path = download_manager.base_path.lock().unwrap().clone();
    let save_path = base_path.join(&filename);

    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败：{}", e))?;
    }

    let size = total_size.unwrap_or(get_content_length(&client, &url).await?);

    let task = DownloadTask {
        id: format!("{:x}", md5::compute(&url)),
        url: url.clone(),
        path: filename.clone(),
        filename: filename.clone(),
        total_size: size,
        downloaded_size: 0,
        status: "downloading".to_string(),
    };

    download_manager.add_task(task.clone());

    let result = if size > CHUNK_SIZE as u64 {
        download_file_chunked(&client, &url, &save_path, size, &task.id, &download_manager).await
    } else {
        download_file_single(&client, &url, &save_path, &task.id, &download_manager).await
    };

    match result {
        Ok(_) => {
            if !skip_verify.unwrap_or(false) {
                if let Some(expected_sha1) = sha1 {
                    log_info!("开始 SHA1 校验：{}", filename);
                    verify_file_sha1(&save_path, &expected_sha1)?;
                    log_info!("SHA1 校验通过：{}", filename);
                }
            }

            let mut updated = task.clone();
            updated.status = "completed".to_string();
            download_manager.update_task(updated);

            Ok(DownloadProgress {
                task_id: task.id.clone(),
                downloaded: size,
                total: size,
                speed: 0.0,
                status: "completed".to_string(),
            })
        }
        Err(e) => {
            let mut updated = task;
            updated.status = "failed".to_string();
            download_manager.update_task(updated);

            Err(e)
        }
    }
}
