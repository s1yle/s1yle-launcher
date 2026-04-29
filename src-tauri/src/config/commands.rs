use crate::config::{AppConfig, ConfigManager, InstanceConfig};
use std::path::PathBuf;
use tauri::State;

/// # 获取全局配置
#[tauri::command]
pub fn get_config(config_manager: State<'_, ConfigManager>) -> Result<AppConfig, String> {
    config_manager.get_config()
}

/// # 更新全局配置
#[tauri::command]
pub fn update_config(
    config_manager: State<'_, ConfigManager>,
    new_config: AppConfig,
) -> Result<(), String> {
    config_manager.update_config(new_config)
}

/// # 动态获取配置值
#[tauri::command]
pub fn get_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
) -> Result<Option<String>, String> {
    config_manager.get_value(&key)
}

/// # 动态写入配置值
#[tauri::command]
pub fn set_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    config_manager.write_config(&key, value)
}

/// # 获取实例配置
#[tauri::command]
pub fn get_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<Option<InstanceConfig>, String> {
    config_manager.get_instance_config(&instance_id)
}

/// # 更新实例配置
#[tauri::command]
pub fn update_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
    config: InstanceConfig,
) -> Result<(), String> {
    config_manager.update_instance_config(&instance_id, config)
}

/// # 删除实例配置
#[tauri::command]
pub fn remove_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<(), String> {
    config_manager.remove_instance_config(&instance_id)
}

/// # 重置配置到默认值
#[tauri::command]
pub fn reset_config(config_manager: State<'_, ConfigManager>) -> Result<(), String> {
    config_manager.reset_config()
}

/// # 导出配置
#[tauri::command]
pub fn export_config(
    config_manager: State<'_, ConfigManager>,
    target_path: String,
) -> Result<(), String> {
    config_manager.export_config(PathBuf::from(target_path))
}

/// # 导入配置
#[tauri::command]
pub fn import_config(
    config_manager: State<'_, ConfigManager>,
    source_path: String,
) -> Result<(), String> {
    config_manager.import_config(PathBuf::from(source_path))
}
