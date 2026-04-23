// src-tauri/src/path_manager.rs
// 统一路径管理系统

use std::path::{Path, PathBuf};
use std::fs;
use std::time::{SystemTime, Duration};

/// 部署目标类型
#[allow(dead_code)]
#[derive(Debug, Clone, Copy)]
pub enum DeployTarget {
    /// 部署到全局下载目录（用于版本管理）
    Global,
    /// 部署到指定实例目录
    Instance,
}

/// 路径管理器 - 统一管理所有文件路径
#[allow(dead_code)]
pub struct PathManager {
    /// 应用数据基础目录
    app_data: PathBuf,
    /// 下载缓存基础目录
    download_cache: PathBuf,
    /// 实例基础目录
    instances: PathBuf,
    /// 临时文件基础目录
    temp_base: PathBuf,
}

#[allow(dead_code)]
impl PathManager {
    /// 创建新的路径管理器
    pub fn new(app_data: PathBuf, download_cache: PathBuf, instances: PathBuf) -> Self {
        let temp_base = download_cache.join("temp");
        
        // 确保基础目录存在
        fs::create_dir_all(&app_data).ok();
        fs::create_dir_all(&download_cache).ok();
        fs::create_dir_all(&instances).ok();
        fs::create_dir_all(&temp_base).ok();
        
        Self {
            app_data,
            download_cache,
            instances,
            temp_base,
        }
    }
    
    /// 获取应用数据目录
    pub fn app_data(&self) -> &Path {
        &self.app_data
    }
    
    /// 获取下载缓存目录
    pub fn download_cache(&self) -> &Path {
        &self.download_cache
    }
    
    /// 获取实例目录
    pub fn instances(&self) -> &Path {
        &self.instances
    }
    
    /// 获取版本隔离的临时目录
    /// 格式: {temp_base}/{version_id}/
    pub fn version_temp_dir(&self, version_id: &str) -> PathBuf {
        let dir = self.temp_base.join(version_id);
        fs::create_dir_all(&dir).ok();
        dir
    }
    
    /// 获取任务临时目录（用于单个下载任务）
    /// 格式: {temp_base}/{version_id}/{task_hash}/
    pub fn task_temp_dir(&self, version_id: &str, task_id: &str) -> PathBuf {
        let dir = self.version_temp_dir(version_id).join(task_id);
        fs::create_dir_all(&dir).ok();
        dir
    }
    
    /// 获取库文件下载路径（临时位置）
    pub fn library_temp_path(&self, version_id: &str, library_path: &str) -> PathBuf {
        let temp_dir = self.version_temp_dir(version_id);
        temp_dir.join("libraries").join(library_path)
    }
    
    /// 获取资源文件下载路径（临时位置）
    pub fn asset_temp_path(&self, version_id: &str, asset_path: &str) -> PathBuf {
        let temp_dir = self.version_temp_dir(version_id);
        temp_dir.join("assets").join(asset_path)
    }
    
    /// 获取客户端JAR下载路径（临时位置）
    pub fn client_jar_temp_path(&self, version_id: &str) -> PathBuf {
        let temp_dir = self.version_temp_dir(version_id);
        temp_dir.join("versions").join(version_id).join(format!("{}.jar", version_id))
    }
    
    /// 获取原生库下载路径（临时位置）
    pub fn native_temp_path(&self, version_id: &str, native_path: &str) -> PathBuf {
        let temp_dir = self.version_temp_dir(version_id);
        temp_dir.join("natives").join(native_path)
    }
    
    /// 获取库文件部署路径（全局目录）
    pub fn library_deploy_path(&self, library_path: &str) -> PathBuf {
        self.download_cache.join("libraries").join(library_path)
    }
    
    /// 获取资源文件部署路径（全局目录）
    pub fn asset_deploy_path(&self, asset_path: &str) -> PathBuf {
        self.download_cache.join("assets").join(asset_path)
    }
    
    /// 获取客户端JAR部署路径（全局目录）
    pub fn client_jar_deploy_path(&self, version_id: &str) -> PathBuf {
        self.download_cache.join("versions").join(version_id).join(format!("{}.jar", version_id))
    }
    
    /// 获取原生库部署路径（全局目录）
    pub fn native_deploy_path(&self, version_id: &str) -> PathBuf {
        self.download_cache.join("natives").join(version_id)
    }
    
