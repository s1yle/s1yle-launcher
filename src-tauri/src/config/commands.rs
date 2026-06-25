use crate::config::{AppConfig, ConfigManager, InstanceConfig, PathConfig};
use std::path::PathBuf;
use tauri::State;

/// 获取全局配置
#[tauri::command]
pub fn get_config(config_manager: State<'_, ConfigManager>) -> Result<AppConfig, String> {
    config_manager.get_config()
}

/// 更新全局配置（完整覆盖）
#[tauri::command]
pub fn update_config(
    config_manager: State<'_, ConfigManager>,
    new_config: AppConfig,
) -> Result<(), String> {
    config_manager.update_config(new_config)
}

/// 动态获取配置值（支持点号分隔的路径）
#[tauri::command]
pub fn get_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
) -> Result<Option<String>, String> {
    config_manager.get_value(&key)
}

/// 动态写入配置值（支持点号分隔的路径）
#[tauri::command]
pub fn set_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    config_manager.write_config(&key, value)
}

/// 获取指定实例的配置
#[tauri::command]
pub fn get_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<Option<InstanceConfig>, String> {
    config_manager.get_instance_config(&instance_id)
}

/// 更新指定实例的配置
#[tauri::command]
pub fn update_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
    config: InstanceConfig,
) -> Result<(), String> {
    config_manager.update_instance_config(&instance_id, config)
}

/// 删除指定实例的配置
#[tauri::command]
pub fn remove_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<(), String> {
    config_manager.remove_instance_config(&instance_id)
}

/// 重置配置到默认值
#[tauri::command]
pub fn reset_config(config_manager: State<'_, ConfigManager>) -> Result<(), String> {
    config_manager.reset_config()
}

/// 导出配置到指定文件路径
#[tauri::command]
pub fn export_config(
    config_manager: State<'_, ConfigManager>,
    target_path: String,
) -> Result<(), String> {
    config_manager.export_config(PathBuf::from(target_path))
}

/// 从指定文件路径导入配置
#[tauri::command]
pub fn import_config(
    config_manager: State<'_, ConfigManager>,
    source_path: String,
) -> Result<(), String> {
    config_manager.import_config(PathBuf::from(source_path))
}

// ==================== 路径配置命令 ====================

/// 获取路径配置
#[tauri::command]
pub fn get_path_config(config_manager: State<'_, ConfigManager>) -> Result<PathConfig, String> {
    config_manager.get_path_config()
}

/// 更新路径配置
#[tauri::command]
pub fn update_path_config(
    config_manager: State<'_, ConfigManager>,
    path_config: PathConfig,
) -> Result<(), String> {
    config_manager.update_path_config(path_config)
}

/// 获取指定实例的目录路径
#[tauri::command]
pub fn get_instance_path(
    config_manager: State<'_, ConfigManager>,
    instance_name: String,
) -> Result<String, String> {
    config_manager
        .get_instance_dir(&instance_name)
        .map(|p| p.to_string_lossy().to_string())
}

/// 获取指定实例的 versions 目录路径
#[tauri::command]
pub fn get_versions_path(
    config_manager: State<'_, ConfigManager>,
    instance_name: String,
) -> Result<String, String> {
    config_manager
        .get_versions_dir(&instance_name)
        .map(|p| p.to_string_lossy().to_string())
}

/// 获取指定实例的 libraries 目录路径
#[tauri::command]
pub fn get_libraries_path(
    config_manager: State<'_, ConfigManager>,
    instance_name: String,
) -> Result<String, String> {
    config_manager
        .get_libraries_dir(&instance_name)
        .map(|p| p.to_string_lossy().to_string())
}

/// 获取指定实例的 assets 目录路径
#[tauri::command]
pub fn get_assets_path(
    config_manager: State<'_, ConfigManager>,
    instance_name: String,
) -> Result<String, String> {
    config_manager
        .get_assets_dir(&instance_name)
        .map(|p| p.to_string_lossy().to_string())
}

/// 获取指定实例的 natives 目录路径
#[tauri::command]
pub fn get_natives_path(
    config_manager: State<'_, ConfigManager>,
    instance_name: String,
) -> Result<String, String> {
    config_manager
        .get_natives_dir(&instance_name)
        .map(|p| p.to_string_lossy().to_string())
}
