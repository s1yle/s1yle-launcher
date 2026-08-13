use crate::download::{Library, Rule};
use crate::log_info;
use sha1::{Digest, Sha1};
use std::fs;
use std::io::Read;

/// 分块下载的块大小（4MB）
pub const CHUNK_SIZE: u64 = 4 * 1024 * 1024;
/// 最大并发分块数（BMCLAPI 短时限流约 10 次/60s，避免瞬间打满）
pub const MAX_CHUNKS: usize = 8;
/// 最大重试次数
pub const MAX_RETRIES: u32 = 3;

/// BMCLAPI 镜像映射（加速国内下载，失败时调用方自动回退官方源）
pub fn mirror_url(url: &str) -> Option<String> {
    const MIRROR: &str = "https://bmclapi2.bangbang93.com";
    const RULES: &[(&str, &str)] = &[
        ("https://libraries.minecraft.net/", "/libraries/"),
        ("https://resources.download.minecraft.net/", "/assets/"),
        ("https://piston-data.mojang.com/v1/objects/", "/objects/"),
        ("https://launcher.mojang.com/", "/mc/launcher/"),
        ("https://maven.fabricmc.net/", "/maven/"),
        ("https://files.minecraftforge.net/maven/", "/maven/"),
        ("https://meta.fabricmc.net/", "/fabric-meta/"),
    ];

    for (prefix, suffix) in RULES {
        if let Some(rest) = url.strip_prefix(prefix) {
            return Some(format!("{MIRROR}{suffix}{rest}"));
        }
    }
    None
}

/// 计算文件的 SHA1 哈希值
fn calculate_file_sha1(path: &std::path::Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| format!("打开文件失败: {}", e))?;

    let mut hasher = Sha1::new();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|e| format!("读取文件失败: {}", e))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    let result = hasher.finalize();
    Ok(hex::encode(result))
}

/// 验证文件的 SHA1 哈希值是否与期望值匹配
pub fn verify_file_sha1(path: &std::path::Path, expected_sha1: &str) -> Result<bool, String> {
    let actual_sha1 = calculate_file_sha1(path)?;
    let matches = actual_sha1.eq_ignore_ascii_case(expected_sha1);

    if !matches {
        log_info!("SHA1 校验失败: 期望 {} 实际 {}", expected_sha1, actual_sha1);
    }

    Ok(matches)
}

/// 获取当前操作系统名称（用于规则匹配）
pub fn get_current_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

/// 获取当前 CPU 架构（用于规则匹配）
pub fn get_current_arch() -> &'static str {
    if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "aarch64") {
        "arm64"
    } else {
        "x86"
    }
}

/// 判断库文件是否应在当前平台使用（根据规则列表）
pub fn should_use_library(library: &Library) -> bool {
    rules_allow(&library.rules)
}

/// 评估平台规则列表（用于库文件与启动参数）
pub fn rules_allow(rules: &[Rule]) -> bool {
    if rules.is_empty() {
        return true;
    }

    let mut allowed = true;
    for rule in rules {
        match rule.action.as_str() {
            "allow" => {
                if let Some(ref os) = rule.os {
                    let os_match = os.name.as_ref().map_or(true, |n| n == get_current_os());
                    let arch_match = os.arch.as_ref().map_or(true, |a| {
                        if a.contains("64") {
                            get_current_arch().contains("64")
                        } else {
                            !get_current_arch().contains("64")
                        }
                    });
                    if os_match && arch_match {
                        allowed = true;
                    }
                } else {
                    allowed = true;
                }
            }
            "disallow" => {
                if let Some(ref os) = rule.os {
                    let os_match = os.name.as_ref().map_or(true, |n| n == get_current_os());
                    let arch_match = os.arch.as_ref().map_or(true, |a| {
                        if a.contains("64") {
                            get_current_arch().contains("64")
                        } else {
                            !get_current_arch().contains("64")
                        }
                    });
                    if os_match && arch_match {
                        allowed = false;
                    }
                } else {
                    allowed = false;
                }
            }
            _ => {}
        }
    }
    allowed
}

/// 获取当前平台的原生库分类器名称
pub fn get_native_classifier(library: &Library) -> Option<(String, String)> {
    let natives = library.natives.as_ref()?;
    let os = get_current_os();
    let arch = get_current_arch();

    let native_key = match os {
        "windows" => {
            if arch == "x64" {
                "windows-x64"
            } else {
                "windows-x86"
            }
        }
        "osx" => "osx",
        "linux" => {
            if arch == "x64" {
                "linux-x64"
            } else if arch == "arm64" {
                "linux-arm64"
            } else {
                "linux-x86"
            }
        }
        _ => return None,
    };

    let classifier_suffix = natives.get(native_key)?;
    let classifier = format!("natives-{}-{}", os, classifier_suffix);
    Some((classifier, native_key.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::download::models::{Library, Rule, RuleOs};

    #[test]
    fn mirror_url_maps_known_prefixes() {
        let mapped = mirror_url("https://libraries.minecraft.net/foo/bar.jar").unwrap();
        assert_eq!(
            mapped,
            "https://bmclapi2.bangbang93.com/libraries/foo/bar.jar"
        );

        let mapped =
            mirror_url("https://resources.download.minecraft.net/ab/abc123").unwrap();
        assert_eq!(mapped, "https://bmclapi2.bangbang93.com/assets/ab/abc123");

        let mapped = mirror_url("https://launcher.mojang.com/mc/game/1.20.4/").unwrap();
        assert_eq!(
            mapped,
            "https://bmclapi2.bangbang93.com/mc/launcher/mc/game/1.20.4/"
        );
    }

    #[test]
    fn mirror_url_returns_none_for_unknown_prefix() {
        assert_eq!(mirror_url("https://example.com/file"), None);
    }

    #[test]
    fn verify_file_sha1_matches_and_mismatches() {
        let dir = std::env::temp_dir().join(format!("wecraft-utils-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join("data.bin");
        fs::write(&file, b"hello world").unwrap();

        let sha1 = calculate_file_sha1(&file).unwrap();
        assert_eq!(sha1, "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");
        assert!(verify_file_sha1(&file, &sha1).unwrap());
        assert!(
            !verify_file_sha1(&file, "0000000000000000000000000000000000000000").unwrap()
        );

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn rules_allow_empty_is_true() {
        assert!(rules_allow(&[]));
    }

    #[test]
    fn rules_allow_current_os() {
        let os = get_current_os();
        let rule = |action: &str| Rule {
            action: action.to_string(),
            features: None,
            os: Some(RuleOs {
                name: Some(os.to_string()),
                version: None,
                version_range: None,
                arch: None,
            }),
        };

        assert!(rules_allow(&[rule("allow")]));
        assert!(!rules_allow(&[rule("disallow")]));
    }

    #[test]
    fn get_native_classifier_detects_current_platform() {
        let native_key = match (get_current_os(), get_current_arch()) {
            ("windows", "x64") => "windows-x64",
            ("windows", _) => "windows-x86",
            ("osx", _) => "osx",
            ("linux", "x64") => "linux-x64",
            ("linux", "arm64") => "linux-arm64",
            ("linux", _) => "linux-x86",
            _ => return,
        };

        let mut natives = std::collections::HashMap::new();
        natives.insert(native_key.to_string(), "test".to_string());
        let library = Library {
            name: "test".to_string(),
            downloads: None,
            natives: Some(natives),
            rules: vec![],
            extract: None,
            extra: serde_json::Map::new(),
        };

        let (classifier, key) = get_native_classifier(&library).unwrap();
        assert_eq!(key, native_key);
        assert!(classifier.starts_with("natives-"));
    }
}
