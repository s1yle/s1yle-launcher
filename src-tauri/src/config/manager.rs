use crate::config::{
    AppConfig, ConfigManager, InstanceConfig, WindowPosition, CONFIG_APPLICATION, CONFIG_FILE_PATH, MIN_HEIGHT,
    MIN_WIDTH,
};
use crate::{log_error, log_info};
use serde_json::Value;
use std::{collections::HashMap, fs, path::PathBuf, sync::Mutex};

impl ConfigManager {
    pub fn new(config: AppConfig, window: WindowPosition) -> Self {
        if !config.base_path.exists() {
            log_info!("启动器配置文件不存在，即将创建！");
            if let Some(parent) = config.base_path.parent() {
                if let Err(e) = fs::create_dir_all(parent) {
                    log_error!("启动器配置文件目录创建失败：{}", e);
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
            .map_err(|e| format!("获取配置锁失败：{}", e))
            .map(|guard| guard.clone())
    }

    pub fn update_config(&self, new_config: AppConfig) -> Result<(), String> {
        *self.config.lock().map_err(|e| e.to_string())? = new_config;
        self.save_to_disk()
    }

    fn save_to_disk(&self) -> Result<(), String> {
        let path = Self::get_config_file_path();
        let json = serde_json::to_string_pretty(&*self.config.lock().map_err(|e| e.to_string())?)
            .map_err(|e| format!("序列化配置失败：{}", e))?;
        fs::write(&path, json).map_err(|e| format!("写入配置文件失败：{}", e))?;
        log_info!("配置保存成功：{}", path.to_string_lossy());
        Ok(())
    }

    pub fn load_config_from_disk(&self) -> Result<(), String> {
        let path = Self::get_config_file_path();
        if !path.exists() {
            log_info!("ℹ️ 配置文件不存在，使用默认配置");
            return Ok(());
        }
        let content = fs::read_to_string(&path).map_err(|e| format!("读取配置文件失败：{}", e))?;
        let loaded: AppConfig =
            serde_json::from_str(&content).map_err(|e| format!("解析配置文件失败：{}", e))?;
        *self.config.lock().map_err(|e| e.to_string())? = loaded;
        log_info!("✅ 配置加载成功");
        Ok(())
    }

    pub fn get_window_pos(&self) -> Result<Option<WindowPosition>, String> {
        let window_guard = self
            .window
            .lock()
            .map_err(|e| format!("获取窗口位置锁失败：{}", e))?;
        Ok(Some(window_guard.clone()))
    }

    pub fn get_value(&self, key: &str) -> Result<Option<String>, String> {
        let config = self.get_config()?;
        let mut json_val =
            serde_json::to_value(&config).map_err(|e| format!("配置转 JSON 失败：{}", e))?;
        let path = parse_key_path(key);
        let value = get_nested_value(&mut json_val, &path)?;
        Ok(value.map(|v| v.to_string()))
    }

    pub fn write_config(&self, key: &str, val: serde_json::Value) -> Result<(), String> {
        let mut config = self.get_config()?;
        let mut json_val =
            serde_json::to_value(&config).map_err(|e| format!("配置转 JSON 失败：{}", e))?;
        let path = parse_key_path(key);
        let new_val = val;
        set_nested_value(&mut json_val, &path, new_val)?;
        config =
            serde_json::from_value(json_val).map_err(|e| format!("JSON 转回配置失败：{}", e))?;
        self.update_config(config)
    }

    // ==================== 实例配置管理方法 ====================

    /// # 获取实例配置
    pub fn get_instance_config(&self, instance_id: &str) -> Result<Option<InstanceConfig>, String> {
        let config = self.get_config()?;
        Ok(config.instance_configs.get(instance_id).cloned())
    }

    /// # 更新实例配置
    pub fn update_instance_config(
        &self,
        instance_id: &str,
        new_config: InstanceConfig,
    ) -> Result<(), String> {
        let mut config = self.get_config()?;
        config.instance_configs.insert(instance_id.to_string(), new_config);
        self.update_config(config)
    }

    /// # 删除实例配置
    pub fn remove_instance_config(&self, instance_id: &str) -> Result<(), String> {
        let mut config = self.get_config()?;
        config.instance_configs.remove(instance_id);
        self.update_config(config)
    }

    /// # 获取所有实例配置
    pub fn get_all_instance_configs(&self) -> Result<HashMap<String, InstanceConfig>, String> {
        let config = self.get_config()?;
        Ok(config.instance_configs.clone())
    }

    /// # 重置配置到默认值
    pub fn reset_config(&self) -> Result<(), String> {
        let default = AppConfig::default();
        self.update_config(default)
    }

    /// # 导出配置到文件
    pub fn export_config(&self, target_path: PathBuf) -> Result<(), String> {
        let config = self.get_config()?;
        let json = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("序列化配置失败：{}", e))?;
        fs::write(&target_path, json)
            .map_err(|e| format!("写入配置失败：{}", e))?;
        log_info!("配置已导出到：{}", target_path.to_string_lossy());
        Ok(())
    }

    /// # 从文件导入配置
    pub fn import_config(&self, source_path: PathBuf) -> Result<(), String> {
        let content = fs::read_to_string(&source_path)
            .map_err(|e| format!("读取配置失败：{}", e))?;
        let imported: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("解析配置失败：{}", e))?;
        
        // 版本迁移
        let migrated = self.migrate_config(imported)?;
        self.update_config(migrated)
    }

    /// # 配置版本迁移
    fn migrate_config(&self, mut config: AppConfig) -> Result<AppConfig, String> {
        let current_version = crate::config::CONFIG_VERSION;
        
        if config.version < current_version {
            log_info!("检测到旧版本配置 (v{} -> v{})", config.version, current_version);
            
            // 版本迁移逻辑
            match config.version {
                0 => {
                    // v0 -> v1 迁移（未来实现）
                    config.version = 1;
                }
                _ => {}
            }
            
            // 递归迁移
            if config.version < current_version {
                return self.migrate_config(config);
            }
        }
        
        Ok(config)
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
            .ok_or_else(|| format!("配置路径不存在：{}", segment))?;
    }
    Ok(Some(current.clone()))
}

fn set_nested_value(value: &mut Value, path: &[&str], new_val: Value) -> Result<(), String> {
    let mut current = value;
    let (last, segments) = path.split_last().ok_or("空的配置路径")?;
    for segment in segments {
        current = current
            .get_mut(segment)
            .ok_or_else(|| format!("配置路径不存在：{}", segment))?;
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
    fs::create_dir_all(config_dir).map_err(|e| format!("创建配置目录失败：{}", e))?;
    Ok((*CONFIG_FILE_PATH).clone())
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
        println!("窗口 X 坐标：{:?}", x);
        manager.write_config("window_pos.x", 888).unwrap();
        manager.write_config("window_pos.maximized", true).unwrap();
        let new_x = manager.get_value("window_pos.x").unwrap();
        println!("修改后 X 坐标：{:?}", new_x);
    }
}
