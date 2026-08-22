//! 游戏模块持久化层（Repository）
//!
//! 读写 `.wecraft.json` 的 `game` 顶层键（game_root / folders / global_settings）。
//! 纯 I/O，不含业务逻辑。

use std::path::Path;
use crate::config_io;
use crate::shared::models::GamePersist;

/// 读取游戏持久化数据
pub fn load(config_path: &Path) -> GamePersist {
    config_io::read_section(config_path, "game").unwrap_or_default()
}

/// 写入游戏持久化数据（覆盖整个 game 节）
pub fn save(config_path: &Path, data: &GamePersist) -> Result<(), String> {
    config_io::write_section(config_path, "game", data)
}
