use crate::download::FileDownload;
use crate::download::manager::DownloadManager;
use crate::download::models::{DownloadProgress, DownloadTask};
use crate::download::utils::verify_file_sha1;
use crate::download::utils::{CHUNK_SIZE, MAX_CHUNKS, MAX_RETRIES};
use crate::log_info;
use md5;
use std::fs;
use std::io::{Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::Emitter;
use tokio;
use tokio_util::sync::CancellationToken;

/// 下载字节进度回调（每收到一块数据调用一次）
pub type ByteProgressCb = Option<Arc<dyn Fn(u64) + Send + Sync>>;

/// 版本部署的整体下载进度跟踪器
///
/// 跨阶段（libraries / assets / natives / client / index）累计已下载字节与文件数，
/// 统一通过 `download-progress` 事件推送给前端（250ms 节流）。
pub struct DownloadProgressTracker {
    app_handle: tauri::AppHandle,
    version_id: String,
    total_bytes: u64,
    files_total: u64,
    bytes_done: Arc<AtomicU64>,
    files_done: Arc<AtomicU64>,
    current_file: Mutex<String>,
    phase: Mutex<String>,
    start: Instant,
    last_emit: Mutex<Instant>,
    last_speed: Mutex<(Instant, u64)>,
}

impl DownloadProgressTracker {
    /// 创建进度跟踪器（total_bytes / files_total 为部署整体统计）
    pub fn new(
        app_handle: tauri::AppHandle,
        version_id: &str,
        total_bytes: u64,
        files_total: u64,
    ) -> Self {
        let now = Instant::now();
        Self {
            app_handle,
            version_id: version_id.to_string(),
            total_bytes,
            files_total,
            bytes_done: Arc::new(AtomicU64::new(0)),
            files_done: Arc::new(AtomicU64::new(0)),
            current_file: Mutex::new(String::new()),
            phase: Mutex::new(String::new()),
            start: now,
            last_emit: Mutex::new(now),
            last_speed: Mutex::new((now, 0)),
        }
    }

    /// 切换当前阶段（如 downloading_libraries）
    pub fn set_phase(&self, phase: &str) {
        *self.phase.lock().unwrap() = phase.to_string();
    }

    /// 累加已下载字节并节流上报
    pub fn add_bytes(&self, n: u64) {
        self.bytes_done.fetch_add(n, Ordering::Relaxed);
        self.emit(false);
    }

    /// 一个文件完成（无论实际下载还是已存在跳过），计入字节与文件数并立即上报
    pub fn add_file(&self, path: &str, size: u64) {
        *self.current_file.lock().unwrap() = path.to_string();
        self.files_done.fetch_add(1, Ordering::Relaxed);
        self.bytes_done.fetch_add(size, Ordering::Relaxed);
        self.emit(true);
    }

    /// 上报进度（force 时忽略节流）
    fn emit(&self, force: bool) {
        if !force {
            let mut last = self.last_emit.lock().unwrap();
            let now = Instant::now();
            if now.duration_since(*last) < std::time::Duration::from_millis(250) {
                return;
            }
            *last = now;
        }

        let bytes = self.bytes_done.load(Ordering::Relaxed);
        let elapsed = self.start.elapsed().as_secs_f64().max(0.001);

        let mut speed_guard = self.last_speed.lock().unwrap();
        let speed = if bytes > speed_guard.1 {
            let dt = elapsed - speed_guard.0.elapsed().as_secs_f64();
            let s = if dt > 0.0 {
                (bytes - speed_guard.1) as f64 / dt
            } else {
                0.0
            };
            speed_guard.0 = Instant::now();
            speed_guard.1 = bytes;
            s
        } else {
            0.0
        };

        let progress = DownloadProgress {
            version_id: Some(self.version_id.clone()),
            phase: Some(self.phase.lock().unwrap().clone()),
            file: Some(self.current_file.lock().unwrap().clone()),
            downloaded: bytes,
            total: self.total_bytes,
            files_done: self.files_done.load(Ordering::Relaxed),
            files_total: self.files_total,
            speed,
            status: "downloading".to_string(),
        };

        let _ = self.app_handle.emit("download-progress", progress);
    }
}

impl DownloadManager {
    /// 通过 HEAD 请求获取文件总大小
    async fn get_content_length(&self, url: &str) -> Result<u64, String> {
        let resp = self
            .client
            .head(url)
            .send()
            .await
            .map_err(|e| format!("HEAD 请求失败：{}", e))?
            .error_for_status()
            .map_err(|e| format!("HEAD 请求被拒绝：{}", e))?;

        resp.content_length()
            .ok_or_else(|| "无法获取文件大小".to_string())
    }

    /// 解析请求的终态下载地址（跟随重定向链）。
    ///
    /// 分块下载前先解析一次，让后续所有分块请求直连重定向终点（CDN/教育网镜像），
    /// 避免每个分块都重新经过镜像层消耗限流配额。429 限流时由调用方等待窗口恢复。
    async fn resolve_terminal_url(&self, url: &str) -> Result<String, String> {
        let resp = self
            .client
            .get(url)
            .header("Range", "bytes=0-0")
            .timeout(Duration::from_secs(30))
            .send()
            .await
            .map_err(|e| format!("寻址请求失败：{}", e))?
            .error_for_status()
            .map_err(|e| format!("寻址请求被拒绝：{}", e))?;

        Ok(resp.url().to_string())
    }

    /// 判断错误是否为镜像限流（HTTP 429）
    fn is_rate_limited(err: &str) -> bool {
        err.contains("429")
    }

    /// 等待镜像限流窗口恢复（滑动窗口约每 6s 恢复 1 个额度，最多等一个完整窗口 60s）。
    /// 返回 false 表示已达到等待上限，应放弃该源。
    async fn wait_for_rate_limit(waits: &mut u32) -> bool {
        if *waits >= 10 {
            return false;
        }
        *waits += 1;
        tokio::time::sleep(Duration::from_secs(6)).await;
        true
    }

    /// 检查取消令牌，已取消则返回错误（下载链路各环节的取消检查点）
    fn check_cancelled(token: Option<&CancellationToken>) -> Result<(), String> {
        if let Some(t) = token {
            if t.is_cancelled() {
                return Err("下载已取消".to_string());
            }
        }
        Ok(())
    }

    /// 分块下载大文件（并发下载多个分块，所有块都要覆盖，仅限制并发数）
    async fn download_file_chunked(
        &self,
        url: &str,
        save_path: &std::path::Path,
        total_size: u64,
        task_id: &str,
        on_bytes: &ByteProgressCb,
        token: Option<&CancellationToken>,
    ) -> Result<u64, String> {
        Self::check_cancelled(token)?;
        let start = Instant::now();
        let num_chunks = (total_size as f64 / CHUNK_SIZE as f64).ceil() as usize;

        // 解析终态下载地址（仅 1 次镜像请求），分块直连重定向终点，避免每块重复消耗限流配额
        let mut resolve_waits = 0u32;
        let terminal_url = loop {
            Self::check_cancelled(token)?;
            match self.resolve_terminal_url(url).await {
                Ok(t) => break t,
                Err(e) if Self::is_rate_limited(&e)
                    && Self::wait_for_rate_limit(&mut resolve_waits).await =>
                {
                    log_info!("寻址请求命中限流，等待窗口恢复后重试：{}", url);
                }
                Err(e) => return Err(e),
            }
        };
        if terminal_url != url {
            log_info!("下载重定向终态：{} -> {}", url, terminal_url);
        }

        log_info!(
            "开始分块下载：{} (总大小：{} bytes, 分块数：{})",
            terminal_url,
            total_size,
            num_chunks
        );

        let mut file = fs::File::create(save_path).map_err(|e| format!("创建文件失败：{}", e))?;

        file.set_len(total_size)
            .map_err(|e| format!("预分配文件空间失败：{}", e))?;

        let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(MAX_CHUNKS));
        let mut set = tokio::task::JoinSet::new();

        for i in 0..num_chunks {
            Self::check_cancelled(token)?;
            let start = i as u64 * CHUNK_SIZE;
            let end = std::cmp::min(start + CHUNK_SIZE - 1, total_size - 1);

            let dm = self.clone();
            let url = terminal_url.to_string();
            let semaphore = semaphore.clone();
            let token = token.cloned();
            set.spawn(async move {
                Self::check_cancelled(token.as_ref())?;
                let _permit = semaphore
                    .acquire()
                    .await
                    .map_err(|e| format!("获取并发许可失败：{}", e))?;

                // 单个分块失败自动重试（最多 2 次额外尝试）；429 限流时等待窗口恢复
                let mut last_err = None;
                let mut rate_waits = 0u32;
                for attempt in 0..=2 {
                    match dm.download_chunk(&url, start, end, i).await {
                        Ok(chunk) => return Ok(chunk),
                        Err(e) => {
                            if Self::is_rate_limited(&e)
                                && Self::wait_for_rate_limit(&mut rate_waits).await
                            {
                                continue;
                            }
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
            if let Some(cb) = on_bytes {
                cb(result.data.len() as u64);
            }
            results.push(result);

            if let Some(t) = self.get_task(task_id) {
                let mut updated = t;
                updated.downloaded_size = downloaded;
                updated.total_size = total_size;
                self.update_task(updated);
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

        let elapsed = start.elapsed().as_millis();
        let speed = if elapsed > 0 {
            downloaded as f64 / elapsed as f64 * 1000.0
        } else {
            0.0
        };
        log_info!(
            "分块下载完成：{} ({} bytes, 耗时 {}ms, 速度 {:.2} KB/s)",
            url,
            downloaded,
            elapsed,
            speed / 1024.0
        );
        Ok(downloaded)
    }

    /// 单线程下载小文件（含自动重试；429 限流时等待窗口恢复，不计入重试次数）
    async fn download_file_single(
        &self,
        url: &str,
        save_path: &std::path::Path,
        task_id: &str,
        on_bytes: &ByteProgressCb,
        token: Option<&CancellationToken>,
    ) -> Result<u64, String> {
        let mut retries = 0;
        let mut rate_waits = 0u32;

        loop {
            Self::check_cancelled(token)?;
            match self
                .download_attempt(url, save_path, task_id, on_bytes, token)
                .await
            {
                Ok(size) => {
                    log_info!("下载完成：{} ({} bytes)", url, size);
                    return Ok(size);
                }
                Err(e) => {
                    if Self::is_rate_limited(&e)
                        && Self::wait_for_rate_limit(&mut rate_waits).await
                    {
                        log_info!("命中限流，等待窗口恢复后重试：{} - {}", url, e);
                        continue;
                    }
                    retries += 1;
                    log_info!("下载失败 (第 {} 次): {} - {}", retries, url, e);

                    if retries > MAX_RETRIES {
                        return Err(format!("下载失败 (已重试 {} 次): {}", MAX_RETRIES, e));
                    }
                    log_info!("重试下载 (第 {} 次): {}", retries, url);
                    tokio::time::sleep(Duration::from_millis(1000 * retries as u64)).await;
                }
            }
        }
    }

    /// 执行单次下载尝试（流式写入文件并更新进度）
    async fn download_attempt(
        &self,
        url: &str,
        save_path: &std::path::Path,
        task_id: &str,
        on_bytes: &ByteProgressCb,
        token: Option<&CancellationToken>,
    ) -> Result<u64, String> {
        Self::check_cancelled(token)?;
        let start = Instant::now();
        let send = self
            .client
            .get(url)
            .timeout(std::time::Duration::from_secs(60))
            .send();
        let mut resp = match token {
            Some(t) => {
                let resp = tokio::select! {
                    r = send => r,
                    _ = t.cancelled() => return Err("下载已取消".to_string()),
                };
                resp
            }
            None => send.await,
        }
        .map_err(|e| format!("请求失败：{}", e))?
        .error_for_status()
        .map_err(|e| format!("请求被拒绝：{}", e))?;
        let connect_elapsed = start.elapsed().as_millis();
        log_info!(
            "请求建立耗时：{}ms - {}",
            connect_elapsed,
            url
        );

        let total = resp.content_length().unwrap_or(0);
        let mut file = fs::File::create(save_path).map_err(|e| format!("创建文件失败：{}", e))?;

        let mut downloaded: u64 = 0;

        while let Some(chunk) = resp
            .chunk()
            .await
            .map_err(|e| format!("读取数据失败：{}", e))?
        {
            Self::check_cancelled(token)?;
            file.write_all(&chunk)
                .map_err(|e| format!("写入文件失败：{}", e))?;
            downloaded += chunk.len() as u64;

            if let Some(cb) = on_bytes {
                cb(chunk.len() as u64);
            }

            if let Some(t) = self.get_task(task_id) {
                let mut updated = t;
                updated.downloaded_size = downloaded;
                updated.total_size = total;
                self.update_task(updated);
            }
        }

        let read_elapsed = start.elapsed().as_millis() - connect_elapsed;
        let speed = if read_elapsed > 0 {
            downloaded as f64 / read_elapsed as f64 * 1000.0
        } else {
            0.0
        };
        log_info!(
            "单文件下载耗时：读取 {}ms, 共 {} bytes, 速度 {:.2} KB/s - {}",
            read_elapsed,
            downloaded,
            speed / 1024.0,
            url
        );

        Ok(downloaded)
    }

    /// 下载单个文件到指定路径（支持分块下载和 SHA1 校验），返回下载字节数
    ///
    /// 适用于部署流程复用：直接以 DownloadManager 方法调用。
    async fn download_file_with_task(
        &self,
        url: &str,
        save_path: &std::path::Path,
        sha1: Option<&str>,
        total_size: Option<u64>,
        task_id: &str,
        on_bytes: &ByteProgressCb,
        token: Option<&CancellationToken>,
    ) -> Result<u64, String> {
        Self::check_cancelled(token)?;
        let start = Instant::now();
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
                match self.get_content_length(u).await {
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

        self.add_task(task.clone());

        // 按候选源依次尝试（镜像优先，失败自动回退官方源）
        let mut result = Err("无可用下载源".to_string());
        for u in &urls {
            Self::check_cancelled(token)?;
            log_info!("下载源尝试：{}", u);
            let attempt = if size > CHUNK_SIZE as u64 {
                self.download_file_chunked(u, save_path, size, task_id, on_bytes, token)
                    .await
            } else {
                self.download_file_single(u, save_path, task_id, on_bytes, token)
                    .await
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
                    let sha1_start = Instant::now();
                    log_info!("开始 SHA1 校验：{}", save_path.display());
                    let valid = verify_file_sha1(save_path, expected_sha1)?;
                    log_info!(
                        "SHA1 校验耗时：{}ms，结果 {} - {}",
                        sha1_start.elapsed().as_millis(),
                        if valid { "通过" } else { "失败" },
                        save_path.display()
                    );
                    if !valid {
                        let mut updated = task;
                        updated.status = "failed".to_string();
                        self.update_task(updated);
                        return Err(format!("SHA1 校验失败：{}", url));
                    }
                    log_info!("SHA1 校验通过：{}", save_path.display());
                }

                let mut updated = task;
                updated.downloaded_size = downloaded;
                updated.status = "completed".to_string();
                self.update_task(updated);

                let elapsed = start.elapsed().as_millis();
                let speed = if elapsed > 0 {
                    downloaded as f64 / elapsed as f64 * 1000.0
                } else {
                    0.0
                };
                log_info!(
                    "文件总耗时：{}ms ({} bytes, {:.2} KB/s) - {}",
                    elapsed,
                    downloaded,
                    speed / 1024.0,
                    save_path.display()
                );

                Ok(downloaded)
            }
            Err(e) => {
                let mut updated = task;
                updated.status = "failed".to_string();
                self.update_task(updated);

                Err(e)
            }
        }
    }

    /// 下载单个文件（支持分块下载和 SHA1 校验），返回下载进度
    pub async fn download_file(
        &self,
        url: &str,
        save_path: &Path,
        sha1: Option<&str>,
        total_size: Option<u64>,
    ) -> Result<DownloadProgress, String> {
        let task_id = format!("{:x}", md5::compute(url));

        match self
            .download_file_with_task(url, save_path, sha1, total_size, &task_id, &None, None)
            .await
        {
            Ok(size) => Ok(DownloadProgress {
                version_id: None,
                phase: None,
                file: None,
                downloaded: size,
                total: size,
                files_done: 1,
                files_total: 1,
                speed: 0.0,
                status: "completed".to_string(),
            }),
            Err(e) => Err(e),
        }
    }

    /// 下载一组文件到目标目录并逐步上报进度（Phase 1-3 公共下载循环）
    pub async fn download_group_with_progress(
        &self,
        files: &[FileDownload],
        dest_base: &Path,
        phase: &str,
        tracker: &Arc<DownloadProgressTracker>,
        completed: &mut usize,
        token: Option<&CancellationToken>,
    ) -> Result<(), String> {
        Self::check_cancelled(token)?;
        let start = Instant::now();
        tracker.set_phase(phase);

        let results = self
            .download_files_concurrent(files, dest_base, tracker.clone(), token)
            .await?;

        let elapsed = start.elapsed().as_millis();
        let total_bytes: u64 = files.iter().map(|f| f.size).sum();
        let speed = if elapsed > 0 {
            total_bytes as f64 / elapsed as f64 * 1000.0
        } else {
            0.0
        };
        log_info!(
            "[阶段耗时] {}: {} 个文件, {} bytes, 耗时 {}ms, 组均速 {:.2} KB/s",
            phase,
            files.len(),
            total_bytes,
            elapsed,
            speed / 1024.0
        );

        for (idx, downloaded) in results {
            let path = &files[idx].path;
            if downloaded {
                log_info!("[{}] 已下载: {}", idx + 1, path);
            } else {
                log_info!("[{}] 已存在（校验通过）: {}", idx + 1, path);
            }
            *completed += 1;
        }
        Ok(())
    }

    /// 下载文件（已存在且 SHA1 匹配则跳过，损坏则重新下载），返回是否实际下载
    pub async fn download_file_if_needed(
        &self,
        url: &str,
        dest_path: &Path,
        expected_sha1: Option<&str>,
        total_size: Option<u64>,
        on_bytes: &ByteProgressCb,
        token: Option<&CancellationToken>,
    ) -> Result<bool, String> {
        Self::check_cancelled(token)?;
        if dest_path.exists() {
            if let Some(sha1) = expected_sha1 {
                if verify_file_sha1(dest_path, sha1)? {
                    return Ok(false);
                }
                log_info!("文件已存在但 SHA1 校验失败，重新下载: {}", url);
            } else {
                return Ok(false);
            }
        }

        let task_id = format!("{:x}", md5::compute(url.as_bytes()));
        self.download_file_with_task(url, dest_path, expected_sha1, total_size, &task_id, on_bytes, token)
            .await?;

        Ok(true)
    }

    /// 并发下载一组文件（限制并发数），返回 (索引, 是否实际下载) 列表
    async fn download_files_concurrent(
        &self,
        files: &[FileDownload],
        base_dir: &Path,
        tracker: Arc<DownloadProgressTracker>,
        token: Option<&CancellationToken>,
    ) -> Result<Vec<(usize, bool)>, String> {
        // 实测 bmclapi2 对并发请求无硬限流（16 并发全 302），仅服务端排队约 0.2-1.9s；
        // 并发越高吞吐越大（= 并发数 / 排队延迟）。429 出现时由限流等待逻辑兜底。
        const CONCURRENCY: usize = 16;
        Self::check_cancelled(token)?;
        let dm = self.clone();
        let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(CONCURRENCY));
        let mut set = tokio::task::JoinSet::new();

        for (idx, file) in files.iter().enumerate() {
            Self::check_cancelled(token)?;
            let dm = dm.clone();
            let semaphore = semaphore.clone();
            let tracker = tracker.clone();
            let token = token.cloned();
            let dest_path = base_dir.join(&file.path);
            let url = file.url.clone();
            let sha1 = file.sha1.clone();
            let size = file.size;
            let path = file.path.clone();

            set.spawn(async move {
                Self::check_cancelled(token.as_ref())?;
                let _permit = semaphore
                    .acquire()
                    .await
                    .map_err(|e| format!("获取并发许可失败: {}", e))?;
                let bytes_cb: Arc<dyn Fn(u64) + Send + Sync> = {
                    let tracker = tracker.clone();
                    Arc::new(move |n| tracker.add_bytes(n))
                };
                let downloaded = dm
                    .download_file_if_needed(
                        &url,
                        &dest_path,
                        sha1.as_deref(),
                        Some(size),
                        &Some(bytes_cb),
                        token.as_ref(),
                    )
                    .await?;
                tracker.add_file(&path, size);
                Ok::<(usize, bool), String>((idx, downloaded))
            });
        }

        let mut results = Vec::with_capacity(files.len());
        while let Some(res) = set.join_next().await {
            let (idx, downloaded) = res.map_err(|e| format!("下载任务失败: {}", e))??;
            results.push((idx, downloaded));
        }
        results.sort_by_key(|(idx, _)| *idx);
        Ok(results)
    }

    /// 下载单个分块（支持 Range 请求），返回分块索引与数据
    async fn download_chunk(
        &self,
        url: &str,
        start: u64,
        end: u64,
        index: usize,
    ) -> Result<ChunkResult, String> {
        let resp = self
            .client
            .get(url)
            .header("Range", format!("bytes={}-{}", start, end))
            .send()
            .await
            .map_err(|e| format!("分块请求失败：{}", e))?;

        if resp.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err("HTTP 429 限流（镜像配额已满）".to_string());
        }

        if resp.status() != reqwest::StatusCode::PARTIAL_CONTENT {
            return Err(format!(
                "分块请求被拒绝：状态码 {}，期望 206 Partial Content",
                resp.status()
            ));
        }

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
}

/// 分块下载结果
struct ChunkResult {
    chunk_index: usize,
    data: Vec<u8>,
}

/// 解压 jar 文件中的内容到指定目录（用于原生库）
pub fn extract_jar(jar_path: &Path, dest_dir: &Path) -> Result<(), String> {

    let file = fs::File::open(jar_path).map_err(|e| format!("打开 jar 文件失败：{}", e))?;

    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("解析 zip 失败：{}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("读取 zip 条目失败：{}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => dest_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| format!("创建目录失败：{}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| format!("创建父目录失败：{}", e))?;
                }
            }

            let mut outfile =
                fs::File::create(&outpath).map_err(|e| format!("创建文件失败：{}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("复制文件失败：{}", e))?;
        }
    }

    Ok(())
}
