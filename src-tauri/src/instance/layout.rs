//! 实例/版本路径唯一事实源（Single Source of Truth）
//!
//! 所有"版本部署 / 扫描 / 已安装判定"必须经过本模块，
//! 禁止各模块自行拼接路径，避免出现三处目录真相。

use std::fs;
use std::path::{Path, PathBuf};

use crate::config;

/// 实例根目录：{base}/minecraft
pub fn instances_root() -> PathBuf {
    (*config::DEAMON_BASE_PATH).clone()
}

/// 实例目录：{root}/{instance_name}
pub fn instance_dir(instance_name: &str) -> PathBuf {
    instances_root().join(instance_name)
}

/// 实例内 versions 目录：{instance}/versions
pub fn instance_versions_dir(instance_name: &str) -> PathBuf {
    instance_dir(instance_name).join("versions")
}

/// 实例内版本目录：{instance}/versions/{version_id}
pub fn instance_version_dir(instance_name: &str, version_id: &str) -> PathBuf {
    instance_versions_dir(instance_name).join(version_id)
}

/// 任意游戏目录下的版本目录（标准 .minecraft 布局）：{game_dir}/versions/{version_id}
pub fn version_dir_in(game_dir: &Path, version_id: &str) -> PathBuf {
    game_dir.join("versions").join(version_id)
}

/// 任意游戏目录下的版本 jar：{game_dir}/versions/{version_id}/{version_id}.jar
pub fn version_jar_in_dir(game_dir: &Path, version_id: &str) -> PathBuf {
    version_dir_in(game_dir, version_id).join(format!("{}.jar", version_id))
}

/// 实例内版本 jar：{instance}/versions/{version_id}/{version_id}.jar
pub fn instance_version_jar(instance_name: &str, version_id: &str) -> PathBuf {
    version_jar_in_dir(&instance_dir(instance_name), version_id)
}

/// 全局版本目录：{base}/.minecraft/versions/{version_id}
pub fn global_version_dir(version_id: &str) -> PathBuf {
    (*config::VERSIONS_DIR).join(version_id)
}

/// 全局版本 jar：{base}/.minecraft/versions/{version_id}/{version_id}.jar
pub fn global_version_jar(version_id: &str) -> PathBuf {
    global_version_dir(version_id).join(format!("{}.jar", version_id))
}

/// 判定某版本 jar 是否存在于版本目录（{v}/{v}.jar 或 {v}/client.jar）
fn jar_exists_in(version_dir: &Path, version_id: &str) -> bool {
    version_dir.join(format!("{}.jar", version_id)).exists()
        || version_dir.join("client.jar").exists()
}

/// 判定版本是否已安装（实例内标准布局）
pub fn is_version_installed(instance_name: &str, version_id: &str) -> bool {
    jar_exists_in(&instance_version_dir(instance_name, version_id), version_id)
}

/// 扫描某个游戏目录下的已安装版本列表
pub fn scan_versions_in(game_dir: &Path) -> Vec<String> {
    let versions_dir = game_dir.join("versions");
    let mut versions = Vec::new();
    if let Ok(entries) = fs::read_dir(&versions_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
                continue;
            };
            if jar_exists_in(&path, name) {
                versions.push(name.to_string());
            }
        }
    }
    versions.sort();
    versions
}

/// 扫描单个实例的已安装版本
pub fn scan_instance_versions(instance_name: &str) -> Vec<String> {
    scan_versions_in(&instance_dir(instance_name))
}

/// 扫描全部已安装版本（所有实例 + 全局版本目录，去重排序）
pub fn scan_all_installed_versions() -> Vec<String> {
    let mut set = std::collections::BTreeSet::new();

    if let Ok(entries) = fs::read_dir(instances_root()) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                for v in scan_versions_in(&path) {
                    set.insert(v);
                }
            }
        }
    }

    // 全局版本目录（.minecraft/versions）
    for v in scan_versions_in(&*config::MINECRAFT_DIR) {
        set.insert(v);
    }

    set.into_iter().collect()
}
