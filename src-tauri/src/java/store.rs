//! Java 模块持久化层（Repository）
//!
//! 读写 `.wecraft.json` 的 `java_cache` 顶层键。

use std::path::Path;
use serde_json::Value;
use crate::config_io;
use crate::java::JavaInstallation;

/// 读取 Java 安装缓存
pub fn load_java_cache(config_path: &Path) -> Vec<JavaInstallation> {
    config_io::read_section(config_path, "java_cache").unwrap_or_default()
}

/// 写入 Java 安装缓存
pub fn save_java_cache(config_path: &Path, javas: &[JavaInstallation]) -> Result<(), String> {
    let value = serde_json::to_value(javas).map_err(|e| format!("序列化 java_cache 失败: {}", e))?;
    config_io::write_section_value(config_path, "java_cache", &value)
}
