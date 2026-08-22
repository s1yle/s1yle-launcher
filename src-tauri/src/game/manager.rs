use std::fs;
use std::path::{Path, PathBuf};

use super::models::{Game, GameSettings};
use crate::app_context::AppContext;
use crate::modloader::ModLoaderType;
use crate::log_info;

/// 游戏管理器门面
///
/// 组合根处构造注入 `AppContext`，持有全部游戏域逻辑：
/// 游戏 CRUD、记录持久化（原 storage）、目录扫描（原 scanner）、
/// 版本已安装判定（原 layout 根级函数）。
/// dir 级纯路径函数（version_json_in_dir 等）见 [`AppContext`]。
#[derive(Clone)]
pub struct GameManager {
    /// 应用上下文（路径唯一事实源）
    ctx: AppContext,
}

impl GameManager {
    /// 创建新的游戏管理器（组合根注入 ctx）
    pub fn new(ctx: AppContext) -> Self {
        Self { ctx }
    }

    // ==================== 游戏 CRUD ====================

    /// 获取指定名称的游戏
    pub fn get_game(&self, game_name: &str) -> Option<Game> {
        let game_dir = self.ctx.game_dir(game_name);
        if !game_dir.is_dir() {
            return None;
        }
        // 记录缺失/损坏时以目录名重建基础记录（与 scan_games 一致），
        // 保证对"目录存在但无记录"的游戏（如手动创建的空目录）也可操作
        let mut record = self
            .load_record(game_name)
            .unwrap_or_else(|| Game::new(game_name, "", ModLoaderType::Vanilla, None, None));
        record.name = game_name.to_string();
        record.path = game_dir.to_string_lossy().to_string();
        record.game_settings = Some((&record).into());
        record.empty = super::validator::is_game_dir_empty(&game_dir);
        Some(record)
    }

