use tauri::State;

use super::manager::InstanceManager;
use super::models::{GameInstance, KnownPath};
use crate::log_info;
use crate::modloader::ModLoaderType;

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
    let instance = instance_manager.create_instance(&name, &version)?;

    if let Some(meta) = instance_manager.load_meta(&name) {
        let mut new_meta = meta;
        new_meta.loader_type = loader_type;
        new_meta.loader_version = loader_version;
        new_meta.icon_path = icon_path;
        let _ = instance_manager.save_meta(&name, &new_meta);
    }

    instance_manager
        .get_instance(&instance.id)
        .ok_or_else(|| "获取实例失败".to_string())
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

#[tauri::command]
pub fn scan_known_mc_paths(instance_manager: State<'_, InstanceManager>) -> Vec<KnownPath> {
    instance_manager.scan_known_paths()
}

#[tauri::command]
pub fn add_known_path(
    path: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<KnownPath, String> {
    log_info!("<add_known_path> {:?}, {:?}", path, instance_manager);
    instance_manager.add_known_path(&path)
}
