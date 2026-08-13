use crate::app_context::AppContext;
use crate::config::{ConfigManager, MIN_HEIGHT, MIN_WIDTH, SystemConfig, WindowPosition};
use crate::log_info;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Mutex;

impl ConfigManager {
    /// 创建配置管理器（组合根注入 ctx，读取并缓存配置）
    pub fn new(ctx: AppContext) -> Self {
        let mut config: SystemConfig =
            Self::read_section_impl(&ctx, "app").unwrap_or_default();
        if config.game_root.as_os_str().is_empty() {
            config.game_root = ctx.game_root();
        }
        Self {
            ctx,
            config: Mutex::new(config),
        }
    }

    /// 获取全局应用配置
    pub fn get_config(&self) -> Result<SystemConfig, String> {
        self.config
            .lock()
            .map_err(|e| format!("获取配置锁失败：{}", e))
            .map(|guard| guard.clone())
    }

    /// 保存配置到磁盘（合并写入，不影响 accounts/admin_accounts 节）
    pub fn save(&self) -> Result<(), String> {
        let config = self.get_config()?;
        self.write_section("app", &config)?;
        log_info!("配置保存成功");
        Ok(())
    }

    /// 根据点号分隔的路径写入配置值（增量更新）
    pub fn set_value(&self, key: &str, value: Value) -> Result<(), String> {
        let mut config = self.get_config()?;
        let mut json_val =
            serde_json::to_value(&config).map_err(|e| format!("配置转 JSON 失败：{}", e))?;
        set_nested_value(&mut json_val, &parse_key_path(key), value)?;
        config =
            serde_json::from_value(json_val).map_err(|e| format!("JSON 转回配置失败：{}", e))?;
        *self.config.lock().map_err(|e| e.to_string())? = config;
        self.save()
    }

    /// 按窗口类型获取位置
    pub fn get_window_pos_by_label(&self, label: &str) -> Result<Option<WindowPosition>, String> {
        let config = self.get_config()?;
        match label {
            "main" => Ok(config.window_positions.main.clone()),
            "login" => Ok(config.window_positions.login.clone()),
            _ => Ok(None),
        }
    }

    /// 按窗口类型更新位置
    pub fn update_window_pos_by_label(
        &self,
        label: &str,
        pos: WindowPosition,
    ) -> Result<(), String> {
        let mut config = self.get_config()?;
        match label {
            "main" => config.window_positions.main = Some(pos),
            "login" => config.window_positions.login = Some(pos),
            _ => return Err(format!("未知窗口类型: {}", label)),
        }
        *self.config.lock().map_err(|e| e.to_string())? = config;
        self.save()
    }

    // ==================== 游戏根目录 ====================

    /// 设置游戏根目录并持久化（写入配置 app.game_dir + 更新运行时 ctx）
    pub fn set_game_root(&self, game_root: &PathBuf) -> Result<(), String> {
        if game_root.as_os_str().is_empty() {
            return Err("游戏根目录不能为空".to_string());
        }
        let mut config = self.get_config()?;
        self.ctx.set_game_root(game_root.clone());
        config.game_root = game_root.clone();
        *self.config.lock().map_err(|e| e.to_string())? = config;
        self.save()?;
        log_info!("游戏根目录已切换: {}", game_root.to_string_lossy());
        Ok(())
    }

    // ==================== 统一配置节读写（原 store 模块） ====================

    /// 读取指定顶层键的配置节（反序列化为 T）
    pub(crate) fn read_section<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        Self::read_section_impl(&self.ctx, key)
    }

    /// 写入指定顶层键的配置节（不影响其他键）
    pub(crate) fn write_section<T: Serialize>(&self, key: &str, value: &T) -> Result<(), String> {
        let value = serde_json::to_value(value).map_err(|e| format!("序列化配置节失败: {e}"))?;
        self.write_section_value(key, &value)
    }

    /// 写入指定顶层键的配置节（原始 JSON）
    pub(crate) fn write_section_value(
        &self,
        key: &str,
        value: &serde_json::Value,
    ) -> Result<(), String> {
        let mut root = read_file(&self.ctx.launcher_config_path());
        root[key] = value.clone();
        write_file(&self.ctx.launcher_config_path(), &root)
    }

    /// 读取指定顶层键的配置节（静态版本，用于构造阶段）
    fn read_section_impl<T: DeserializeOwned>(ctx: &AppContext, key: &str) -> Option<T> {
        read_file(&ctx.launcher_config_path())
            .get(key)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
    }
}