    /// 获取实例目录路径
    pub fn instance_path(&self, instance_id: &str) -> PathBuf {
        self.instances.join(instance_id)
    }
    
    /// 获取实例中的库文件路径
    pub fn instance_library_path(&self, instance_id: &str, library_path: &str) -> PathBuf {
        self.instance_path(instance_id).join("libraries").join(library_path)
    }
    
    /// 获取实例中的资源文件路径
    pub fn instance_asset_path(&self, instance_id: &str, asset_path: &str) -> PathBuf {
        self.instance_path(instance_id).join("assets").join(asset_path)
    }
    
    /// 获取实例中的客户端JAR路径
    pub fn instance_client_jar_path(&self, instance_id: &str, version_id: &str) -> PathBuf {
        self.instance_path(instance_id).join("versions").join(format!("{}.jar", version_id))
    }
    
    /// 获取实例中的原生库路径
    pub fn instance_native_path(&self, instance_id: &str, version_id: &str) -> PathBuf {
        self.instance_path(instance_id).join("natives").join(version_id)
    }
    
    /// 清理旧的临时目录
    /// 删除超过指定小时数的临时目录
    pub fn cleanup_old_temp(&self, max_age_hours: u32) -> Result<usize, String> {
        if !self.temp_base.exists() {
            return Ok(0);
        }
        
        let max_age = Duration::from_secs(max_age_hours as u64 * 3600);
        let now = SystemTime::now();
        let mut cleaned = 0;
        
        match fs::read_dir(&self.temp_base) {
            Ok(entries) => {
                for entry in entries {
                    match entry {
                        Ok(entry) => {
                            let path = entry.path();
                            if path.is_dir() {
                                match entry.metadata() {
                                    Ok(metadata) => {
                                        if let Ok(modified) = metadata.modified() {
                                            if let Ok(age) = now.duration_since(modified) {
                                                if age > max_age {
                                                    match fs::remove_dir_all(&path) {
                                                        Ok(_) => {
                                                            cleaned += 1;
                                                        }
                                                        Err(e) => {
                                                            eprintln!("清理临时目录失败: {:?} - {}", path, e);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        eprintln!("获取临时目录元数据失败: {:?} - {}", path, e);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("读取临时目录条目失败: {}", e);
                        }
                    }
                }
                Ok(cleaned)
            }
            Err(e) => Err(format!("读取临时目录失败: {}", e)),
        }
    }
    
    /// 清理指定版本的临时目录
    pub fn cleanup_version_temp(&self, version_id: &str) -> Result<(), String> {
        let temp_dir = self.version_temp_dir(version_id);
        if temp_dir.exists() {
            fs::remove_dir_all(&temp_dir)
                .map_err(|e| format!("清理版本临时目录失败: {}", e))?;
        }
        Ok(())
    }
    
    /// 检查文件是否已部署（全局目录）
    pub fn is_file_deployed(&self, relative_path: &str) -> bool {
        let path = self.download_cache.join(relative_path);
        path.exists()
    }
    
    /// 检查版本是否已部署（全局目录）
    pub fn is_version_deployed(&self, version_id: &str) -> bool {
        let jar_path = self.client_jar_deploy_path(version_id);
        jar_path.exists()
    }
    
    /// 安全移动文件（原子操作）
    pub fn safe_move(&self, source: &Path, dest: &Path) -> Result<(), String> {
        if !source.exists() {
            return Err(format!("源文件不存在: {:?}", source));
        }
        
        // 确保目标目录存在
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建目标目录失败: {}", e))?;
        }
        
        // 尝试重命名（原子操作）
        match fs::rename(source, dest) {
            Ok(_) => Ok(()),
            Err(_e) => {
                // 如果重命名失败（跨设备等），使用复制+删除
                fs::copy(source, dest)
                    .map_err(|e| format!("复制文件失败: {}", e))?;
                fs::remove_file(source)
                    .map_err(|e| format!("删除源文件失败: {}", e))?;
                Ok(())
            }
        }
    }
}

/// 从配置创建默认路径管理器
#[allow(dead_code)]
pub fn create_default_path_manager() -> PathManager {
    use crate::core::config::PathConfig;
    
    let path_config = PathConfig::default();
    PathManager::new(path_config.app_data, path_config.download_cache, path_config.instances)
}
