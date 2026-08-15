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

    /// 当前启动器启用的特性（对应 version.json 的 features 规则）：
    /// 未启用任何特性（is_demo_user / has_custom_resolution / is_quick_play_* 等均为 false），
    /// 因此规则声明某特性为 true 时不匹配、为 false 时匹配
    fn feature_state(_key: &str) -> bool {
        false
    }

    /// 单条规则是否命中（os 匹配 且 features 匹配），不命中则跳过该规则
    fn rules_match(rule: &Rule) -> bool {
        let os_match = match &rule.os {
            Some(os) => {
                let os_name_match =
                    os.name.as_ref().map_or(true, |n| n == get_current_os());
                let arch_match = os.arch.as_ref().map_or(true, |a| {
                    if a.contains("64") {
                        get_current_arch().contains("64")
                    } else {
                        !get_current_arch().contains("64")
                    }
                });
                os_name_match && arch_match
            }
            None => true,
        };

        let features_match = match &rule.features {
            Some(features) => features
                .iter()
                .all(|(key, want)| feature_state(key) == *want),
            None => true,
        };

        os_match && features_match
    }

    let mut matched_any = false;
    let mut allowed = true;
    for rule in rules {
        if !rules_match(rule) {
            continue;
        }
        matched_any = true;
        match rule.action.as_str() {
            "allow" => allowed = true,
            "disallow" => allowed = false,
            _ => {}
        }
    }

    // Mojang 语义：规则列表非空但一条都不匹配 → 不启用（如 osx-only 参数在 Linux 上必须剔除）
    if !matched_any {
        return false;
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
    fn rules_allow_no_match_returns_false() {
        // Mojang 语义：规则列表非空但全部不匹配（如 osx-only 参数在 Linux 上）→ 不启用
        let osx_rule = Rule {
            action: "allow".to_string(),
            features: None,
            os: Some(RuleOs {
                name: Some("osx".to_string()),
                version: None,
                version_range: None,
                arch: None,
            }),
        };
        let linux_rule = Rule {
            action: "allow".to_string(),
            features: None,
            os: Some(RuleOs {
                name: Some("linux".to_string()),
                version: None,
                version_range: None,
                arch: None,
            }),
        };

        let os = get_current_os();
        assert!(rules_allow(&[osx_rule.clone(), linux_rule.clone()]));
        if os == "osx" {
            assert!(rules_allow(&[osx_rule]));
        } else {
            assert!(!rules_allow(&[osx_rule]));
        }
    }

    #[test]
    fn rules_allow_features_state() {
        use std::collections::HashMap;

        let feature_rule = |action: &str, features: Option<HashMap<String, bool>>| Rule {
            action: action.to_string(),
            features,
            os: None,
        };

        // 未启用任何特性：要求 is_demo_user=true 的规则不匹配（跳过），无 os 的 disallow 同理
        assert!(rules_allow(&[feature_rule(
            "allow",
            Some(HashMap::from([("is_demo_user".to_string(), false)]))
        )]));
        assert!(!rules_allow(&[feature_rule(
            "disallow",
            Some(HashMap::from([("has_custom_resolution".to_string(), false)]))
        )]));

        // 声明特性为 true 的规则不命中（特性未启用）→ 规则列表无匹配 → 不生效
        assert!(!rules_allow(&[feature_rule(
            "disallow",
            Some(HashMap::from([("is_demo_user".to_string(), true)]))
        )]));
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
