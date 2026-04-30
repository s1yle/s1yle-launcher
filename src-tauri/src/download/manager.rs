use crate::download::models::DownloadTask;
use crate::download::VersionDownloadManifest;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

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
