//! 背景模块持久化层（Repository）
//!
//! 背景配置统一存于 `.wecraft.json` 的 `app.background`（与应用其他配置同节），
//! 避免再出现顶层 `background` 键导致读写位置不一致。

use std::path::Path;
use serde_json::Value;
use crate::config_io;

/// 读取背景配置（JSON Value）
///
/// 优先读 `app.background`；若为空则回退到历史遗留的顶层 `background` 键（兼容迁移）。
pub fn load_background(config_path: &Path) -> Option<Value> {
    let root = config_io::read_raw(config_path);
    let from_app = root
        .get("app")
        .and_then(|a| a.get("background"))
        .cloned();
    if let Some(v) = from_app {
        if !v.is_null() {
            return Some(v);
        }
    }
    // 兼容：旧版本写入的顶层 `background`
    root.get("background").cloned()
}

/// 写入背景配置（仅更新 `app.background`，保留 `app` 节其它字段）
///
/// 注意：`app` 节实际为 `SystemConfig`（含 game_folders / window_positions /
/// game_settings），若整体覆盖会丢失这些字段，故此处只写入 `background` 子键。
pub fn save_background(config_path: &Path, bg: &Value) -> Result<(), String> {
    let mut root = config_io::read_raw(config_path);
    if root.get("app").is_none() || !root["app"].is_object() {
        root["app"] = serde_json::json!({});
    }
    root["app"]["background"] = bg.clone();
    config_io::write_raw(config_path, &root)
}