    /// 创建新游戏（目录 + 记录）
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
            return Err(format!("游戏 {} 已存在", name));
        }

        fs::create_dir_all(&game_dir).map_err(|e| format!("创建游戏目录失败：{}", e))?;

        let record = Game::new(name, version, loader_type, loader_version, icon_path);
        self.save_record(&record)?;

        log_info!("游戏创建成功：{} ({})", name, version);
        self.get_game(name)
            .ok_or_else(|| "创建游戏后加载失败".to_string())
    }

    /// 删除游戏（delete_files=true 同时删除游戏目录）
    pub fn delete_game(&self, game_name: &str, delete_files: bool) -> Result<(), String> {
        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("游戏不存在: {}", game_name))?;

        self.delete_record(game_name);

        if delete_files {
            let game_dir = self.ctx.game_dir(&game.name);
            if game_dir.exists() {
                fs::remove_dir_all(&game_dir).map_err(|e| format!("删除游戏失败: {}", e))?;
            }
        }

        log_info!("游戏已删除：{} ({})", game.name, game_name);
        Ok(())
    }

    /// 重命名游戏（重命名目录 + 更新记录）
    pub fn rename_game(&self, game_name: &str, new_name: &str) -> Result<Game, String> {
        validate_name(new_name)?;

        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("游戏不存在: {}", game_name))?;

        let old_dir = self.ctx.game_dir(&game.name);
        let new_dir = self.ctx.game_dir(new_name);
        if new_dir.exists() {
            return Err(format!("游戏 {} 已存在", new_name));
        }

        fs::rename(&old_dir, &new_dir).map_err(|e| format!("重命名失败: {}", e))?;

        let mut record = game;
        record.name = new_name.to_string();
        self.save_record(&record)?;

        log_info!("游戏重命名成功：{} -> {}", new_name, game_name);
        self.get_game(new_name)
            .ok_or_else(|| "重命名游戏后加载失败".to_string())
    }

    /// 更新游戏信息（名称、启用状态）
    pub fn update_game(
        &self,
        game_name: &str,
        name: Option<String>,
        enabled: Option<bool>,
    ) -> Result<Game, String> {
        let game = self
            .get_game(game_name)
            .ok_or_else(|| format!("游戏不存在: {}", game_name))?;

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

    /// 复制游戏（目录 + 记录），生成同名新实例
    ///
    /// 递归复制源游戏目录到新目录，并以源记录为新实例生成独立记录
    /// （仅更新 `name`，其余版本 / 加载器 / 设置沿用源游戏）。
    pub fn duplicate_game(
        &self,
        source_name: &str,
        new_name: &str,
    ) -> Result<Game, String> {
        validate_name(new_name)?;

        let source = self
            .get_game(source_name)
            .ok_or_else(|| format!("游戏不存在: {}", source_name))?;

        let old_dir = self.ctx.game_dir(&source.name);
        let new_dir = self.ctx.game_dir(new_name);
        if new_dir.exists() {
            return Err(format!("游戏 {} 已存在", new_name));
        }

        copy_dir_all(&old_dir, &new_dir).map_err(|e| format!("复制游戏目录失败: {}", e))?;

        // 移除新目录内残留的源记录文件，避免旧身份污染
        let old_record_name = self.ctx.record_path(&source.name);
        if let Some(file_name) = old_record_name.file_name() {
            let _ = fs::remove_file(new_dir.join(file_name));
        }

        let mut record = source;
        record.name = new_name.to_string();
        self.save_record(&record)?;

        log_info!("游戏已复制：{} -> {}", source_name, new_name);
        self.get_game(new_name)
            .ok_or_else(|| "复制游戏后加载失败".to_string())
    }

    // ==================== 游戏记录（原 storage 模块） ====================

    /// 加载游戏记录
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

    /// 保存游戏记录到磁盘
    pub fn save_record(&self, record: &Game) -> Result<(), String> {
        let rpath = self.ctx.record_path(&record.name);
        if let Some(parent) = rpath.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建游戏记录目录失败：{}", e))?;
        }
        let content =
            serde_json::to_string_pretty(record).map_err(|e| format!("序列化游戏记录失败：{}", e))?;
        fs::write(&rpath, content).map_err(|e| format!("写入游戏记录失败：{}", e))?;
        Ok(())
    }

    /// 删除游戏记录（仅删除记录文件，不影响游戏目录）
    fn delete_record(&self, game_name: &str) -> Result<(), String> {
        let rpath = self.ctx.record_path(game_name);
        fs::remove_file(rpath).map_err(|e| e.to_string())
    }

    /// 列出所有游戏记录文件路径（{root}/versions/{name}/.wecraft_{name}.json）
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

    /// 更新游戏游戏设置（DTO 增量应用）
    pub fn update_game_settings(
        &self,
        game_name: &str,
        settings: &GameSettings,
    ) -> Result<Game, String> {
        let mut record =
            self.load_record(game_name).ok_or_else(|| format!("游戏不存在：{}", game_name))?;
        record.apply_settings(settings);
        self.save_record(&record)?;
        self.get_game(game_name)
            .ok_or_else(|| format!("游戏不存在：{}", game_name))
    }

    // ==================== 版本扫描（原 layout 根级函数） ====================

    /// 扫描所有游戏目录，生成游戏列表
    /// 扫描路径：{game_root}/versions/
    ///
    /// 容错设计：不因记录缺失/损坏/下载中断而丢弃游戏目录——
    /// - 记录存在且合法：直接采用
    /// - 记录不存在（目录刚创建、记录未落盘）：以目录名重建基础记录
    /// - 记录损坏：同上（损坏记录被忽略，不阻塞扫描）
    /// - 下载半成品（有 jar/json 无完整文件）：纳入列表，版本取目录内候选
    /// - 空目录：纳入列表（version_id 可能为空，由前端提示未完成）
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
                if name.starts_with('.') {
                    continue;
                }

                // 记录缺失/损坏时重建基础记录（目录名即唯一事实源）
                let mut game = self.load_record(name).unwrap_or_else(|| {
                    Game::new(name, "", ModLoaderType::Vanilla, None, None)
                });
                game.name = name.to_string();

                // 版本推断：优先目录内实际存在的候选（jar/json 平放）
                let candidates = Self::collect_version_ids(&path);
                if !candidates.is_empty() {
                    if !candidates.contains(&game.version_id) {
                        game.version_id = candidates[0].clone();
                    }
                }

                // 损坏判定：记录版本但目录内缺失对应 jar（下载中断/文件被删），或空目录无任何产物
                if game.version_id.is_empty() {
                    game.broken = candidates.is_empty();
                } else {
                    game.broken = !path.join(format!("{}.jar", game.version_id)).is_file();
                }

                // 空壳判定：目录内除记录与图标外无任何文件（未下载的空壳）→ 前端直接不显示。
                // 在扫描阶段同步标记，避免等待异步校验造成"先显示后隐藏"闪烁
                game.empty = super::validator::is_game_dir_empty(&path);

                game.path = path.to_string_lossy().to_string();
                game.game_settings = Some((&game).into());
                games.push(game);
            }
        }

        games.sort_by(|a, b| b.created_at.cmp(&a.created_at).then_with(|| a.name.cmp(&b.name)));
        Ok(games)
    }

    /// 收集游戏目录内可识别的版本候选（jar/json 文件名，排除 client 与记录文件）
    fn collect_version_ids(dir: &Path) -> Vec<String> {
        let mut set = std::collections::BTreeSet::new();
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
                    continue;
                };
                if ext != "jar" && ext != "json" {
                    continue;
                }
                let Some(stem) = path.file_stem().and_then(|n| n.to_str()) else {
                    continue;
                };
                if stem == "client" || stem.starts_with(".wecraft") {
                    continue;
                }
                set.insert(stem.to_string());
            }
        }
        set.into_iter().collect()
    }

}

