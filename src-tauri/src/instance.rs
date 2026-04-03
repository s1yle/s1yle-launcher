use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

const DAEMON_DIR: &str = "daemon";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInstance {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub path: String,
    pub icon_path: Option<String>,
    pub last_played: Option<i64>,
    pub created_at: i64,
    pub enabled: bool,
}

pub struct InstanceManager {
    base_path: PathBuf,
}

impl InstanceManager {
    pub fn new(base_path: PathBuf) -> Self {
        let daemon_path = base_path.join(DAEMON_DIR);
        fs::create_dir_all(&daemon_path).ok();
        Self { base_path }
    }

    fn get_daemon_dir(&self) -> PathBuf {
        self.base_path.join(DAEMON_DIR)
    }

    fn get_minecraft_dir(&self, name: &str) -> PathBuf {
        self.get_daemon_dir().join(name).join(".minecraft")
    }

    fn get_versions_dir(&self, name: &str) -> PathBuf {
        self.get_minecraft_dir(name).join("versions")
    }

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

    fn load_instance(&self, name: &str) -> Option<GameInstance> {
        let daemon_dir = self.get_daemon_dir();
        let instance_dir = daemon_dir.join(name);
        if !instance_dir.is_dir() {
            return None;
        }

        let minecraft_dir = self.get_minecraft_dir(name);
        if !minecraft_dir.is_dir() {
            return None;
        }

        let versions = self.discover_versions(name);
        let version = versions.first().cloned().unwrap_or_else(|| "unknown".to_string());

        let created_at = instance_dir
            .metadata()
            .ok()
            .and_then(|m| m.created().ok())
            .map(|t| {
                t.duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0)
            })
            .unwrap_or(0);

        let id = Uuid::new_v4().to_string();

        Some(GameInstance {
            id,
            name: name.to_string(),
            version,
            loader_type: ModLoaderType::Vanilla,
            loader_version: None,
            path: minecraft_dir.to_string_lossy().to_string(),
            icon_path: None,
            last_played: None,
            created_at,
            enabled: !versions.is_empty(),
        })
    }

    pub fn scan_instances(&self) -> Vec<GameInstance> {
        let daemon_dir = self.get_daemon_dir();
        let mut instances = Vec::new();

        if let Ok(entries) = fs::read_dir(&daemon_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        if let Some(instance) = self.load_instance(name) {
                            instances.push(instance);
                        }
                    }
                }
            }
        }

        instances.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        instances
    }

    pub fn get_instance(&self, id: &str) -> Option<GameInstance> {
        self.scan_instances().into_iter().find(|i| i.id == id)
    }

    pub fn create_instance(&self, name: &str, version: &str) -> Result<GameInstance, String> {
        let minecraft_dir = self.get_minecraft_dir(name);
        let versions_dir = self.get_versions_dir(name);

        if minecraft_dir.exists() {
            return Err(format!("实例 {} 已存在", name));
        }

        fs::create_dir_all(&versions_dir)
            .map_err(|e| format!("创建实例目录失败: {}", e))?;

        fs::create_dir_all(minecraft_dir.join("libraries")).ok();
        fs::create_dir_all(minecraft_dir.join("assets")).ok();
        fs::create_dir_all(minecraft_dir.join("natives")).ok();

        let version_dir = versions_dir.join(version);
        fs::create_dir_all(&version_dir).ok();

        let instance = self
            .load_instance(name)
            .ok_or_else(|| "创建实例后加载失败".to_string())?;

        Ok(instance)
    }

    pub fn delete_instance(&self, id: &str) -> Result<(), String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let instance_dir = self.get_daemon_dir().join(&instance.name);
        if instance_dir.exists() {
            fs::remove_dir_all(&instance_dir)
                .map_err(|e| format!("删除实例失败: {}", e))?;
        }

        Ok(())
    }

    pub fn copy_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let source_dir = self.get_daemon_dir().join(&instance.name);
        let dest_dir = self.get_daemon_dir().join(new_name);

        if dest_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        if source_dir.exists() {
            copy_dir_all(&source_dir, &dest_dir)
                .map_err(|e| format!("复制实例失败: {}", e))?;
        }

        self.load_instance(new_name)
            .ok_or_else(|| "复制实例后加载失败".to_string())
    }

    pub fn rename_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let old_dir = self.get_daemon_dir().join(&instance.name);
        let new_dir = self.get_daemon_dir().join(new_name);

        if new_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        fs::rename(&old_dir, &new_dir)
            .map_err(|e| format!("重命名失败: {}", e))?;

        self.load_instance(new_name)
            .ok_or_else(|| "重命名实例后加载失败".to_string())
    }

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

    pub fn get_instances_path(&self) -> String {
        self.get_daemon_dir().to_string_lossy().to_string()
    }
}

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), std::io::Error> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dest_path = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dest_path)?;
        } else {
            fs::copy(entry.path(), dest_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn scan_instances(instance_manager: State<'_, InstanceManager>) -> Vec<GameInstance> {
    instance_manager.scan_instances()
}

#[tauri::command]
pub fn get_instance(
    id: String,
    instance_manager: State<'_, InstanceManager>,
) -> Option<GameInstance> {
    instance_manager.get_instance(&id)
}

#[tauri::command]
pub fn create_instance(
    name: String,
    version: String,
    _loader_type: ModLoaderType,
    _loader_version: Option<String>,
    _icon_path: Option<String>,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    instance_manager.create_instance(&name, &version)
}

#[tauri::command]
pub fn delete_instance(
    id: String,
    _delete_files: bool,
    instance_manager: State<'_, InstanceManager>,
) -> Result<(), String> {
    instance_manager.delete_instance(&id)
}

#[tauri::command]
pub fn copy_instance(
    id: String,
    new_name: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    instance_manager.copy_instance(&id, &new_name)
}

#[tauri::command]
pub fn rename_instance(
    id: String,
    new_name: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    instance_manager.rename_instance(&id, &new_name)
}

#[tauri::command]
pub fn update_instance(
    id: String,
    name: Option<String>,
    enabled: Option<bool>,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    instance_manager.update_instance(&id, name, enabled)
}

#[tauri::command]
pub fn get_instances_path(instance_manager: State<'_, InstanceManager>) -> String {
    instance_manager.get_instances_path()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnownPath {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_default: bool,
}

impl InstanceManager {
    pub fn scan_known_paths(&self) -> Vec<KnownPath> {
        let mut paths = Vec::new();

        // Default daemon directory
        let daemon_path = self.get_daemon_dir();
        if daemon_path.exists() {
            paths.push(KnownPath {
                id: "daemon".to_string(),
                name: "当前文件夹".to_string(),
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

        paths
    }

    pub fn add_known_path(&self, path: &str) -> Result<KnownPath, String> {
        let p = PathBuf::from(path);
        if !p.exists() {
            return Err(format!("路径不存在: {}", path));
        }
        if !p.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let name = p.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("自定义文件夹")
            .to_string();

        Ok(KnownPath {
            id: format!("custom-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()),
            name,
            path: p.to_string_lossy().to_string(),
            is_default: false,
        })
    }
}

#[tauri::command]
pub fn scan_known_mc_paths(
    instance_manager: State<'_, InstanceManager>,
) -> Vec<KnownPath> {
    instance_manager.scan_known_paths()
}

#[tauri::command]
pub fn add_known_path(
    path: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<KnownPath, String> {
    instance_manager.add_known_path(&path)
}
