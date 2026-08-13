use std::fs;
use std::path::{Path, PathBuf};

use super::models::{Game, GameSettings};
use crate::app_context::AppContext;
use crate::modloader::ModLoaderType;
use crate::log_info;

/// 实例管理器门面
///
/// 组合根处构造注入 `AppContext`，持有全部实例域逻辑：
/// 实例 CRUD、记录持久化（原 storage）、目录扫描（原 scanner）、
/// 版本已安装判定（原 layout 根级函数）。
/// dir 级纯路径函数（version_json_in_dir 等）见 [`AppContext`]。
pub struct GameManager {
    /// 应用上下文（路径唯一事实源）
    ctx: AppContext,
}

impl GameManager {
    /// 创建新的实例管理器（组合根注入 ctx）
    pub fn new(ctx: AppContext) -> Self {
        Self { ctx }
    }

    // ==================== 实例 CRUD ====================

    /// 扫描所有实例
    pub fn scan_games(&self) -> Result<Vec<Game>, String> {
        let mut games = Vec::new();

        if let Ok(entries) = fs::read_dir(self.ctx.versions_dir()) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
                    continue;
                };
                // 无记录的目录不是合法实例，跳过（不自动补记录）
                let Some(mut record) = self.find_record_by_name(name) else {
                    continue;
                };
                // 实例必须存在已安装版本
                let Some(version) = self.resolve_version(&record, name) else {
                    continue;
                };

