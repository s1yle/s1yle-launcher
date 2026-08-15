use crate::config::{ConfigManager, SystemConfig};
use tauri::State;

/// 获取全局配置
#[tauri::command]
pub fn get_config(config_manager: State<'_, ConfigManager>) -> Result<SystemConfig, String> {
    config_manager.get_config()
}

/// 动态写入配置值（支持点号分隔的路径）
#[tauri::command]
pub fn set_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    config_manager.set_value(&key, value)
}