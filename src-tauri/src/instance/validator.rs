use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstanceFormat {
    Native,
    StandardMinecraft,
    Custom,
    Invalid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedInstance {
    pub name: String,
    pub version: String,
    pub version_dir: PathBuf,
    pub format: InstanceFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderValidationResult {
    pub is_valid: bool,
    pub path: PathBuf,
    pub suggested_name: String,
    pub instances: Vec<DetectedInstance>,
    pub format: InstanceFormat,
    pub compatibility_score: u8,
    pub warnings: Vec<String>,
}

pub struct FolderValidator;

impl FolderValidator {
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
