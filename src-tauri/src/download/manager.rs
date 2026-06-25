use crate::download::models::DownloadTask;
use crate::download::VersionDownloadManifest;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

/// 下载管理器，管理下载任务、文件路径和清单缓存
pub struct DownloadManager {
    /// 下载任务映射
    pub tasks: Mutex<HashMap<String, DownloadTask>>,
    /// 基础下载路径
    pub base_path: Mutex<PathBuf>,
    /// 版本下载清单缓存
    pub manifest_cache: Mutex<HashMap<String, VersionDownloadManifest>>,
    /// HTTP 客户端
    pub client: reqwest::Client,
}

impl DownloadManager {
    /// 创建新的下载管理器，自动创建基础路径
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

    /// 获取指定版本的下载目录（/.smcl/download/{version_name}/）
    pub fn get_version_download_path(&self, version_name: &str) -> PathBuf {
        let base = self.base_path.lock().unwrap().clone();
        base.join(version_name)
    }

    /// 获取临时文件目录（/.smcl/download/temp/）
    pub fn get_temp_path(&self) -> PathBuf {
        let base = self.base_path.lock().unwrap().clone();
        base.join("temp")
    }

    /// 添加下载任务
    pub fn add_task(&self, task: DownloadTask) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task);
    }

    /// 获取指定 ID 的下载任务
    pub fn get_task(&self, id: &str) -> Option<DownloadTask> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(id).cloned()
    }

    /// 更新下载任务
    pub fn update_task(&self, task: DownloadTask) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task);
    }

    /// 移除下载任务
    pub fn remove_task(&self, id: &str) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.remove(id);
    }

    /// 获取所有下载任务
    pub fn get_all_tasks(&self) -> Vec<DownloadTask> {
        let tasks = self.tasks.lock().unwrap();
        tasks.values().cloned().collect()
    }
}
