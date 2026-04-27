use crate::download::Library;
use crate::log_info;
use sha1::{Digest, Sha1};
use std::fs;
use std::io::Read;

pub const CHUNK_SIZE: u64 = 4 * 1024 * 1024;
pub const MAX_CHUNKS: usize = 8;
pub const MAX_RETRIES: u32 = 3;

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

pub fn verify_file_sha1(path: &std::path::Path, expected_sha1: &str) -> Result<bool, String> {
    let actual_sha1 = calculate_file_sha1(path)?;
    let matches = actual_sha1.eq_ignore_ascii_case(expected_sha1);

    if !matches {
        log_info!("SHA1 校验失败: 期望 {} 实际 {}", expected_sha1, actual_sha1);
    }

    Ok(matches)
}

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

pub fn get_current_arch() -> &'static str {
    if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "aarch64") {
        "arm64"
    } else {
        "x86"
    }
}

pub fn should_use_library(library: &Library) -> bool {
    if library.rules.is_empty() {
        return true;
    }

    let mut allowed = true;
    for rule in &library.rules {
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
