use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use uuid::Uuid;

use super::models::{GameInstance, InstanceMeta, KnownPath};
use super::utils::copy_dir_all;
use crate::modloader::ModLoaderType;
use crate::{config, APP_HANDLE, log_error, log_info};

/// 迁移结果
#[derive(Debug, Clone, serde::Serialize)]
pub struct MigrationResult {
    /// 已迁移的版本列表
    pub migrated_versions: Vec<String>,
    /// 已迁移的库文件数
    pub migrated_libraries: usize,
    /// 已迁移的资源文件数
    pub migrated_assets: usize,
    /// 迁移过程中的错误列表
    pub errors: Vec<String>,
}

/// 实例管理器，负责实例的 CRUD、扫描、路径管理、目录迁移等
#[derive(Debug)]
pub struct InstanceManager;

impl InstanceManager {
    /// 创建新的实例管理器，初始化目录结构
    pub fn new() -> Self {
        // 创建新目录结构
        fs::create_dir_all(&*config::MINECRAFT_DIR).ok();
        fs::create_dir_all(&*config::VERSIONS_DIR).ok();
        fs::create_dir_all(&*config::LIBRARIES_DIR).ok();
        fs::create_dir_all(&*config::ASSETS_DIR).ok();
        fs::create_dir_all(&*config::INSTANCE_CONFIGS_DIR).ok();
        
        Self
    }

    /// 获取旧版实例目录（兼容）
    fn get_legacy_minecraft_dir(&self) -> PathBuf {
        (*config::DEAMON_BASE_PATH).clone()
    }

    /// 获取指定实例的 versions 目录
    fn get_versions_dir(&self, name: &str) -> PathBuf {
        self.get_legacy_minecraft_dir().join(name).join("versions")
    }

    /// 获取集中式元数据文件路径
    fn get_meta_path(&self) -> PathBuf {
        (*config::INSTANCE_META_PATH).clone()
    }

    // ==================== 版本目录路径方法 ====================

    /// 获取 Minecraft 根目录
    fn get_minecraft_root_dir(&self) -> PathBuf {
        (*config::MINECRAFT_DIR).clone()
    }

    /// 获取版本目录
    fn get_version_dir(&self, version_id: &str) -> PathBuf {
        (*config::VERSIONS_DIR).join(version_id)
    }

    /// 获取实例配置文件路径
    fn get_instance_config_path(&self, instance_id: &str) -> PathBuf {
        (*config::INSTANCE_CONFIGS_DIR).join(format!("{}.json", instance_id))
    }

    /// 扫描版本目录中的实例
    fn scan_versions(&self) -> Vec<GameInstance> {
        let versions_dir = &*config::VERSIONS_DIR;
        let mut instances = Vec::new();

        if !versions_dir.exists() {
            log_info!("版本目录不存在：{:?}", versions_dir);
            return instances;
        }

        log_info!("开始扫描版本目录：{:?}", versions_dir);

        if let Ok(entries) = fs::read_dir(versions_dir) {
            for entry in entries.flatten() {
                let version_dir = entry.path();
                if !version_dir.is_dir() {
                    continue;
                }

                if let Some(version_id) = version_dir.file_name().and_then(|n| n.to_str()) {
                    if let Some(instance) = self.load_version(version_id) {
                        instances.push(instance);
                    }
                }
            }
        }

        log_info!("扫描到 {} 个版本", instances.len());
        instances
    }

    /// 加载单个版本作为实例
    fn load_version(&self, version_id: &str) -> Option<GameInstance> {
        let version_dir = self.get_version_dir(version_id);
        
        if !version_dir.exists() {
            return None;
        }

        // 检查版本文件是否存在
        let jar_path = version_dir.join(format!("{}.jar", version_id));
        let json_path = version_dir.join(format!("{}.json", version_id));

        if !jar_path.exists() || !json_path.exists() {
            log_info!("版本 {} 缺少必要文件（jar 或 json）", version_id);
            return None;
        }

        // 尝试加载实例配置
        let instance_config = self.load_instance_config(version_id);
        
        let (id, name, loader_type, loader_version, icon_path, created_at, last_played, game_settings) =
            if let Some(config) = instance_config {
                (
                    config.id,
                    config.name,
                    config.loader_type,
                    config.loader_version,
                    config.icon_path,
                    config.created_at,
                    config.last_played,
                    Some(crate::instance::models::GameSettings {
                        use_instance_settings: true,
                        java_path: config.java.java_path,
                        java_version: None,
                        min_memory: Some(config.memory.min_memory as u64),
                        max_memory: Some(config.memory.max_memory as u64),
                        jvm_args: if config.java.java_args.is_empty() { None } else { Some(config.java.java_args) },
                        isolation_mode: Some(crate::instance::models::IsolationMode::Version),
                        width: Some(config.graphics.width),
                        height: Some(config.graphics.height),
                        fullscreen: Some(config.graphics.fullscreen),
                        maximized: None,
                        vsync: None,
                        launcher_visible: None,
                        player_name: None,
                        server_address: None,
                        server_port: None,
                    }),
                )
            } else {
                // 使用默认配置（不保存到磁盘，避免覆盖用户设置）
                let now = chrono::Utc::now().timestamp();
                (
                    version_id.to_string(),  // 使用 version_id 作为 ID
                    version_id.to_string(),
                    ModLoaderType::Vanilla,
                    None,
                    None,
                    now,
                    None,
                    None,
                )
            };

        Some(GameInstance {
            id,
            name,
            version_id: version_id.to_string(),
            loader_type,
            loader_version,
            path: version_dir.to_string_lossy().to_string(),
            icon_path,
            last_played,
            created_at,
            enabled: true,
            game_settings,
        })
    }