                record.name = name.to_string();
                record.version_id = version;
                record.path = path.to_string_lossy().to_string();
                record.game_settings = Some((&record).into());
                games.push(record);
            }
        }

        games.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(games)
    }

    /// 获取指定名称的实例
    pub fn get_game(&self, game_name: &str) -> Option<Game> {
        let mut record = self.load_record(game_name)?;
        let game_dir = self.ctx.game_dir(&record.name);
        if !game_dir.is_dir() {
            return None;
        }
        record.path = game_dir.to_string_lossy().to_string();
        record.game_settings = Some((&record).into());
        Some(record)
    }

    /// 创建新实例（目录 + 记录）
    pub fn create_game(
        &self,
        name: &str,
        version: &str,
        loader_type: ModLoaderType,
        loader_version: Option<String>,
        icon_path: Option<String>,
    ) -> Result<Game, String> {
        validate_name(name)?;

        let game_dir = self.ctx.game_dir(name);
        if game_dir.exists() {
            return Err(format!("实例 {} 已存在", name));
        }

        fs::create_dir_all(&game_dir).map_err(|e| format!("创建实例目录失败：{}", e))?;

        let record = Game::new(name, version, loader_type, loader_version, icon_path);
        self.save_record(&record)?;

        log_info!("实例创建成功：{} ({})", name, version);
        self.get_game(name)
            .ok_or_else(|| "创建实例后加载失败".to_string())
    }

    /// 删除实例（delete_files=true 同时删除实例目录）
    pub fn delete_game(&self, game_name: &str, delete_files: bool) -> Result<(), String> {
        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("实例不存在: {}", game_name))?;

        self.delete_record(game_name);

        if delete_files {
            let game_dir = self.ctx.game_dir(&game.name);
            if game_dir.exists() {
                fs::remove_dir_all(&game_dir).map_err(|e| format!("删除实例失败: {}", e))?;
            }
        }

        log_info!("实例已删除：{} ({})", game.name, game_name);
        Ok(())
    }

    /// 重命名实例（重命名目录 + 更新记录）
    pub fn rename_game(&self, game_name: &str, new_name: &str) -> Result<Game, String> {
        validate_name(new_name)?;

        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("实例不存在: {}", game_name))?;

        let old_dir = self.ctx.game_dir(&game.name);
        let new_dir = self.ctx.game_dir(new_name);
        if new_dir.exists() {
            return Err(format!("实例 {} 已存在", new_name));
        }

        fs::rename(&old_dir, &new_dir).map_err(|e| format!("重命名失败: {}", e))?;

        let mut record = game;
        record.name = new_name.to_string();
        self.save_record(&record)?;

        log_info!("实例重命名成功：{} -> {}", new_name, game_name);
        self.get_game(new_name)
            .ok_or_else(|| "重命名实例后加载失败".to_string())
    }

    /// 更新实例信息（名称、启用状态）
    pub fn update_game(
        &self,
        game_name: &str,
        name: Option<String>,
        enabled: Option<bool>,
    ) -> Result<Game, String> {
        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("实例不存在: {}", game_name))?;

        let mut record = game;
        if let Some(n) = name {
            if n != record.name {
                return self.rename_game(game_name, &n);
            }
        }
        if let Some(e) = enabled {
            record.enabled = e;
            self.save_record(&record)?;
        }
        Ok(record)
    }

    // ==================== 实例记录（原 storage 模块） ====================

    /// 加载实例记录
    pub fn load_record(&self, game_name: &str) -> Option<Game> {
        let rpath = self.ctx.record_path(game_name);
        Self::load_record_from_path(&rpath)
    }

    /// 按文件路径读取记录（如 .minecraft/versions/26.2/.wecraft_26.2.json）
    pub fn load_record_from_path(path: &Path) -> Option<Game> {
        if !path.exists() {
            return None;
        }
        let content = fs::read_to_string(path).ok()?;
        serde_json::from_str::<Game>(&content).ok()
    }

    /// 保存实例记录到磁盘
    pub fn save_record(&self, record: &Game) -> Result<(), String> {
        let rpath = self.ctx.record_path(&record.name);
        if let Some(parent) = rpath.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建实例记录目录失败：{}", e))?;
        }
        let content =
            serde_json::to_string_pretty(record).map_err(|e| format!("序列化实例记录失败：{}", e))?;
        fs::write(&rpath, content).map_err(|e| format!("写入实例记录失败：{}", e))?;
        Ok(())
    }

    /// 删除实例记录（仅删除记录文件，不影响实例目录）
    fn delete_record(&self, game_name: &str) -> Result<(), String> {
        let rpath = self.ctx.record_path(game_name);
        fs::remove_file(rpath).map_err(|e| e.to_string())
    }

    /// 列出所有实例记录文件路径（{versions_dir}/{name}/.wecraft_{name}.json）
    fn record_paths(&self) -> Vec<PathBuf> {
        let mut paths = Vec::new();
        if let Ok(entries) = fs::read_dir(self.ctx.versions_dir()) {
            for entry in entries.flatten() {
                let game_dir = entry.path();
                if !game_dir.is_dir() {
                    continue;
                }
                let Some(name) = game_dir.file_name().and_then(|n| n.to_str()) else {
                    continue;
                };
                let record = self.ctx.record_path(name);
                if record.exists() {
                    paths.push(record);
                }
            }
        }
        paths
    }

    /// 更新实例游戏设置（DTO 增量应用）
    pub fn update_game_settings(
        &self,
        game_name: &str,
        settings: &GameSettings,
    ) -> Result<Game, String> {
        let mut record =
            self.load_record(game_name).ok_or_else(|| format!("实例不存在：{}", game_name))?;
        record.apply_settings(settings);
        self.save_record(&record)?;
        self.get_game(game_name)
            .ok_or_else(|| format!("实例不存在：{}", game_name))
    }

    // ==================== 版本扫描（原 layout 根级函数） ====================

    /// 判定版本是否已安装（jar 平放于游戏目录）
    pub fn is_version_installed(&self, game_name: &str, version_id: &str) -> bool {
        let game_dir = self.ctx.game_dir(game_name);
        game_dir.join(format!("{}.jar", version_id)).exists()
            || game_dir.join("client.jar").exists()
    }

    /// 扫描单个实例的已安装版本
    pub fn scan_game_versions(&self, game_name: &str) -> Vec<String> {
        Self::scan_versions_in(&self.ctx.game_dir(game_name))
    }

    /// 扫描全部已安装版本（所有游戏目录去重排序）
    pub fn scan_all_installed_versions(&self) -> Vec<String> {
        let mut set = std::collections::BTreeSet::new();

        if let Ok(entries) = fs::read_dir(self.ctx.versions_dir()) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    for v in Self::scan_versions_in(&path) {
                        set.insert(v);
                    }
                }
            }
        }

        set.into_iter().collect()
    }

    /// 扫描某个游戏目录下的已安装版本列表（jar 平放扫描）
    fn scan_versions_in(game_dir: &Path) -> Vec<String> {
        let mut versions = Vec::new();
        if let Ok(entries) = fs::read_dir(game_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
                    continue;
                };
                if ext != "jar" {
                    continue;
                }
                let Some(name) = path.file_stem().and_then(|n| n.to_str()) else {
                    continue;
                };
                if name != "client" {
                    versions.push(name.to_string());
                }
            }
        }
        versions.sort();
        versions
    }

    // ==================== 私有方法 ====================

    /// 按实例名称查找记录（记录按 name 命名文件，name 字段对应目录名）
    fn find_record_by_name(&self, name: &str) -> Option<Game> {
        self.record_paths()
            .into_iter()
            .find_map(|path| {
                let record = Self::load_record_from_path(&path)?;
                if record.name == name {
                    Some(record)
                } else {
                    None
                }
            })
    }

    /// 解析实例当前版本：优先记录中的版本，其次取第一个已安装版本
    fn resolve_version(&self, record: &Game, name: &str) -> Option<String> {
        if self.is_version_installed(name, &record.version_id) {
            return Some(record.version_id.clone());
        }
        self.scan_game_versions(name).into_iter().next()
    }
}

