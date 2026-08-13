use crate::config::{ConfigManager, StoreLoginState, SystemConfig};
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

#[tauri::command]
pub fn save_login_state(
    cm: State<'_, ConfigManager>,
    login_state: StoreLoginState,
) -> Result<(), String> {
    let json_val = serde_json::to_value(login_state).map_err(|_e| "转换为json_val失败")?;
    cm.set_value("login_state", json_val)
}

#[tauri::command]
pub fn clear_login_state(cm: State<'_, ConfigManager>) -> Result<(), String> {
    let json_val =
        serde_json::to_value(StoreLoginState::default()).map_err(|_e| "转换为json_val失败")?;
    cm.set_value("login_state", json_val)
}