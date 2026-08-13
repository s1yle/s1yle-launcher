//! 应用全局上下文（依赖注入容器）
//!
//! 作为 Tauri managed state 注入，命令通过 `State<'_, AppContext>` 获取。
//! 职责单一：只做"路径/目录的上下文信息提供者"，不承载业务逻辑。
//! 各管理器（GameManager/ConfigManager 等）在组合根（`run()`）处
//! 通过构造注入持有 `AppContext` 克隆，运行时共享同一份游戏根目录。
//!
//! ## 目录模型
//!
//! ```text
//! {game_root}/                    ← 游戏根目录（即 .minecraft 目录本身）
//! └── versions/
//!     └── {gameName}/             ← 游戏目录（= 版本目录，jar/json/natives 平放）
//!
//! {launcher_work_dir}/            ← 启动器工作目录（配置/日志）
//! └── .wecraft.json               ← 配置文件（含 game_dir 字段）
//! ```

use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// 应用全局上下文（依赖注入容器）
#[derive(Debug)]
pub struct AppContext {
    /// 启动器自身的工作目录（用于存放配置、日志等）
    launcher_work_dir: PathBuf,
    /// 当前游戏根目录（即 .minecraft 所在目录），可运行时切换
    game_root: Mutex<PathBuf>,
}

impl Clone for AppContext {
    /// 克隆上下文（内部锁值拷贝，各持有者共享同一份游戏根目录）
    fn clone(&self) -> Self {
        Self {
            launcher_work_dir: self.launcher_work_dir.clone(),
            game_root: Mutex::new(self.game_root()),
        }
    }
}

impl AppContext {
    /// 创建新上下文
    pub fn new(launcher_work_dir: PathBuf, game_root: PathBuf) -> Self {
        Self {
            launcher_work_dir,
            game_root: Mutex::new(game_root),
        }
    }

    // ==================== 目录相关 ====================

    /// 启动器工作目录
    pub fn launcher_work_dir(&self) -> &Path {
        &self.launcher_work_dir
    }

    /// 当前游戏根目录（即 .minecraft 目录本身）
    pub fn game_root(&self) -> PathBuf {
        self.game_root.lock().unwrap().clone()
    }

    /// 切换游戏根目录（运行时）
    pub fn set_game_root(&self, new_root: PathBuf) {
        *self.game_root.lock().unwrap() = new_root;
    }

    // ==================== 游戏根目录相关路径 ====================

    /// versions 目录：{root}/versions
    pub fn versions_dir(&self) -> PathBuf {
        self.game_root().join("versions")
    }

    /// 特定游戏目录（= 版本目录）：{root}/versions/{name}
    pub fn game_dir(&self, game_name: &str) -> PathBuf {
        self.versions_dir().join(game_name)
    }

    /// 实例记录文件：{game_dir}/.wecraft_{name}.json
    pub fn record_path(&self, game_name: &str) -> PathBuf {
        self.game_dir(game_name)
            .join(format!(".wecraft_{}.json", game_name))
    }

    /// 特定版本的 JSON 文件（平放）：{game_dir}/{version_id}.json
    pub fn version_json_path(&self, version_id: &str) -> PathBuf {
        self.game_dir(version_id).join(format!("{}.json", version_id))
    }

    /// 特定版本的 jar 文件（平放）：{game_dir}/{version_id}.jar
    pub fn version_jar_path(&self, version_id: &str) -> PathBuf {
        self.game_dir(version_id).join(format!("{}.jar", version_id))
    }

    /// 任意游戏目录下的版本 json：{game_dir}/{version_id}.json
    pub fn version_json_in_dir(&self, game_dir: &PathBuf, version_id: &str) -> PathBuf {
        game_dir.join(format!("{}.json", version_id))
    }

    /// 任意游戏目录下的版本 jar：{game_dir}/{version_id}.jar
    pub fn version_jar_in_dir(&self, game_dir: &PathBuf, version_id: &str) -> PathBuf {
        game_dir.join(format!("{}.jar", version_id))
    }

    /// 特定实例的 natives 解压目录：{root}/natives
    pub fn natives_dir(&self) -> PathBuf {
        self.game_root().join("natives")
    }

    /// assets 目录：{root}/assets
    pub fn assets_dir(&self) -> PathBuf {
        self.game_root().join("assets")
    }

    /// libraries 目录：{root}/libraries
    pub fn libraries_dir(&self) -> PathBuf {
        self.game_root().join("libraries")
    }

    /// 判定版本是否已安装（jar 平放于游戏目录）
    pub fn is_version_installed(&self, game_name: &str, version_id: &str) -> bool {
        self.jar_exists_in(
            &self.game_dir(game_name),
            version_id
        )
    }

    /// 判定某版本 jar 是否存在于游戏目录（{v}.jar 或 client.jar）
    pub fn jar_exists_in(&self, game_dir: &PathBuf, version_id: &str) -> bool {
        game_dir.join(format!("{}.jar", version_id)).exists()
            || game_dir.join("client.jar").exists()
    }

    // ==================== 启动器工作目录相关 ====================

    /// 配置文件：{work_dir}/.wecraft.json
    pub fn launcher_config_path(&self) -> PathBuf {
        self.launcher_work_dir.join(".wecraft.json")
    }

    /// 日志目录：{work_dir}/logs
    pub fn launcher_logs_dir(&self) -> PathBuf {
        self.launcher_work_dir.join("logs")
    }

    /// 确保基础目录存在（幂等）
    pub fn ensure_dirs(&self) -> Result<(), String> {
        for dir in [
            &self.game_root(),
        ] {
            std::fs::create_dir_all(dir)
                .map_err(|e| format!("创建目录失败 {}: {}", dir.display(), e))?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx() -> AppContext {
        AppContext::new(
            PathBuf::from("/tmp/launcher-work"),
            PathBuf::from("/tmp/game-root"),
        )
    }

    #[test]
    fn path_hierarchy_is_consistent() {
        let c = ctx();
        assert_eq!(c.game_root(), PathBuf::from("/tmp/game-root/"));
        assert_eq!(
            c.versions_dir(),
            PathBuf::from("/tmp/game-root/versions")
        );
        assert_eq!(
            c.game_dir("my-game"),
            PathBuf::from("/tmp/game-root/versions/my-game")
        );
        assert!(c.version_json_path("1.20.4").ends_with("1.20.4.json"));
        assert!(c.version_jar_path("1.20.4").ends_with("1.20.4.jar"));
        assert_eq!(
            c.record_path("my-game"),
            PathBuf::from("/tmp/game-root/versions/my-game/.wecraft_my-game.json")
        );
        assert_eq!(
            c.launcher_config_path(),
            PathBuf::from("/tmp/launcher-work/.wecraft.json")
        );
        assert_eq!(
            c.launcher_logs_dir(),
            PathBuf::from("/tmp/launcher-work/logs")
        );
    }

    #[test]
    fn set_game_root_switches_paths() {
        let c = ctx();
        c.set_game_root(PathBuf::from("/tmp/other-root"));
        assert_eq!(c.game_root(), PathBuf::from("/tmp/other-root"));
    }
}