/// 校验实例名称（非空、不含路径分隔符）
fn validate_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("实例名称不能为空".to_string());
    }
    if name.contains('/') || name.contains('\\') || name.contains('\0') {
        return Err("实例名称不能包含路径分隔符".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    fn temp_dir(tag: &str) -> PathBuf {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir()
            .join(format!("wecraft-game-{}-{}-{}", tag, std::process::id(), n));
        let _ = fs::remove_dir_all(&dir);
        dir
    }

    fn manager(tag: &str) -> GameManager {
        let dir = temp_dir(tag);
        let ctx = AppContext::new(dir.join("work"), dir.join("games"));
        let gm = GameManager::new(ctx.clone());
        ctx.ensure_dirs().unwrap();
        gm
    }

    #[test]
    fn create_and_scan_roundtrip() {
        let gm = manager("crud");
        gm.create_game("test-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        // 实例必须存在已安装版本（jar 平放）才会出现在扫描结果中
        fs::write(gm.ctx.game_dir("test-game").join("1.20.4.jar"), b"jar").unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "test-game");
        assert_eq!(games[0].version_id, "1.20.4");
        assert!(gm.get_game("test-game").is_some());
    }

    #[test]
    fn duplicate_name_rejected() {
        let gm = manager("dup");
        gm.create_game("dup-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        let err = gm
            .create_game("dup-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap_err();
        assert!(err.contains("已存在"));
    }

    #[test]
    fn rename_updates_directory_and_record() {
        let gm = manager("rename");
        gm.create_game("old-name", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        let renamed = gm.rename_game("old-name", "new-name").unwrap();
        assert_eq!(renamed.name, "new-name");
        assert!(gm.get_game("old-name").is_none());
        assert!(gm.get_game("new-name").is_some());
    }

    #[test]
    fn installed_version_scanning() {
        let gm = manager("scan");
        gm.create_game("scan-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        assert!(!gm.is_version_installed("scan-game", "1.20.4"));
        let game_dir = gm.ctx.game_dir("scan-game");
        fs::write(game_dir.join("1.20.4.jar"), b"jar").unwrap();
        assert!(gm.is_version_installed("scan-game", "1.20.4"));
        assert!(gm.scan_game_versions("scan-game").contains(&"1.20.4".to_string()));
        assert!(gm.scan_all_installed_versions().contains(&"1.20.4".to_string()));
    }

    #[test]
    fn delete_game_removes_directory_when_requested() {
        let gm = manager("delete");
        gm.create_game("del-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        gm.delete_game("del-game", true).unwrap();
        assert!(gm.get_game("del-game").is_none());
        assert!(!gm.ctx.game_dir("del-game").exists());
    }
}