/// 读取整个配置文件为 JSON Value（文件缺失或损坏返回空对象）
fn read_file(path: &std::path::Path) -> serde_json::Value {
    match std::fs::read_to_string(path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({})),
        Err(_) => serde_json::json!({}),
    }
}

/// 写入整个配置文件（保证目录存在）
fn write_file(path: &std::path::Path, root: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {e}"))?;
    }
    let json = serde_json::to_string_pretty(root).map_err(|e| format!("序列化配置失败: {e}"))?;
    std::fs::write(path, json).map_err(|e| format!("写入配置文件失败: {e}"))
}

// ==================== JSON 路径工具 ====================

/// 将点号分隔的配置路径拆分为路径段
fn parse_key_path(key: &str) -> Vec<&str> {
    key.split('.').collect()
}

/// 根据路径段设置嵌套 JSON 值（自动创建中间节点）
fn set_nested_value(value: &mut Value, path: &[&str], new_val: Value) -> Result<(), String> {
    let mut current = value;
    let (last, segments) = path.split_last().ok_or("空的配置路径")?;

    for segment in segments {
        if !current.get(segment).is_some() {
            current[*segment] = Value::Object(serde_json::Map::new());
        }
        if !current[segment].is_object() {
            return Err(format!("配置路径不是对象类型：{}", segment));
        }
        current = current.get_mut(segment).unwrap();
    }

    current[last] = new_val;
    Ok(())
}

/// 校验并修正窗口位置（避免负坐标和过小尺寸）
pub fn window_check(pos: &mut WindowPosition) {
    if pos.x <= 0 {
        pos.x = 1;
    }
    if pos.y <= 0 {
        pos.y = 1;
    }
    if pos.height < MIN_HEIGHT {
        pos.height = MIN_HEIGHT;
    }
    if pos.width < MIN_WIDTH {
        pos.width = MIN_WIDTH;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};

    /// 生成唯一临时目录（每个测试独立，可并行）
    fn temp_dir(tag: &str) -> std::path::PathBuf {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir()
            .join(format!("wecraft-test-{}-{}-{}", tag, std::process::id(), n));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn manager(tag: &str) -> (ConfigManager, std::path::PathBuf) {
        let dir = temp_dir(tag);
        let ctx = AppContext::new(dir.clone(), dir.join("games"));
        (ConfigManager::new(ctx), dir)
    }

    #[test]
    fn set_value_writes_nested_path() {
        let (manager, dir) = manager("config-nested");
        manager
            .set_value("login_state.is_logged_in", serde_json::json!(true))
            .unwrap();
        let config = manager.get_config().unwrap();
        assert!(config.login_state.is_logged_in);
        let on_disk: Value = serde_json::from_str(
            &fs::read_to_string(dir.join(".wecraft.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(on_disk["app"]["login_state"]["is_logged_in"], true);
    }

    #[test]
    fn read_write_section_roundtrip() {
        let (manager, _dir) = manager("config-section");
        manager.write_section("accounts", &serde_json::json!({"count": 3})).unwrap();
        let loaded: serde_json::Value = manager.read_section("accounts").unwrap();
        assert_eq!(loaded["count"], 3);
    }

    #[test]
    fn set_game_root_persists_and_switches() {
        let (manager, _dir) = manager("config-game-dir");
        let new_root = std::env::temp_dir().join(format!("wecraft-gameroot-{}", std::process::id()));
        manager.set_game_root(&new_root).unwrap();
        assert_eq!(manager.ctx.game_root().to_string_lossy(), new_root.to_string_lossy());
    }

    #[test]
    fn window_check_corrects_invalid_values() {
        let mut pos = WindowPosition {
            x: 0,
            y: -5,
            width: 100,
            height: 100,
            maximized: false,
        };
        window_check(&mut pos);
        assert_eq!(pos.x, 1);
        assert_eq!(pos.y, 1);
        assert_eq!(pos.width, MIN_WIDTH);
        assert_eq!(pos.height, MIN_HEIGHT);
    }
}