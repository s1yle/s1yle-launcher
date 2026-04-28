use std::{fs, path::PathBuf, sync::Mutex};

use crate::config::{AppConfig, CONFIG_APPLICATION, CONFIG_FILE_PATH, ConfigManager, WindowPosition};
use crate::{log_error, log_info};
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
            window: Mutex::new(window)
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
}

// 模块级函数：获取配置文件路径（供 account.rs 等模块使用）
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
