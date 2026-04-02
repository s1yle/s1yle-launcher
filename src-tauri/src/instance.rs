use crate::log_info;
use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

const INSTANCES_DIR: &str = "instances";

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceConfig {
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub icon_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceManifest {
    pub version: String,
    pub instances: Vec<GameInstance>,
}

pub struct InstanceManager {
    base_path: PathBuf,
}

impl InstanceManager {
    pub fn new(base_path: PathBuf) -> Self {
        let instances_path = base_path.join(INSTANCES_DIR);
        fs::create_dir_all(&instances_path).ok();
        Self { base_path }
    }

    fn get_instances_dir(&self) -> PathBuf {
        self.base_path.join(INSTANCES_DIR)
    }

    fn load_instance(&self, path: &PathBuf) -> Option<GameInstance> {
        let config_path = path.join("instance.json");
        if !config_path.exists() {
            return None;
        }

        let content = fs::read_to_string(&config_path).ok()?;
        let manifest: InstanceManifest = serde_json::from_str(&content).ok()?;

        manifest.instances.into_iter().next()
    }

    pub fn scan_instances(&self) -> Vec<GameInstance> {
        let instances_dir = self.get_instances_dir();
        let mut instances = Vec::new();

        if let Ok(entries) = fs::read_dir(&instances_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(instance) = self.load_instance(&path) {
                        instances.push(instance);
                    }
                }
            }
        }

        log_info!("扫描到 {} 个实例", instances.len());
        instances.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        instances
    }

    pub fn get_instance(&self, id: &str) -> Option<GameInstance> {
        self.scan_instances().into_iter().find(|i| i.id == id)
    }

    pub fn create_instance(&self, config: InstanceConfig) -> Result<GameInstance, String> {
        let instances_dir = self.get_instances_dir();
        let instance_dir = instances_dir.join(&config.name);

        if instance_dir.exists() {
            return Err(format!("实例 {} 已存在", config.name));
        }

        fs::create_dir_all(&instance_dir).map_err(|e| format!("创建实例目录失败: {}", e))?;

        let id = Uuid::new_v4().to_string();
        let created_at = chrono::Utc::now().timestamp();

        let instance = GameInstance {
            id,
            name: config.name,
            version: config.version,
            loader_type: config.loader_type,
            loader_version: config.loader_version,
            path: instance_dir.to_string_lossy().to_string(),
            icon_path: config.icon_path,
            last_played: None,
            created_at,
            enabled: true,
        };

        self.save_instance(&instance)?;

        log_info!("创建实例成功: {}", instance.name);
        Ok(instance)
    }

    pub fn delete_instance(&self, id: &str, delete_files: bool) -> Result<(), String> {
        let instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        if delete_files {
            let path = PathBuf::from(&instance.path);
            if path.exists() {
                fs::remove_dir_all(&path).map_err(|e| format!("删除实例文件失败: {}", e))?;
            }
        }

        log_info!("删除实例: {}", instance.name);
        Ok(())
    }

    pub fn copy_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let source = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let instances_dir = self.get_instances_dir();
        let dest_dir = instances_dir.join(new_name);

        if dest_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        let source_path = PathBuf::from(&source.path);
        fs::create_dir_all(&dest_dir).map_err(|e| format!("创建目录失败: {}", e))?;

        if source_path.exists() {
            copy_dir_all(&source_path, &dest_dir).map_err(|e| format!("复制文件失败: {}", e))?;
        }

        let new_id = Uuid::new_v4().to_string();
        let created_at = chrono::Utc::now().timestamp();

        let new_instance = GameInstance {
            id: new_id,
            name: new_name.to_string(),
            version: source.version,
            loader_type: source.loader_type,
            loader_version: source.loader_version,
            path: dest_dir.to_string_lossy().to_string(),
            icon_path: source.icon_path,
            last_played: None,
            created_at,
            enabled: true,
        };

        self.save_instance(&new_instance)?;

        log_info!("复制实例: {} -> {}", source.name, new_name);
        Ok(new_instance)
    }

    pub fn rename_instance(&self, id: &str, new_name: &str) -> Result<GameInstance, String> {
        let mut instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        let old_path = PathBuf::from(&instance.path);
        let new_path = old_path.parent().ok_or("无效的实例路径")?.join(new_name);

        if new_path.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        fs::rename(&old_path, &new_path).map_err(|e| format!("重命名失败: {}", e))?;

        instance.name = new_name.to_string();
        instance.path = new_path.to_string_lossy().to_string();

        self.save_instance(&instance)?;

        log_info!("重命名实例: {}", new_name);
        Ok(instance)
    }

    pub fn update_instance(
        &self,
        id: &str,
        name: Option<String>,
        enabled: Option<bool>,
    ) -> Result<GameInstance, String> {
        let mut instance = self
            .get_instance(id)
            .ok_or_else(|| format!("实例不存在: {}", id))?;

        if let Some(n) = name {
            if n != instance.name {
                return self.rename_instance(id, &n);
            }
        }

        if let Some(e) = enabled {
            instance.enabled = e;
        }

        self.save_instance(&instance)?;
        Ok(instance)
    }

    fn save_instance(&self, instance: &GameInstance) -> Result<(), String> {
        let path = PathBuf::from(&instance.path);
        let config_path = path.join("instance.json");

        let manifest = InstanceManifest {
            version: "1.0".to_string(),
            instances: vec![instance.clone()],
        };

        let content =
            serde_json::to_string_pretty(&manifest).map_err(|e| format!("序列化失败: {}", e))?;

        fs::write(&config_path, content).map_err(|e| format!("写入配置失败: {}", e))?;

        Ok(())
    }

    pub fn get_instances_path(&self) -> String {
        self.get_instances_dir().to_string_lossy().to_string()
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
    loader_type: ModLoaderType,
    loader_version: Option<String>,
    icon_path: Option<String>,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    let config = InstanceConfig {
        name,
        version,
        loader_type,
        loader_version,
        icon_path,
    };
    instance_manager.create_instance(config)
}

#[tauri::command]
pub fn delete_instance(
    id: String,
    delete_files: bool,
    instance_manager: State<'_, InstanceManager>,
) -> Result<(), String> {
    instance_manager.delete_instance(&id, delete_files)
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
