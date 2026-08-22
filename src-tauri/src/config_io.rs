//! 配置 I/O 工具（纯函数，无状态）
//!
//! 读写 `.wecraft.json` 的指定顶层键，不影响其他键。
//! 每个业务模块通过本模块持久化自己的顶层键（game / window / background / accounts / java_cache / app）。

use std::path::Path;
use serde::{de::DeserializeOwned, Serialize};

/// 读取 `.wecraft.json` 中指定顶层键的值（文件缺失/损坏/键不存在时返回 None）
pub fn read_section<T: DeserializeOwned>(config_path: &Path, key: &str) -> Option<T> {
    let content = match std::fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(_) => return None,
    };
    let root: serde_json::Value =
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}));
    root.get(key).and_then(|v| serde_json::from_value(v.clone()).ok())
}

/// 写入 `.wecraft.json` 中指定顶层键的值（不影响其他键）
pub fn write_section<T: Serialize>(config_path: &Path, key: &str, value: &T) -> Result<(), String> {
    let val = serde_json::to_value(value).map_err(|e| format!("序列化配置节失败: {e}"))?;
    write_section_value(config_path, key, &val)
}

/// 写入原始 JSON Value 到指定顶层键
pub fn write_section_value(
    config_path: &Path,
    key: &str,
    value: &serde_json::Value,
) -> Result<(), String> {
    let mut root = read_raw(config_path);
    root[key] = value.clone();
    write_raw(config_path, &root)
}

/// 读取整个配置文件为 JSON Value（缺失/损坏返回空对象）
pub fn read_raw(path: &Path) -> serde_json::Value {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or(serde_json::json!({}))
}

/// 写入整个配置文件（保证目录存在）
pub fn write_raw(path: &Path, root: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {e}"))?;
    }
    let json = serde_json::to_string_pretty(root).map_err(|e| format!("序列化配置失败: {e}"))?;
    std::fs::write(path, json).map_err(|e| format!("写入配置文件失败: {e}"))
}
