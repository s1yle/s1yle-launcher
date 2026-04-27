use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use super::models::{GameInstance, InstanceMeta, KnownPath};
use super::utils::copy_dir_all;
use crate::config;
use crate::modloader::ModLoaderType;

#[derive(Debug)]
pub struct InstanceManager {
    base_path: PathBuf,
}

impl InstanceManager {
    /// ## base_path的路径为 /minecraft
    pub fn new(base_path: PathBuf) -> Self {
        println!("InstanceManager base_path: {:?}", &base_path);
        fs::create_dir_all(&base_path).ok();
        Self { base_path }
    }

    // 获取mc路径
    fn get_minecraft_dir(&self) -> PathBuf {
        self.base_path.clone()
    }

    // 获取版本路径
    // /minecraft/{daemon_name}/versions/
    fn get_versions_dir(&self, name: &str) -> PathBuf {
        self.get_minecraft_dir().join(name).join("versions")
    }

    // 获取 InstanceMeta 的 path
    fn get_meta_path(&self) -> PathBuf {
        (*config::INSTANCE_META_PATH).clone()
    }

    // 从文件读取全部 InstanceMeta（HashMap<daemon_name, InstanceMeta>）
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

    // 将所有 InstanceMeta 写入文件
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

    // 加载指定 daemon 的 InstanceMeta
    pub fn load_meta(&self, name: &str) -> Option<InstanceMeta> {
        self.read_all_metas().remove(name)
    }

    // 保存指定 daemon 的 InstanceMeta（插入或更新）
    pub fn save_meta(&self, name: &str, meta: &InstanceMeta) -> Result<(), String> {
        let mut all = self.read_all_metas();
        all.insert(name.to_string(), meta.clone());
        self.write_all_metas(&all)
    }

    // 发掘 versions 字符串
    fn discover_versions(&self, name: &str) -> Vec<String> {
        let versions_dir = self.get_versions_dir(name);
        let mut versions = Vec::new();
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                // /minecraft/{daemon_name}/versions/{version_name}/
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

    // 加载 GameInstance
    fn load_instance(&self, name: &str) -> Option<GameInstance> {
        // /minecraft/
        let minecraft_dir = self.get_minecraft_dir();
        if !minecraft_dir.is_dir() {
            return None;
        }

        // /minecraft/{daemon_name}/
        let instance_dir = minecraft_dir.join(name);
        if !instance_dir.is_dir() {
            return None;
        }

        let versions = self.discover_versions(name);
        let version = versions
            .first()
            .cloned()
            .unwrap_or_else(|| "unknown".to_string());

        let (id, loader_type, loader_version, icon_path, created_at, last_played) =
            if let Some(meta) = self.load_meta(name) {
                (
                    meta.id,
                    meta.loader_type,
                    meta.loader_version,
                    meta.icon_path,
                    meta.created_at,
                    meta.last_played,
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
                    version: version.clone(),
                    loader_type: ModLoaderType::Vanilla,
                    loader_version: None,
                    icon_path: None,
                    created_at: now,
                    last_played: None,
                };
                let _ = self.save_meta(name, &new_meta);
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
            version,
            loader_type,
            loader_version,
            path: minecraft_dir.to_string_lossy().to_string(),
            icon_path,
            last_played,
            created_at,
            enabled: !versions.is_empty(),
        })
    }

