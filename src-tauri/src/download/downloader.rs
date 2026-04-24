use std::fs;
use std::io::{Seek, SeekFrom, Write};
use tauri::State;
use md5;
use reqwest;
use tokio;
use crate::log_info;
use crate::download::models::{DownloadTask, DownloadProgress};
use crate::download::utils::{CHUNK_SIZE, MAX_CHUNKS, MAX_RETRIES, verify_file_sha1};
use crate::download::manager::DownloadManager;


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
    log_info!("保存路径：{:?}", save_path);
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