/// 校验游戏名称（非空、不含路径分隔符）
fn validate_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("游戏名称不能为空".to_string());
    }
    if name.contains('/') || name.contains('\\') || name.contains('\0') {
        return Err("游戏名称不能包含路径分隔符".to_string());
    }
    Ok(())
}

/// 递归复制目录（含子目录与文件）
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let target = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), &target)?;
        }
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
        // jar 平放后 scan 返回该游戏，版本与记录一致
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
    fn scan_resilient_without_record() {
        let gm = manager("no-record");
        // 目录存在但无记录（创建未落盘）：由 jar 推断版本
        fs::create_dir_all(gm.ctx.game_dir("orphan-game")).unwrap();
        fs::write(gm.ctx.game_dir("orphan-game").join("1.20.4.jar"), b"jar").unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "orphan-game");
        assert_eq!(games[0].version_id, "1.20.4");
    }

    #[test]
    fn scan_resilient_half_downloaded() {
        let gm = manager("half");
        // 下载半成品：只有版本 json 无 jar → 标记为损坏
        fs::create_dir_all(gm.ctx.game_dir("half-game")).unwrap();
        fs::write(gm.ctx.game_dir("half-game").join("1.21.json"), b"{}").unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "half-game");
        assert_eq!(games[0].version_id, "1.21");
        assert!(games[0].broken);
    }

    #[test]
    fn scan_resilient_corrupt_record() {
        let gm = manager("corrupt");
        gm.create_game("broken-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        fs::write(
            gm.ctx.record_path("broken-game"),
            b"{ this is not valid json",
        )
        .unwrap();
        fs::write(gm.ctx.game_dir("broken-game").join("1.21.jar"), b"jar").unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "broken-game");
        assert_eq!(games[0].version_id, "1.21");
    }

    #[test]
    fn scan_resilient_empty_dir() {
        let gm = manager("empty");
        // 空目录（刚开始创建）：仍纳入列表，version 为空且标记损坏
        fs::create_dir_all(gm.ctx.game_dir("fresh-game")).unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "fresh-game");
        assert!(games[0].version_id.is_empty());
        assert!(games[0].broken);
    }

    #[test]
    fn scan_marks_intact_version() {
        let gm = manager("intact");
        gm.create_game("good-game", "1.20.4", ModLoaderType::Vanilla, None, None)
            .unwrap();
        fs::write(gm.ctx.game_dir("good-game").join("1.20.4.jar"), b"jar").unwrap();
        let games = gm.scan_games().unwrap();
        assert_eq!(games.len(), 1);
        assert!(!games[0].broken);
    }

    #[test]
    fn scan_skips_hidden_dirs() {
        let gm = manager("hidden");
        fs::create_dir_all(gm.ctx.game_dir(".tmp-dir")).unwrap();
        assert!(gm.scan_games().unwrap().is_empty());
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