    fn scan_versions(&self, name: &str, instances: &mut Vec<GameInstance>) {
        // /minecraft/{name}/versions
        let versions_dir = self.get_versions_dir(name);
        if versions_dir.exists() && versions_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(&versions_dir) {
                for entry in entries.flatten() {
                    // /minecraft/{name}/versions/
                    let path = entry.path();
                    if path.is_dir() {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            let version_jar = path.join(format!("{}.jar", name));
                            if version_jar.exists() {
                                let now = path
                                    .metadata()
                                    .ok()
                                    .and_then(|m| m.created().ok())
                                    .map(|t| {
                                        t.duration_since(std::time::UNIX_EPOCH)
                                            .map(|d| d.as_secs() as i64)
                                            .unwrap_or(0)
                                    })
                                    .unwrap_or(0);

                                let meta_path = path.join(config::INSTANCE_META_FILE_NAME);
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
                                                version: name.to_string(),
                                                loader_type: ModLoaderType::Vanilla,
                                                loader_version: None,
                                                icon_path: None,
                                                created_at: now,
                                                last_played: None,
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
                                            version: name.to_string(),
                                            loader_type: ModLoaderType::Vanilla,
                                            loader_version: None,
                                            icon_path: None,
                                            created_at: now,
                                            last_played: None,
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
                                    version: name.to_string(),
                                    loader_type,
                                    loader_version,
                                    path: versions_dir.to_string_lossy().to_string(),
                                    icon_path,
                                    last_played,
                                    created_at: now,
                                    enabled: true,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // 扫描 GameInstance（仅扫描版本级实例，去除了 daemon 级重复）
    pub fn scan_instances(&self) -> Vec<GameInstance> {
        // /minecraft/
        let daemon_dir = self.get_minecraft_dir();
        let mut instances = Vec::new();

        if let Ok(entries) = fs::read_dir(&daemon_dir) {
            for entry in entries.flatten() {
                // /minecraft/{daemon_name}/
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        self.scan_versions(name, &mut instances);
                    }
                }
            }
        }

        instances.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        instances
    }

    // 通过 id 获取 GameInstance
    pub fn get_instance(&self, id: &str) -> Option<GameInstance> {
        self.scan_instances().into_iter().find(|i| i.id == id)
    }

    // 创建 GameInstance
    pub fn create_instance(&self, name: &str, version: &str) -> Result<GameInstance, String> {
        let daemon_dir = self.get_minecraft_dir().join(name);
        let versions_dir = self.get_versions_dir(name);
        let game_version_dir = versions_dir.join(version);

        if daemon_dir.exists() {
            return Err(format!("实例 {} 已存在", name));
        }

        if game_version_dir.exists() {
            return Err(format!("版本 {} 已存在", version));
        }

        // 根据版本名称创建 例：minecraft/default/versions/{version}
        //                    minecraft/default/versions/1.21.11
        //                    minecraft/default/versions/亡者世界
        fs::create_dir_all(&daemon_dir).map_err(|e| format!("创建实例目录失败: {}", e))?;
        fs::create_dir_all(&game_version_dir).map_err(|e| format!("创建版本文件失败: {}", e))?;

        fs::create_dir_all(game_version_dir.join("libraries")).ok();
        fs::create_dir_all(game_version_dir.join("assets")).ok();
        fs::create_dir_all(game_version_dir.join("natives")).ok();

        let instance = self
            .load_instance(name)
            .ok_or_else(|| "创建实例后加载失败".to_string())?;

        Ok(instance)
    }

    // 删除 GameInstance
    pub fn delete_instance(&self, id: &str) -> Result<(), String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let instance_dir = self.get_minecraft_dir().join(&instance.name);
        if instance_dir.exists() {
            fs::remove_dir_all(&instance_dir).map_err(|e| format!("删除实例失败: {}", e))?;
        }

        Ok(())
    }

    // 复制 GameInstnace
    pub fn copy_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let source_dir = self.get_minecraft_dir().join(&instance.name);
        let dest_dir = self.get_minecraft_dir().join(new_name);

        if dest_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        if source_dir.exists() {
            copy_dir_all(&source_dir, &dest_dir).map_err(|e| format!("复制实例失败: {}", e))?;
        }

        self.load_instance(new_name)
            .ok_or_else(|| "复制实例后加载失败".to_string())
    }

    // 重命名 GameInstance
    pub fn rename_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let old_dir = self.get_minecraft_dir().join(&instance.name);
        let new_dir = self.get_minecraft_dir().join(new_name);

        if new_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        // 更新 meta: 删除旧 key，插入新 key
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

    // 指定 GameInstnace 的 id/name/enabled 属性
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

    // 获取到 instance 的 path
    pub fn get_instances_path(&self) -> String {
        self.get_minecraft_dir().to_string_lossy().to_string()
    }

    // ---------- 多路径扫描扩展 ----------
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
                        let minecraft_dir = path.join(".minecraft");
                        if minecraft_dir.is_dir() {
                            let versions_dir = minecraft_dir.join("versions");
                            let has_versions = versions_dir.is_dir()
                                && fs::read_dir(&versions_dir).map(|e| e.count()).unwrap_or(0) > 0;

                            if has_versions {
                                if let Some(mut instance) =
                                    self.load_instance_from_path(name, &minecraft_dir)
                                {
                                    instance.path = minecraft_dir.to_string_lossy().to_string();
                                    instances.push(instance);
                                }
                            }
                        }
                    }
                }
            }
        }

        instances.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        instances
    }

    // 通过 path 加载 instance
    fn load_instance_from_path(&self, name: &str, minecraft_dir: &PathBuf) -> Option<GameInstance> {
        let versions_dir = minecraft_dir.join("versions");
        let mut versions = Vec::new();

        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    if let Some(fname) = entry.file_name().to_str() {
                        versions.push(fname.to_string());
                    }
                }
            }
        }
        versions.sort();

        if versions.is_empty() {
            return None;
        }

        let version = versions
            .first()
            .cloned()
            .unwrap_or_else(|| "unknown".to_string());

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
                        version: version.clone(),
                        loader_type: ModLoaderType::Vanilla,
                        loader_version: None,
                        icon_path: None,
                        created_at: now,
                        last_played: None,
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
                    version: version.clone(),
                    loader_type: ModLoaderType::Vanilla,
                    loader_version: None,
                    icon_path: None,
                    created_at: now,
                    last_played: None,
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
            version,
            loader_type,
            loader_version,
            path: minecraft_dir.to_string_lossy().to_string(),
            icon_path,
            last_played,
            created_at,
            enabled: true,
        })
    }

    // 通过 path 加载 InstanceMeta
    fn load_meta_from_path(&self, meta_path: &PathBuf) -> Option<InstanceMeta> {
        if let Ok(content) = fs::read_to_string(meta_path) {
            if let Ok(meta) = serde_json::from_str::<InstanceMeta>(&content) {
                return Some(meta);
            }
        }
        None
    }

    // 向 path 保存 InstanceMeta
    fn save_meta_to_path(&self, meta: &InstanceMeta, meta_path: &PathBuf) -> Result<(), String> {
        if let Some(parent) = meta_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建元数据目录失败: {}", e))?;
        }
        let content =
            serde_json::to_string_pretty(meta).map_err(|e| format!("序列化元数据失败: {}", e))?;
        fs::write(meta_path, content).map_err(|e| format!("写入元数据失败: {}", e))?;
        Ok(())
    }

    // ---------- 已知路径管理 ----------
    // 从文件加载自定义路径
    fn load_known_paths(&self) -> Vec<KnownPath> {
        let path = &*config::KNOWN_PATHS_FILE;
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(paths) = serde_json::from_str::<Vec<KnownPath>>(&content) {
                    return paths;
                }
            }
        }
        Vec::new()
    }

    // 将自定义路径保存到文件
    fn save_known_paths(&self, paths: &[KnownPath]) -> Result<(), String> {
        let path = config::CONFIG_APPLICATION;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
        let content =
            serde_json::to_string_pretty(paths).map_err(|e| format!("序列化失败: {}", e))?;
        fs::write(path, content).map_err(|e| format!("写入失败: {}", e))?;
        Ok(())
    }

    // 扫描已知路径（系统扫描 + 持久化自定义路径）
    pub fn scan_known_paths(&self) -> Vec<KnownPath> {
        let mut paths = Vec::new();

        // Default daemon directory
        let daemon_path = self.get_minecraft_dir();
        if daemon_path.exists() {
            paths.push(KnownPath {
                id: "default".to_string(),
                name: "默认文件夹".to_string(),
                path: daemon_path.to_string_lossy().to_string(),
                is_default: true,
            });
        }

        // Official Minecraft launcher directory
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

        // Home directory .minecraft
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

        // 加载持久化的自定义路径
        let custom_paths = self.load_known_paths();
        for cp in custom_paths {
            if !paths.iter().any(|p| p.path == cp.path) {
                paths.push(cp);
            }
        }

        paths
    }

    // 通过 path 添加 Game Folder（添加后持久化）
    pub fn add_known_path(&self, path: &str) -> Result<KnownPath, String> {
        let p = PathBuf::from(path);
        if !p.exists() {
            return Err(format!("路径不存在: {}", path));
        }
        if !p.is_dir() {
            return Err("路径不是目录".to_string());
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

        // 持久化
        let mut existing = self.load_known_paths();
        existing.push(new_path.clone());
        self.save_known_paths(&existing)?;

        Ok(new_path)
    }
}
