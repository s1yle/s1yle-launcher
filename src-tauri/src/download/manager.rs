use crate::download::VersionJsonManifest;
use crate::download::models::DownloadTask;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio_util::sync::CancellationToken;

/// 下载管理器，管理下载任务、文件路径和清单缓存
#[derive(Clone)]
pub struct DownloadManager {
    /// 统一 HTTP 客户端（连接池复用，请求超时 300s，连接超时 10s，读取间隔超时 30s）
    pub(crate) client: Arc<Client>,
    /// 下载任务映射
    pub tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    /// 版本下载清单缓存
    pub manifest_cache: Arc<Mutex<HashMap<String, VersionJsonManifest>>>,
    /// 部署中的取消令牌（key = version_id，供 cancel_version_download 触发）
    pub cancellations: Arc<Mutex<HashMap<String, CancellationToken>>>,
}

impl DownloadManager {
    /// 创建新的下载管理器
    pub fn new() -> Self {
        Self {
            client: Arc::new(
                Client::builder()
                    .user_agent(format!(
                        "{}/{}",
                        env!("CARGO_PKG_NAME"),
                        env!("CARGO_PKG_VERSION")
                    ))
                    .timeout(Duration::from_secs(300))
                    .connect_timeout(Duration::from_secs(10))
                    .read_timeout(Duration::from_secs(30))
                    .build()
                    .expect("创建 HTTP 客户端失败"),
            ),
            tasks: Arc::new(Mutex::new(HashMap::new())),
            manifest_cache: Arc::new(Mutex::new(HashMap::new())),
            cancellations: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 注册部署取消令牌（key = version_id）
    pub fn register_cancellation(&self, version_id: &str) -> CancellationToken {
        let token = CancellationToken::new();
        self.cancellations
            .lock()
            .unwrap()
            .insert(version_id.to_string(), token.clone());
        token
    }

    /// 注销部署取消令牌（部署完成或失败后由调用方清理）
    pub fn unregister_cancellation(&self, version_id: &str) {
        self.cancellations.lock().unwrap().remove(version_id);
    }

    /// 获取统一 HTTP 客户端
    pub fn client(&self) -> &Client {
        &self.client
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
