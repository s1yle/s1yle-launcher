//! 窗口模块持久化层（Repository）
//!
//! 读写 `.wecraft.json` 的 `window` 顶层键。

use std::path::Path;
use crate::config_io;
use crate::window::models::{WindowPosition, WindowPositions};

/// 读取全部窗口位置
pub fn load_positions(config_path: &Path) -> WindowPositions {
    config_io::read_section(config_path, "window").unwrap_or_default()
}

/// 保存指定 label 的窗口位置
pub fn save_position(
    config_path: &Path,
    label: &str,
    pos: &WindowPosition,
) -> Result<(), String> {
    let mut positions = load_positions(config_path);
    match label {
        "main" => positions.main = Some(pos.clone()),
        _ => return Err(format!("未知窗口类型: {}", label)),
    }
    config_io::write_section(config_path, "window", &positions)
}

/// 读取指定 label 的窗口位置
pub fn load_position(config_path: &Path, label: &str) -> Option<WindowPosition> {
    let positions = load_positions(config_path);
    match label {
        "main" => positions.main,
        _ => None,
    }
}
