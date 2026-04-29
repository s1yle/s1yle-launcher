use crate::config::{
    AppConfig, ConfigManager, WindowPosition, CONFIG_APPLICATION, CONFIG_FILE_PATH, MIN_HEIGHT,
    MIN_WIDTH,
};
use crate::{log_error, log_info};
use serde::Serialize;
use serde_json::Value;
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::State;

impl ConfigManager {
    pub fn new(config: AppConfig, window: WindowPosition) -> Self {
        if !config.base_path.exists() {
            log_info!("启动器配置文件不存在，即将创建！");
            if let Some(parent) = config.base_path.parent() {
                if let Err(e) = fs::create_dir_all(parent) {
                    log_error!("启动器配置文件目录创建失败: {}", e);
                }
            }
        }
        Self {
            config: Mutex::new(config),
            window: Mutex::new(window),
        }
    }

    pub fn get_config_file_path() -> PathBuf {
        let config_dir = &*CONFIG_APPLICATION;
        let _ = fs::create_dir_all(config_dir);
        (*CONFIG_FILE_PATH).clone()
    }

    pub fn get_config(&self) -> Result<AppConfig, String> {
        self.config
            .lock()
            .map_err(|e| format!("获取配置锁失败: {}", e))
            .map(|guard| guard.clone())
    }

    pub fn update_config(&self, new_config: AppConfig) -> Result<(), String> {
        *self.config.lock().map_err(|e| e.to_string())? = new_config;
        self.save_to_disk()
    }

    fn save_to_disk(&self) -> Result<(), String> {
        let path = Self::get_config_file_path();
        let json = serde_json::to_string_pretty(&*self.config.lock().map_err(|e| e.to_string())?)
            .map_err(|e| format!("序列化配置失败: {}", e))?;
        fs::write(&path, json).map_err(|e| format!("写入配置文件失败: {}", e))?;
        log_info!("配置保存成功: {}", path.to_string_lossy());
        Ok(())
    }

    pub fn load_config_from_disk(&self) -> Result<(), String> {
        let path = Self::get_config_file_path();
        if !path.exists() {
            log_info!("ℹ️ 配置文件不存在，使用默认配置");
            return Ok(());
        }
        let content = fs::read_to_string(&path).map_err(|e| format!("读取配置文件失败: {}", e))?;
        let loaded: AppConfig =
            serde_json::from_str(&content).map_err(|e| format!("解析配置文件失败: {}", e))?;
        *self.config.lock().map_err(|e| e.to_string())? = loaded;
        log_info!("✅ 配置加载成功");
        Ok(())
    }

    pub fn get_window_pos(&self) -> Result<Option<WindowPosition>, String> {
        let window_guard = self
            .window
            .lock()
            .map_err(|e| format!("获取窗口位置锁失败: {}", e))?;
        Ok(Some(window_guard.clone()))
    }

    pub fn get_value(&self, key: &str) -> Result<Option<String>, String> {
        let config = self.get_config()?;
        let mut json_val =
            serde_json::to_value(&config).map_err(|e| format!("配置转JSON失败: {}", e))?;
        let path = parse_key_path(key);
        let value = get_nested_value(&mut json_val, &path)?;
        Ok(value.map(|v| v.to_string()))
    }

    pub fn write_config<T: Serialize>(&self, key: &str, val: T) -> Result<(), String> {
        let mut config = self.get_config()?;
        let mut json_val =
            serde_json::to_value(&config).map_err(|e| format!("配置转JSON失败: {}", e))?;
        let path = parse_key_path(key);
        let new_val = serde_json::to_value(val).map_err(|e| format!("值序列化失败: {}", e))?;
        set_nested_value(&mut json_val, &path, new_val)?;
        config =
            serde_json::from_value(json_val).map_err(|e| format!("JSON转回配置失败: {}", e))?;
        self.update_config(config)
    }
}

fn parse_key_path(key: &str) -> Vec<&str> {
    key.split('.').collect()
}

fn get_nested_value(value: &mut Value, path: &[&str]) -> Result<Option<Value>, String> {
    let mut current = value;
    for segment in path {
        current = current
            .get_mut(segment)
            .ok_or_else(|| format!("配置路径不存在: {}", segment))?;
    }
    Ok(Some(current.clone()))
}

fn set_nested_value(value: &mut Value, path: &[&str], new_val: Value) -> Result<(), String> {
    let mut current = value;
    let (last, segments) = path.split_last().ok_or("空的配置路径")?;
    for segment in segments {
        current = current
            .get_mut(segment)
            .ok_or_else(|| format!("配置路径不存在: {}", segment))?;
    }
    current[last] = new_val;
    Ok(())
}

pub fn window_check(pos: &mut WindowPosition) {
    if pos.x <= 0 {
        pos.x = 1;
    }
    if pos.y <= 0 {
        pos.y = 1;
    }
    if pos.height < *MIN_HEIGHT {
        pos.height = *MIN_HEIGHT;
    }
    if pos.width < *MIN_WIDTH {
        pos.width = *MIN_WIDTH;
    }
}

pub fn get_config_path() -> Result<PathBuf, String> {
    let config_dir = &*CONFIG_APPLICATION;
    fs::create_dir_all(config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    Ok((*CONFIG_FILE_PATH).clone())
}

#[tauri::command]
pub fn get_config(config_manager: State<'_, ConfigManager>) -> Result<AppConfig, String> {
    config_manager.get_config()
}

#[tauri::command]
pub fn update_config(
    config_manager: State<'_, ConfigManager>,
    new_config: AppConfig,
) -> Result<(), String> {
    config_manager.update_config(new_config)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_dynamic_config() {
        let config = AppConfig::default();
        let window = WindowPosition::default();
        let manager = ConfigManager::new(config, window);
        let x = manager.get_value("window_pos.x").unwrap();
        println!("窗口X坐标: {:?}", x);
        manager.write_config("window_pos.x", 888).unwrap();
        manager.write_config("window_pos.maximized", true).unwrap();
        let new_x = manager.get_value("window_pos.x").unwrap();
        println!("修改后X坐标: {:?}", new_x);
    }
}