    /// 加载实例配置（优先从独立文件，然后从全局配置）
    pub fn load_instance_config(&self, version_id: &str) -> Option<crate::config::InstanceConfig> {
        // 首先尝试从独立文件加载
        let config_path = self.get_instance_config_path(version_id);
        
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(config) = serde_json::from_str::<crate::config::InstanceConfig>(&content) {
                    return Some(config);
                }
            }
        }

        // 尝试从全局配置加载
        if let Some(app_handle) = APP_HANDLE.get() {
            if let Some(config_manager) = app_handle.try_state::<crate::config::ConfigManager>() {
                if let Ok(Some(config)) = config_manager.get_instance_config(version_id) {
                    return Some(config);
                }
            }
        }

        None
    }

    /// 保存实例配置到独立文件
    pub fn save_instance_config(&self, config: &crate::config::InstanceConfig) -> Result<(), String> {
        // 保存到独立文件
        let config_path = self.get_instance_config_path(&config.id);
        
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建实例配置目录失败：{}", e))?;
        }

        let content = serde_json::to_string_pretty(config)
            .map_err(|e| format!("序列化实例配置失败：{}", e))?;

        fs::write(&config_path, content)
            .map_err(|e| format!("写入实例配置失败：{}", e))?;

        log_info!("实例配置已保存：{}", config_path.to_string_lossy());
        Ok(())
    }

    /// 获取实例元数据文件路径（分布式模式）
    fn get_instance_meta_path(&self, instance_name: &str, version: &str) -> PathBuf {
        self.get_legacy_minecraft_dir()
            .join(instance_name)
            .join(format!("{}.json", version))
    }

    /// 读取单个实例元数据（分布式）
    fn read_instance_meta(&self, instance_name: &str, version: &str) -> Option<InstanceMeta> {
        let meta_path = self.get_instance_meta_path(instance_name, version);
        if meta_path.exists() {
            if let Ok(content) = fs::read_to_string(&meta_path) {
                if let Ok(meta) = serde_json::from_str::<InstanceMeta>(&content) {
                    return Some(meta);
                }
            }
        }
        None
    }

    /// 写入单个实例元数据（分布式）
    fn write_instance_meta(&self, instance_name: &str, version: &str, meta: &InstanceMeta) -> Result<(), String> {
        let meta_path = self.get_instance_meta_path(instance_name, version);
        if let Some(parent) = meta_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建元数据目录失败：{}", e))?;
        }
        let content = serde_json::to_string_pretty(meta)
            .map_err(|e| format!("序列化元数据失败：{}", e))?;
        fs::write(&meta_path, content)
            .map_err(|e| format!("写入元数据失败：{}", e))?;
        Ok(())
    }

    /// 读取集中式元数据（兼容模式）
    fn read_central_meta(&self, name: &str) -> Option<InstanceMeta> {
        self.read_all_metas().remove(name)
    }

    /// 保存到集中式元数据文件
    fn save_to_central_meta(&self, name: &str, meta: &InstanceMeta) -> Result<(), String> {
        let mut all = self.read_all_metas();
        all.insert(name.to_string(), meta.clone());
        self.write_all_metas(&all)
    }

    /// 读取所有集中式元数据
    fn read_all_metas(&self) -> HashMap<String, InstanceMeta> {
        let meta_path = self.get_meta_path();
        if meta_path.exists() {
            if let Ok(content) = fs::read_to_string(&meta_path) {
                if let Ok(map) = serde_json::from_str::<HashMap<String, InstanceMeta>>(&content) {
                    return map;
                }
            }
        }
        HashMap::new()
    }

    /// 写入所有集中式元数据
    fn write_all_metas(&self, metas: &HashMap<String, InstanceMeta>) -> Result<(), String> {
        let meta_path = self.get_meta_path();
        if let Some(parent) = meta_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建元数据目录失败: {}", e))?;
        }
        let content =
            serde_json::to_string_pretty(metas).map_err(|e| format!("序列化元数据失败: {}", e))?;
        fs::write(&meta_path, content).map_err(|e| format!("写入元数据失败: {}", e))?;
        Ok(())
    }

    /// 加载实例元数据（支持分布式/集中式双模式）
    pub fn load_meta(&self, name: &str) -> Option<InstanceMeta> {
        match *config::INSTANCE_META_MODE {
            config::MetaMode::Distributed => {
                // 分布式模式：优先读取分布式元数据
                // 需要先获取 version，所以先尝试从集中式读取基本信息
                if let Some(central_meta) = self.read_central_meta(name) {
                    // 尝试读取分布式版本
                    if let Some(dist_meta) = self.read_instance_meta(name, &central_meta.version_id) {
                        return Some(dist_meta);
                    }
                    
                    // 分布式不存在，尝试扫描实例目录获取 version
                    let versions = self.discover_versions(name);
                    if let Some(version) = versions.first() {
                        if let Some(dist_meta) = self.read_instance_meta(name, version) {
                            return Some(dist_meta);
                        }
                    }
                    
                    // 分布式不存在，返回集中式（兼容旧数据）
                    return Some(central_meta);
                }
                
                // 集中式也没有，尝试从实例目录推断
                let versions = self.discover_versions(name);
                if let Some(version) = versions.first() {
                    if let Some(dist_meta) = self.read_instance_meta(name, version) {
                        return Some(dist_meta);
                    }
                }
                
                None
            }
            config::MetaMode::Centralized => {
                // 集中式模式
                self.read_central_meta(name)
            }
        }
    }

    /// 保存实例元数据（支持双模式）
    pub fn save_meta(&self, name: &str, meta: &InstanceMeta) -> Result<(), String> {
        match *config::INSTANCE_META_MODE {
            config::MetaMode::Distributed => {
                // 分布式模式：写入独立文件
                self.write_instance_meta(name, &meta.version_id, meta)?;
                
                // 同时更新集中式文件（保持同步，用于兼容和快速扫描）
                self.save_to_central_meta(name, meta)?;
            }
            config::MetaMode::Centralized => {
                // 集中式模式：只写入集中式文件
                self.save_to_central_meta(name, meta)?;
            }
        }
        Ok(())
    }

    /// 发现实例目录中的版本列表
    fn discover_versions(&self, name: &str) -> Vec<String> {
        let versions_dir = self.get_versions_dir(name);
        let mut versions = Vec::new();
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        versions.push(name.to_string());
                    }
                }
            }
        }
        versions.sort();
        versions
    }

    /// 从旧版实例目录加载单个实例
    fn load_instance(&self, name: &str) -> Option<GameInstance> {
        let minecraft_dir = self.get_legacy_minecraft_dir();
        if !minecraft_dir.is_dir() {
            return None;
        }

        let instance_dir = minecraft_dir.join(name);
        if !instance_dir.is_dir() {
            return None;
        }

        let versions = self.discover_versions(name);
        let version = versions
            .first()
            .cloned()
            .unwrap_or_else(|| "unknown".to_string());

        let (id, loader_type, loader_version, icon_path, created_at, last_played, game_settings) =
            if let Some(meta) = self.load_meta(name) {
                (
                    meta.id,
                    meta.loader_type,
                    meta.loader_version,
                    meta.icon_path,
                    meta.created_at,
                    meta.last_played,
                    meta.game_settings,
                )
            } else {
                let now = instance_dir
                    .metadata()
                    .ok()
                    .and_then(|m| m.created().ok())
                    .map(|t| {
                        t.duration_since(std::time::UNIX_EPOCH)
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0)
                    })
                    .unwrap_or(0);
                let new_meta = InstanceMeta {
                    id: Uuid::new_v4().to_string(),
                    name: name.to_string(),
                    version_id: version.clone(),
                    loader_type: ModLoaderType::Vanilla,
                    loader_version: None,
                    icon_path: None,
                    created_at: now,
                    last_played: None,
                    game_settings: None,
                };
                let _ = self.save_meta(name, &new_meta);
                (
                    new_meta.id,
                    new_meta.loader_type,
                    new_meta.loader_version,
                    new_meta.icon_path,
                    new_meta.created_at,
                    new_meta.last_played,
                    new_meta.game_settings,
                )
            };

        Some(GameInstance {
            id,
            name: name.to_string(),
            version_id: version,
            loader_type,
            loader_version,
            path: instance_dir.to_string_lossy().to_string(),
            icon_path,
            last_played,
            created_at,
            enabled: !versions.is_empty(),
            game_settings,
        })
    }

    /// 扫描旧版实例目录中的版本
    fn scan_legacy_versions(&self, name: &str, instances: &mut Vec<GameInstance>) {
        let minecraft_dir = self.get_legacy_minecraft_dir();
        let instance_dir = minecraft_dir.join(name);
        log_info!("扫描实例目录：{:?}", instance_dir);
        
        if !instance_dir.exists() || !instance_dir.is_dir() {
            return;
        }

        let mut version_jar = None;
        if let Ok(entries) = fs::read_dir(&instance_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "jar" {
                            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                                version_jar = Some((stem.to_string(), path));
                                break;
                            }
                        }
                    }
                }
            }
        }

        if let Some((version_name, jar_path)) = version_jar {
            log_info!("检查版本：{} - jar 存在：{}", version_name, jar_path.exists());
            
            let now = jar_path
                .metadata()
                .ok()
                .and_then(|m| m.created().ok())
                .map(|t| {
                    t.duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0)
                })
                .unwrap_or(0);

            let meta_path = instance_dir.join(config::INSTANCE_META_FILE_NAME);
            let (id, loader_type, loader_version, icon_path, last_played) =
                if meta_path.exists() {
                    if let Some(meta) = self.load_meta_from_path(&meta_path) {
                        (
                            meta.id,
                            meta.loader_type,
                            meta.loader_version,
                            meta.icon_path,
                            meta.last_played,
                        )
                    } else {
                        let new_meta = InstanceMeta {
                            id: Uuid::new_v4().to_string(),
                            name: name.to_string(),
                            version_id: version_name.clone(),
                            loader_type: ModLoaderType::Vanilla,
                            loader_version: None,
                            icon_path: None,
                            created_at: now,
                            last_played: None,
                            game_settings: None,
                        };
                        let _ = self.save_meta_to_path(&new_meta, &meta_path);
                        (
                            new_meta.id,
                            new_meta.loader_type,
                            new_meta.loader_version,
                            new_meta.icon_path,
                            new_meta.last_played,
                        )
                    }
                } else {
                    let new_meta = InstanceMeta {
                        id: Uuid::new_v4().to_string(),
                        name: name.to_string(),
                        version_id: version_name.clone(),
                        loader_type: ModLoaderType::Vanilla,
                        loader_version: None,
                        icon_path: None,
                        created_at: now,
                        last_played: None,
                        game_settings: None,
                    };
                    if let Some(parent) = meta_path.parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    let _ = self.save_meta_to_path(&new_meta, &meta_path);
                    (
                        new_meta.id,
                        new_meta.loader_type,
                        new_meta.loader_version,
                        new_meta.icon_path,
                        new_meta.last_played,
                    )
                };

            instances.push(GameInstance {
                id,
                name: name.to_string(),
                version_id: version_name.to_string(),
                loader_type,
                loader_version,
                path: instance_dir.to_string_lossy().to_string(),
                icon_path,
                last_played,
                created_at: now,
                enabled: true,
                game_settings: None,
            });
            log_info!("实例 {} 扫描到 1 个版本", name);
        } else {
            log_info!("实例 {} 扫描到 0 个版本", name);
        }
    }

    /// 扫描所有实例（新版版本目录 + 旧版兼容）
    pub fn scan_instances(&self) -> Vec<GameInstance> {
        let mut instances = Vec::new();

        // 1. 扫描版本目录（优先）
        let version_instances = self.scan_versions();
        log_info!("扫描到 {} 个版本实例", version_instances.len());
        instances.extend(version_instances);

        // 2. 扫描旧版实例目录（兼容）
        let daemon_dir = self.get_legacy_minecraft_dir();
        log_info!("开始扫描旧版实例目录：{:?}", daemon_dir);

        if daemon_dir.exists() {
            if let Ok(entries) = fs::read_dir(&daemon_dir) {
                let mut count = 0;
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            log_info!("发现旧版实例目录：{} -> {:?}", name, path);
                            self.scan_legacy_versions(name, &mut instances);
                            count += 1;
                        }
                    }
                }
                log_info!("扫描到 {} 个旧版实例目录", count);
            } else {
                log_error!("读取旧版实例目录失败：{:?}", daemon_dir);
            }
        }

        // 去重：优先保留版本目录中的实例
        let mut seen_ids = std::collections::HashSet::new();
        instances.retain(|instance| seen_ids.insert(instance.id.clone()));

        instances.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        log_info!("最终实例数：{}", instances.len());
        instances
    }

    /// 获取指定 ID 的实例
    pub fn get_instance(&self, id: &str) -> Option<GameInstance> {
        self.scan_instances().into_iter().find(|i| i.id == id)
    }

    /// 创建新实例（创建目录结构）
    pub fn create_instance(&self, name: &str, version: &str) -> Result<GameInstance, String> {
        let instance_dir = self.get_legacy_minecraft_dir().join(name);
        let versions_dir = self.get_versions_dir(name);
        let game_version_dir = versions_dir.join(version);

        if instance_dir.exists() {
            return Err(format!("实例 {} 已存在", name));
        }
        if game_version_dir.exists() {
            return Err(format!("版本 {} 已存在", version));
        }

        fs::create_dir_all(&instance_dir).map_err(|e| format!("创建实例目录失败：{}", e))?;
        fs::create_dir_all(&game_version_dir).map_err(|e| format!("创建版本文件失败：{}", e))?;

        fs::create_dir_all(game_version_dir.join("libraries")).ok();
        fs::create_dir_all(game_version_dir.join("assets")).ok();
        fs::create_dir_all(game_version_dir.join("natives")).ok();

        let instance = self
            .load_instance(name)
            .ok_or_else(|| "创建实例后加载失败".to_string())?;

        Ok(instance)
    }

    /// 删除指定 ID 的实例（删除目录）
    pub fn delete_instance(&self, id: &str) -> Result<(), String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let instance_dir = self.get_legacy_minecraft_dir().join(&instance.name);
        if instance_dir.exists() {
            fs::remove_dir_all(&instance_dir).map_err(|e| format!("删除实例失败: {}", e))?;
        }

        Ok(())
    }

    /// 复制实例到新名称
    pub fn copy_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let source_dir = self.get_legacy_minecraft_dir().join(&instance.name);
        let dest_dir = self.get_legacy_minecraft_dir().join(new_name);

        if dest_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        if source_dir.exists() {
            copy_dir_all(&source_dir, &dest_dir).map_err(|e| format!("复制实例失败: {}", e))?;
        }

        self.load_instance(new_name)
            .ok_or_else(|| "复制实例后加载失败".to_string())
    }

    /// 重命名实例
    pub fn rename_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let old_dir = self.get_legacy_minecraft_dir().join(&instance.name);
        let new_dir = self.get_legacy_minecraft_dir().join(new_name);

        if new_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        let mut all = self.read_all_metas();
        if let Some(mut meta) = all.remove(&instance.name) {
            meta.name = new_name.to_string();
            all.insert(new_name.to_string(), meta);
        }
        let _ = self.write_all_metas(&all);

        fs::rename(&old_dir, &new_dir).map_err(|e| format!("重命名失败: {}", e))?;

        self.load_instance(new_name)
            .ok_or_else(|| "重命名实例后加载失败".to_string())
    }

    /// 更新实例信息
    pub fn update_instance(
        &self,
        id: &str,
        name: Option<String>,
        enabled: Option<bool>,
    ) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        if let Some(n) = name {
            if n != instance.name {
                return self.rename_instance(id, &n);
            }
        }

        let _ = enabled;
        Ok(instance)
    }

    /// 获取实例目录路径
    pub fn get_instances_path(&self) -> String {
        self.get_legacy_minecraft_dir().to_string_lossy().to_string()
    }

    /// 扫描指定文件夹中的实例
    pub fn scan_instances_in_folder(&self, folder_path: &PathBuf) -> Vec<GameInstance> {
        let mut instances = Vec::new();
        if !folder_path.exists() || !folder_path.is_dir() {
            return instances;
        }

        if let Ok(entries) = fs::read_dir(folder_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        let has_game_files = {
                            let libraries_dir = path.join("libraries");
                            let assets_dir = path.join("assets");
                            let has_jar = fs::read_dir(&path)
                                .map(|entries| {
                                    entries.filter_map(|e| e.ok()).any(|e| {
                                        e.path().extension().map(|ext| ext == "jar").unwrap_or(false)
                                    })
                                })
                                .unwrap_or(false);

                            libraries_dir.is_dir() || assets_dir.is_dir() || has_jar
                        };

                        if has_game_files {
                            if let Some(mut instance) =
                                self.load_instance_from_path(name, &path)
                            {
                                instance.path = path.to_string_lossy().to_string();
                                instances.push(instance);
                            }
                        }
                    }
                }
            }
        }

        instances.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        instances
    }

    /// 从指定路径加载实例
    fn load_instance_from_path(&self, name: &str, instance_dir: &PathBuf) -> Option<GameInstance> {
        let mut version = None;

        if let Ok(entries) = fs::read_dir(instance_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "jar" {
                            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                                version = Some(stem.to_string());
                                break;
                            }
                        }
                    }
                }
            }
        }

        let version = version.unwrap_or_else(|| "unknown".to_string());

        let meta_path = self.get_meta_path();
        let (id, loader_type, loader_version, icon_path, created_at, last_played) =
            if meta_path.exists() {
                if let Some(meta) = self.load_meta_from_path(&meta_path) {
                    (
                        meta.id,
                        meta.loader_type,
                        meta.loader_version,
                        meta.icon_path,
                        meta.created_at,
                        meta.last_played,
                    )
                } else {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0);
                    let new_meta = InstanceMeta {
                        id: Uuid::new_v4().to_string(),
                        name: name.to_string(),
                        version_id: version.clone(),
                        loader_type: ModLoaderType::Vanilla,
                        loader_version: None,
                        icon_path: None,
                        created_at: now,
                        last_played: None,
                        game_settings: None,
                    };
                    let _ = self.save_meta_to_path(&new_meta, &meta_path);
                    (
                        new_meta.id,
                        new_meta.loader_type,
                        new_meta.loader_version,
                        new_meta.icon_path,
                        new_meta.created_at,
                        new_meta.last_played,
                    )
                }
            } else {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);
                let new_meta = InstanceMeta {
                    id: Uuid::new_v4().to_string(),
                    name: name.to_string(),
                    version_id: version.clone(),
                    loader_type: ModLoaderType::Vanilla,
                    loader_version: None,
                    icon_path: None,
                    created_at: now,
                    last_played: None,
                    game_settings: None,
                };
                if let Some(parent) = meta_path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                let _ = self.save_meta_to_path(&new_meta, &meta_path);
                (
                    new_meta.id,
                    new_meta.loader_type,
                    new_meta.loader_version,
                    new_meta.icon_path,
                    new_meta.created_at,
                    new_meta.last_played,
                )
            };

        Some(GameInstance {
            id,
            name: name.to_string(),
            version_id: version,
            loader_type,
            loader_version,
            path: instance_dir.to_string_lossy().to_string(),
            icon_path,
            last_played,
            created_at,
            enabled: true,
            game_settings: None,
        })
    }

    /// 从指定路径加载元数据
    fn load_meta_from_path(&self, meta_path: &PathBuf) -> Option<InstanceMeta> {
        if let Ok(content) = fs::read_to_string(meta_path) {
            if let Ok(meta) = serde_json::from_str::<InstanceMeta>(&content) {
                return Some(meta);
            }
        }
        None
    }

    /// 保存元数据到指定路径
    fn save_meta_to_path(&self, meta: &InstanceMeta, meta_path: &PathBuf) -> Result<(), String> {
        if let Some(parent) = meta_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建元数据目录失败: {}", e))?;
        }
        let content =
            serde_json::to_string_pretty(meta).map_err(|e| format!("序列化元数据失败: {}", e))?;
        fs::write(meta_path, content).map_err(|e| format!("写入元数据失败: {}", e))?;
        Ok(())
    }

    /// 从 ConfigManager 加载已知路径列表
    fn load_known_paths(&self) -> Vec<KnownPath> {
        let app_handle = match APP_HANDLE.get() {
            Some(h) => h,
            None => {
                log_error!("APP_HANDLE 未初始化");
                return Vec::new();
            }
        };
        
        let config_manager = app_handle.state::<crate::config::ConfigManager>();
        
        match config_manager.get_config() {
            Ok(config) => {
                let mut result = Vec::new();
                for value in &config.known_folders {
                    if let Ok(kp) = serde_json::from_value::<KnownPath>(value.clone()) {
                        result.push(kp);
                    }
                }
                result
            }
            Err(e) => {
                log_error!("加载配置失败: {}", e);
                Vec::new()
            }
        }
    }

    /// 保存已知路径列表到 ConfigManager
    fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
        let app_handle = APP_HANDLE.get()
            .ok_or_else(|| "APP_HANDLE 未初始化".to_string())?;
        
        let config_manager = app_handle.state::<crate::config::ConfigManager>();
        
        let paths_value = serde_json::to_value(paths)
            .map_err(|e| format!("序列化 known_paths 失败：{}", e))?;
        
        config_manager.update_value("known_folders", paths_value)?;
        
        log_info!("已知路径已保存：{} 个文件夹", paths.len());
        Ok(())
    }

    /// 扫描已知的 Minecraft 路径（默认、官方、用户自定义）
    pub fn scan_known_paths(&self) -> Vec<KnownPath> {
        let mut paths = Vec::new();

        let daemon_path = self.get_legacy_minecraft_dir();
        if daemon_path.exists() {
            paths.push(KnownPath {
                id: "default".to_string(),
                name: "默认文件夹".to_string(),
                path: daemon_path.to_string_lossy().to_string(),
                is_default: true,
            });
        }

        if let Some(data_dir) = dirs_next::data_local_dir() {
            let official_path = data_dir.join(".minecraft");
            if official_path.exists() {
                paths.push(KnownPath {
                    id: "official".to_string(),
                    name: "官方启动器文件夹".to_string(),
                    path: official_path.to_string_lossy().to_string(),
                    is_default: false,
                });
            }
        }

        if let Some(home) = dirs_next::home_dir() {
            let home_mc = home.join(".minecraft");
            if home_mc.exists() && !paths.iter().any(|p| p.path == home_mc.to_string_lossy()) {
                paths.push(KnownPath {
                    id: "home-mc".to_string(),
                    name: "主目录 .minecraft".to_string(),
                    path: home_mc.to_string_lossy().to_string(),
                    is_default: false,
                });
            }
        }

        let custom_paths = self.load_known_paths();
        for cp in custom_paths {
            if !paths.iter().any(|p| p.path == cp.path) {
                paths.push(cp);
            }
        }

        paths
    }

    /// 添加已知路径
    pub fn add_known_path(&self, path: &str) -> Result<KnownPath, String> {
        let p = PathBuf::from(path);
        if !p.exists() {
            return Err(format!("路径不存在: {}", path));
        }
        if !p.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let normalized_path = p.to_string_lossy().to_lowercase();
        let mut existing = self.load_known_paths();
        
        if existing.iter().any(|kp| kp.path.to_lowercase() == normalized_path) {
            return Err("该路径已存在".to_string());
        }

        let name = p
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("自定义文件夹")
            .to_string();

        let new_path = KnownPath {
            id: format!(
                "custom-{}",
                uuid::Uuid::new_v4()
                    .to_string()
                    .chars()
                    .take(8)
                    .collect::<String>()
            ),
            name,
            path: p.to_string_lossy().to_string(),
            is_default: false,
        };

        existing.push(new_path.clone());
        self.save_known_paths(&existing)?;

        Ok(new_path)
    }

    /// 添加已知路径（指定显示名称）
    pub async fn add_known_path_with_name(&self, path: &str, display_name: &str) -> Result<KnownPath, String> {
        let p = PathBuf::from(path);
        if !p.exists() {
            return Err(format!("路径不存在: {}", path));
        }
        if !p.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let normalized_path = p.to_string_lossy().to_lowercase();
        let mut existing = self.load_known_paths();
        
        if existing.iter().any(|kp| kp.path.to_lowercase() == normalized_path) {
            return Err("该路径已存在".to_string());
        }

        let new_path = KnownPath {
            id: format!(
                "custom-{}",
                uuid::Uuid::new_v4()
                    .to_string()
                    .chars()
                    .take(8)
                    .collect::<String>()
            ),
            name: display_name.to_string(),
            path: p.to_string_lossy().to_string(),
            is_default: false,
        };

        existing.push(new_path.clone());
        self.save_known_paths(&existing)?;

        log_info!("已知路径已添加（自定义名称）: {} -> {:?}", display_name, path);
        Ok(new_path)
    }

    /// 设置默认文件夹
    pub fn set_default_folder(&self, id: &str) -> Result<(), String> {
        let mut existing = self.load_known_paths();
        let mut found = false;
        
        for folder in &mut existing {
            if folder.id == id {
                folder.is_default = true;
                found = true;
            } else {
                folder.is_default = false;
            }
        }

        if !found {
            return Err("文件夹不存在".to_string());
        }

        self.save_known_paths(&existing)?;
        Ok(())
    }

    /// 从已知路径中移除指定文件夹
    pub fn remove_known_path(&self, id: &str) -> Result<(), String> {
        let mut existing = self.load_known_paths();
        let original_len = existing.len();
        
        existing.retain(|p| p.id != id);

        if existing.len() == original_len {
            return Err("文件夹不存在".to_string());
        }

        self.save_known_paths(&existing)?;
        Ok(())
    }

    // ==================== 目录结构迁移方法 ====================

    /// 迁移旧版实例到新目录结构
    pub fn migrate_directory_structure(&self) -> Result<MigrationResult, String> {
        use crate::config::{MINECRAFT_DIR, VERSIONS_DIR, LIBRARIES_DIR, ASSETS_DIR, INSTANCE_CONFIGS_DIR};
        
        log_info!("==================== 开始迁移到新目录结构 ====================");

        let mut result = MigrationResult {
            migrated_versions: Vec::new(),
            migrated_libraries: 0,
            migrated_assets: 0,
            errors: Vec::new(),
        };

        // 1. 创建目标目录
        fs::create_dir_all(&*MINECRAFT_DIR)
            .map_err(|e| format!("创建 Minecraft 目录失败：{}", e))?;
        fs::create_dir_all(&*VERSIONS_DIR)
            .map_err(|e| format!("创建 versions 目录失败：{}", e))?;
        fs::create_dir_all(&*LIBRARIES_DIR)
            .map_err(|e| format!("创建 libraries 目录失败：{}", e))?;
        fs::create_dir_all(&*ASSETS_DIR)
            .map_err(|e| format!("创建 assets 目录失败：{}", e))?;
        fs::create_dir_all(&*INSTANCE_CONFIGS_DIR)
            .map_err(|e| format!("创建实例配置目录失败：{}", e))?;

        // 2. 扫描旧版实例目录
        let old_instances = self.scan_instances();
        log_info!("发现 {} 个旧版实例", old_instances.len());

        for instance in old_instances {
            let instance_dir = PathBuf::from(&instance.path);
            
            // 跳过已经在新目录中的实例
            if instance_dir.starts_with(&*MINECRAFT_DIR) {
                log_info!("实例 {} 已在新目录中，跳过", instance.name);
                continue;
            }

            log_info!("迁移实例：{} ({})", instance.name, instance.version_id);

            // 3. 迁移版本文件
            let version_dir = VERSIONS_DIR.join(&instance.version_id);
            if !version_dir.exists() {
                if let Err(e) = self.migrate_version_files(&instance_dir, &version_dir, &instance.version_id) {
                    result.errors.push(format!("迁移版本 {} 失败：{}", instance.version_id, e));
                    continue;
                }
                result.migrated_versions.push(instance.version_id.clone());
            }

            // 4. 迁移库文件到全局目录
            if let Err(e) = self.migrate_libraries(&instance_dir) {
                result.errors.push(format!("迁移库文件失败：{}", e));
            } else {
                result.migrated_libraries += 1;
            }

            // 5. 迁移资源文件到全局目录
            if let Err(e) = self.migrate_assets(&instance_dir) {
                result.errors.push(format!("迁移资源文件失败：{}", e));
            } else {
                result.migrated_assets += 1;
            }

            // 6. 保存实例配置
            let instance_config = crate::config::InstanceConfig {
                id: instance.id.clone(),
                name: instance.name.clone(),
                version: instance.version_id.clone(),
                loader_type: instance.loader_type.clone(),
                loader_version: instance.loader_version.clone(),
                java: crate::config::JavaConfig::default(),
                memory: crate::config::MemoryConfig::default(),
                graphics: crate::config::GraphicsConfig::default(),
                custom_args: Vec::new(),
                icon_path: instance.icon_path.clone(),
                last_played: instance.last_played,
                created_at: instance.created_at,
                enabled: instance.enabled,
            };

            if let Err(e) = self.save_instance_config(&instance_config) {
                result.errors.push(format!("保存实例配置失败：{}", e));
            }
        }

        log_info!("==================== 迁移完成 ====================");
        log_info!("迁移版本数：{}", result.migrated_versions.len());
        log_info!("迁移库文件：{}", result.migrated_libraries);
        log_info!("迁移资源文件：{}", result.migrated_assets);
        if !result.errors.is_empty() {
            log_info!("错误数：{}", result.errors.len());
            for err in &result.errors {
                log_info!("  - {}", err);
            }
        }

        Ok(result)
    }

    /// 迁移版本文件（jar、json、natives）
    fn migrate_version_files(&self, source_dir: &PathBuf, target_dir: &PathBuf, version_id: &str) -> Result<(), String> {
        fs::create_dir_all(target_dir)
            .map_err(|e| format!("创建版本目录失败：{}", e))?;

        // 复制版本 JAR
        let jar_source = source_dir.join(format!("{}.jar", version_id));
        let jar_target = target_dir.join(format!("{}.jar", version_id));
        if jar_source.exists() && !jar_target.exists() {
            fs::copy(&jar_source, &jar_target)
                .map_err(|e| format!("复制版本 JAR 失败：{}", e))?;
            log_info!("  复制版本 JAR：{}", version_id);
        }

        // 复制版本 JSON
        let json_source = source_dir.join(format!("{}.json", version_id));
        let json_target = target_dir.join(format!("{}.json", version_id));
        if json_source.exists() && !json_target.exists() {
            fs::copy(&json_source, &json_target)
                .map_err(|e| format!("复制版本 JSON 失败：{}", e))?;
            log_info!("  复制版本 JSON：{}", version_id);
        }

        // 复制 natives 目录
        let natives_source = source_dir.join("natives");
        let natives_target = target_dir.join("natives");
        if natives_source.exists() && !natives_target.exists() {
            copy_dir_all(&natives_source, &natives_target)
                .map_err(|e| format!("复制 natives 目录失败：{}", e))?;
            log_info!("  复制 natives 目录");
        }

        Ok(())
    }

    /// 迁移库文件到全局目录
    fn migrate_libraries(&self, instance_dir: &PathBuf) -> Result<(), String> {
        use crate::config::LIBRARIES_DIR;
        
        let libraries_source = instance_dir.join("libraries");
        if !libraries_source.exists() {
            return Ok(());
        }

        let libraries_target = &*LIBRARIES_DIR;
        fs::create_dir_all(libraries_target)
            .map_err(|e| format!("创建库目录失败：{}", e))?;

        // 复制库文件（跳过已存在的）
        self.copy_dir_skip_existing(&libraries_source, libraries_target)?;
        log_info!("  迁移库文件完成");

        Ok(())
    }

    /// 迁移资源文件到全局目录
    fn migrate_assets(&self, instance_dir: &PathBuf) -> Result<(), String> {
        use crate::config::ASSETS_DIR;
        
        let assets_source = instance_dir.join("assets");
        if !assets_source.exists() {
            return Ok(());
        }

        let assets_target = &*ASSETS_DIR;
        fs::create_dir_all(assets_target)
            .map_err(|e| format!("创建资源目录失败：{}", e))?;

        // 复制资源文件（跳过已存在的）
        self.copy_dir_skip_existing(&assets_source, assets_target)?;
        log_info!("  迁移资源文件完成");

        Ok(())
    }

    /// 递归复制目录，跳过已存在的文件
    fn copy_dir_skip_existing(&self, source: &PathBuf, target: &PathBuf) -> Result<(), String> {
        if !source.is_dir() {
            return Ok(());
        }

        fs::create_dir_all(target)
            .map_err(|e| format!("创建目录失败：{}", e))?;

        if let Ok(entries) = fs::read_dir(source) {
            for entry in entries.flatten() {
                let src_path = entry.path();
                let dst_path = target.join(entry.file_name());

                if src_path.is_dir() {
                    self.copy_dir_skip_existing(&src_path, &dst_path)?;
                } else {
                    // 只复制不存在的文件
                    if !dst_path.exists() {
                        fs::copy(&src_path, &dst_path)
                            .map_err(|e| format!("复制文件失败：{}", e))?;
                    }
                }
            }
        }

        Ok(())
    }
}
