//! 游戏模块运行时状态（Tauri managed state）
//!
//! 持有游戏文件夹列表与全局游戏设置的内存副本，通过 `config_io` 持久化到
//! `game` 顶层键。游戏根目录（game_root）由 `AppContext` 统一管理，本状态不持有。

use std::path::PathBuf;
use std::sync::Mutex;
use crate::app_context::AppContext;
use crate::config_io;
use crate::game::models::{GameFolder, GameSettings};
use crate::shared::models::GamePersist;
use serde_json::Value;

pub struct GameState {
    config_path: PathBuf,
    ctx: AppContext,
    /// 已添加的游戏文件夹列表
    pub folders: Mutex<Vec<GameFolder>>,
    /// 全局游戏设置（未启用游戏独立设置时的默认值）
    pub global_settings: Mutex<GameSettings>,
}

impl GameState {
    /// 从磁盘加载游戏状态
    pub fn load(ctx: &AppContext) -> Self {
        let config_path = ctx.launcher_config_path();
        let raw = config_io::read_raw(&config_path);
        let game_section = raw.get("game");

        // 兼容迁移：旧配置中 folders 为字符串数组（仅路径），
        // 新格式为 GameFolder 对象数组（path + name）。统一转换为新格式。
        let mut folders: Vec<GameFolder> = game_section
            .and_then(|g| g.get("folders"))
            .and_then(|f| serde_json::from_value::<Vec<GameFolder>>(f.clone()).ok())
            .unwrap_or_default();
        if folders.is_empty() {
            if let Some(arr) = game_section.and_then(|g| g.get("folders")).and_then(|f| f.as_array()) {
                folders = arr
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| GameFolder {
                        path: s.to_string(),
                        name: folder_basename(s),
                    }))
                    .collect();
            }
        }

        // 确保默认游戏根目录始终出现在文件夹列表中，
        // 使侧边栏默认展示该文件夹并支持高亮当前根目录。
        let root = ctx.game_root().to_string_lossy().to_string();
        if !folders.iter().any(|f| f.path == root) {
            folders.push(GameFolder {
                path: root.clone(),
                name: folder_basename(&root),
            });
        }
        Self {
            config_path: config_path.to_path_buf(),
            ctx: ctx.clone(),
            folders: Mutex::new(folders),
            global_settings: Mutex::new(
                game_section
                    .and_then(|g| g.get("global_settings"))
                    .and_then(|s| serde_json::from_value(s.clone()).ok())
                    .unwrap_or_default(),
            ),
        }
    }

    /// 持久化（保留 game_root，只更新本状态持有的字段）
    fn save(&self) -> Result<(), String> {
        let mut data: GamePersist =
            config_io::read_section(&self.config_path, "game").unwrap_or_default();
        data.folders = self.folders.lock().map_err(|e| e.to_string())?.clone();
        data.global_settings = self
            .global_settings
            .lock()
            .map_err(|e| e.to_string())?
            .clone();
        config_io::write_section(&self.config_path, "game", &data)
    }

    // ==================== 游戏文件夹列表 ====================

    /// 获取已添加的游戏文件夹列表
    pub fn get_folders(&self) -> Vec<GameFolder> {
        self.folders.lock().unwrap().clone()
    }

    /// 添加游戏文件夹（名称去重 + 路径去重；不切换当前根目录）
    pub fn add_folder(&self, path: &str, name: &str) -> Result<Vec<GameFolder>, String> {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err("文件夹名称不能为空".to_string());
        }
        let mut folders = self.folders.lock().map_err(|e| e.to_string())?;
        if folders
            .iter()
            .any(|f| f.name.eq_ignore_ascii_case(trimmed))
        {
            return Err(format!("文件夹名称已存在: {}", trimmed));
        }
        if !folders.iter().any(|f| f.path == path) {
            folders.push(GameFolder {
                path: path.to_string(),
                name: trimmed.to_string(),
            });
        }
        let result = folders.clone();
        drop(folders);
        self.save()?;
        Ok(result)
    }

    /// 移除游戏文件夹（仅移除记录，不删除实际文件）
    pub fn remove_folder(&self, path: &str) -> Result<Vec<GameFolder>, String> {
        let mut folders = self.folders.lock().map_err(|e| e.to_string())?;
        folders.retain(|f| f.path != path);
        let result = folders.clone();
        drop(folders);
        self.save()?;
        Ok(result)
    }

    // ==================== 全局游戏设置 ====================

    /// 获取全局游戏设置
    pub fn get_global_game_settings(&self) -> GameSettings {
        self.global_settings.lock().unwrap().clone()
    }

    /// 更新全局游戏设置（增量合并，忽略 None 字段；强制独立开关为 false）
    pub fn update_global_game_settings(
        &self,
        settings: &GameSettings,
    ) -> Result<GameSettings, String> {
        let mut global = self.global_settings.lock().map_err(|e| e.to_string())?;
        global.apply_update(settings);
        global.use_game_settings = false;
        let result = global.clone();
        drop(global);
        self.save()?;
        Ok(result)
    }
}

/// 取路径最后一段作为默认显示名称（兼容 Windows / 类 Unix 分隔符）
fn folder_basename(path: &str) -> String {
    let p = path.trim_end_matches(['/', '\\']);
    match p.rsplit_once(['/', '\\']) {
        Some((_, name)) if !name.is_empty() => name.to_string(),
        _ => path.to_string(),
    }
}
