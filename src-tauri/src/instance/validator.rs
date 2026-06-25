use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// 实例目录格式类型
///
/// 用于标识扫描到的 Minecraft 目录采用何种目录结构，
/// 决定兼容性评分与后续处理策略。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstanceFormat {
    /// WeCraft 原生格式（versions/ 下 jars + json）
    Native,
    /// 标准 Minecraft 目录（.minecraft 风格）
    StandardMinecraft,
    /// 自定义目录结构
    Custom,
    /// 无效目录（无法识别）
    Invalid,
}

/// 检测到的实例信息
///
/// 在目录扫描过程中发现的单个可识别版本。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedInstance {
    /// 版本名称
    pub name: String,
    /// 版本 ID
    pub version: String,
    /// 版本所在目录
    pub version_dir: PathBuf,
    /// 目录格式类型
    pub format: InstanceFormat,
}

/// 文件夹校验结果
///
/// 包含校验状态、检测到的实例列表、兼容性评分与警告信息。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderValidationResult {
    /// 是否为有效的 Minecraft 目录
    pub is_valid: bool,
    /// 目录绝对路径
    pub path: PathBuf,
    /// 建议的实例名称
    pub suggested_name: String,
    /// 检测到的实例列表
    pub instances: Vec<DetectedInstance>,
    /// 目录格式类型
    pub format: InstanceFormat,
    /// 兼容性评分（0-100）
    pub compatibility_score: u8,
    /// 警告信息列表
    pub warnings: Vec<String>,
}

/// 文件夹校验器
///
/// 检测给定路径是否为有效的 Minecraft 目录，
/// 支持原生格式和标准 .minecraft 格式的自动识别。
pub struct FolderValidator;

impl FolderValidator {
    /// 校验指定文件夹是否为有效的 Minecraft 目录
    ///
    /// 按优先级依次尝试 `detect_native_format` 和 `detect_standard_minecraft`，
    /// 返回包含所有检测结果和兼容性评分的校验结果。
    pub fn validate(folder_path: &PathBuf) -> FolderValidationResult {
        let mut result = FolderValidationResult {
            is_valid: false,
            path: folder_path.clone(),
            suggested_name: Self::extract_folder_name(folder_path),
            instances: Vec::new(),
            format: InstanceFormat::Invalid,
            compatibility_score: 0,
            warnings: Vec::new(),
        };

        if !folder_path.exists() || !folder_path.is_dir() {
            result.warnings.push("路径不存在或不是目录".to_string());
            return result;
        }

        let mut found_instances = Vec::new();

        if let Some(instances) = Self::detect_native_format(folder_path) {
            result.format = InstanceFormat::Native;
            result.compatibility_score = 100;
            found_instances.extend(instances);
        } else if let Some(instances) = Self::detect_standard_minecraft(folder_path) {
            result.format = InstanceFormat::StandardMinecraft;
            result.compatibility_score = 85;
            found_instances.extend(instances);
            result.warnings.push("检测到标准 Minecraft 目录结构".to_string());
        }

        result.instances = found_instances;
        result.is_valid = !result.instances.is_empty();
        result
    }

    fn extract_folder_name(path: &PathBuf) -> String {
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("自定义文件夹")
            .to_string()
    }

    fn detect_native_format(base: &PathBuf) -> Option<Vec<DetectedInstance>> {
        let versions_dir = base.join("versions");
        if !versions_dir.is_dir() {
            return None;
        }

        let mut instances = Vec::new();

        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        let jar_path = path.join(format!("{}.jar", name));
                        let json_path = path.join(format!("{}.json", name));

                        if jar_path.exists() && json_path.exists() {
                            instances.push(DetectedInstance {
                                name: name.to_string(),
                                version: name.to_string(),
                                version_dir: path,
                                format: InstanceFormat::Native,
                            });
                        }
                    }
                }
            }
        }

        if instances.is_empty() { None } else { Some(instances) }
    }

    fn detect_standard_minecraft(base: &PathBuf) -> Option<Vec<DetectedInstance>> {
        let versions_dir = if base.ends_with(".minecraft") || base.join("versions").is_dir() {
            base.clone()
        } else {
            base.join("versions")
        };

        if !versions_dir.is_dir() {
            return None;
        }

        let mut instances = Vec::new();

        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        let jar_path = path.join(format!("{}.jar", name));

                        if jar_path.exists() {
                            instances.push(DetectedInstance {
                                name: name.to_string(),
                                version: name.to_string(),
                                version_dir: path,
                                format: InstanceFormat::StandardMinecraft,
                            });
                        }
                    }
                }
            }
        }

        if instances.is_empty() { None } else { Some(instances) }
    }
}
