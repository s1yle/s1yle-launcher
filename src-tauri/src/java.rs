use serde::Serialize;
use std::path::PathBuf;

// 新增文件 src-tauri/src/java.rs
//
//          #[derive(Serialize, Clone, Debug)]
//          pub struct JavaInstallation {
//              pub path: String,          // java 可执行文件绝对路径
//              pub version: String,       // 完整版本号 "17.0.1"
//              pub vendor: String,        // "OpenJDK" / "Oracle" / etc
//          }
//
//          // Tauri 命令 1: 扫描系统 Java 安装
//          #[tauri::command]
//          pub async fn scan_java_installations() -> Result<Vec<JavaInstallation>, String>
//
//          // Tauri 命令 2: 获取指定 Java 路径的版本信息
//          #[tauri::command]
//          pub async fn get_java_version(path: String) -> Result<JavaInstallation, String>
//
// ┌──────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │平台                                      │扫描来源                                                                                                                                   │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │通用                                      │PATH 中的 java/java.exe、JAVA_HOME 环境变量                                                                                                │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │Linux                                     │/usr/lib/jvm/*/bin/java、/usr/lib/java/*/bin/java、/usr/java/*/bin/java、alternatives --list                                               |
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │macOS                                     │/Library/Java/JavaVirtualMachines/*/Contents/Home/bin/java、/usr/libexec/java_home                                                         │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │Windows                                   │注册表 HKLM\SOFTWARE\JavaSoft\*、Program Files\Java\*、Program Files (x86)\Java\*                                                          │
// └──────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

/// Java 安装信息结构体
#[derive(Serialize, Clone, Debug)]
pub struct JavaInstallation {
    /// Java 可执行文件的绝对路径
    pub path: PathBuf,
    /// 完整版本号，如 "17.0.1"
    pub version: String,
    /// 发行商，如 "OpenJDK"、"Oracle"
    pub vendor: String,
    /// 是否为 JDK（而非 JRE）
    pub is_jdk: bool,
}

/// 从 java -version 输出中解析版本信息
fn parse_java_version_output(stderr: &str) -> (String, String) {
    use regex::Regex;

    let version_reg = Regex::new(r#"version "(\d+(?:\.\d+)+(?:_\d+)?)""#).ok();
    let version = version_reg
        .and_then(|re| re.captures(stderr).and_then(|cap| cap.get(1)))
        .map(|m| m.as_str().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let vendor_reg = Regex::new(r"Runtime Environment \(([^)]+)\)").ok();
    let vendor = vendor_reg
        .and_then(|re| re.captures(stderr).and_then(|cap| cap.get(1)))
        .map(|m| m.as_str().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    (version, vendor)
}

/// 检测指定路径是否为 JDK
#[cfg(target_os = "windows")]
fn is_jdk_at_path(java_home: &PathBuf) -> bool {
    java_home.join("bin").join("javac.exe").exists()
}

#[cfg(not(target_os = "windows"))]
fn is_jdk_at_path(java_home: &PathBuf) -> bool {
    java_home.join("bin").join("javac").exists()
}

/// 获取 java 可执行文件名
#[cfg(target_os = "windows")]
const _JAVA_EXECUTABLE: &str = "java.exe";

#[cfg(not(target_os = "windows"))]
const _JAVA_EXECUTABLE: &str = "java";

// =============================================================================
// Linux 平台实现
// =============================================================================

#[cfg(target_os = "linux")]
fn scan_java_impl() -> Result<Vec<JavaInstallation>, String> {
    use std::fs;
    use std::fs::symlink_metadata;
    use std::process::Command;

    const USR_LIB_JVM: &str = "/usr/lib/jvm/";
    const USR_LIB_JAVA: &str = "/usr/lib/java/";
    const USR_JAVA: &str = "/usr/java";

    let mut javas: Vec<JavaInstallation> = Vec::new();
    let linux_java_paths = [USR_LIB_JVM, USR_LIB_JAVA, USR_JAVA];

    for path in linux_java_paths {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let entry_path = entry.path();
                let metadata = match symlink_metadata(&entry_path) {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                // 跳过符号链接
                if metadata.is_symlink() {
                    continue;
                }

                let bin_path = entry_path.join("bin");
                let is_jdk = bin_path.join("javac").is_file();
                let java_exe = bin_path.join("java");

                if !java_exe.is_file() {
                    continue;
                }

                let output = match Command::new(&java_exe).arg("-version").output() {
                    Ok(out) => out,
                    Err(_) => continue,
                };

                let stderr = String::from_utf8_lossy(&output.stderr);
                let (version, vendor) = parse_java_version_output(&stderr);

                javas.push(JavaInstallation {
                    path: java_exe,
                    version,
                    vendor,
                    is_jdk,
                });
            }
        }
    }

    if javas.is_empty() {
        Err("Linux 下未扫描到 Java 安装".to_string())
    } else {
        Ok(javas)
    }
}

// =============================================================================
// Windows 平台实现
// =============================================================================

#[cfg(target_os = "windows")]
fn scan_java_impl() -> Result<Vec<JavaInstallation>, String> {
    use std::collections::HashSet;
    use std::fs;
    use std::process::Command;
    use windows::{
        Win32::Foundation::ERROR_SUCCESS,
        Win32::System::Registry::{
            HKEY_LOCAL_MACHINE, KEY_READ, RegCloseKey, RegEnumKeyExW, RegOpenKeyExW,
            RegQueryValueExW,
        },
        core::PCWSTR,
    };

    let mut javas: Vec<JavaInstallation> = Vec::new();
    let mut seen_paths: HashSet<PathBuf> = HashSet::new();

    // 辅助闭包：获取 Java 信息并添加到列表
    let mut add_java = |java_path: PathBuf| {
        if !java_path.exists() || seen_paths.contains(&java_path) {
            return;
        }

        let output = match Command::new(&java_path).arg("-version").output() {
            Ok(out) => out,
            Err(_) => return,
        };

        let stderr = String::from_utf8_lossy(&output.stderr);
        let (version, vendor) = parse_java_version_output(&stderr);

        let java_home = java_path
            .parent()
            .and_then(|p| p.parent())
            .unwrap_or(&java_path)
            .to_path_buf();
        let is_jdk = is_jdk_at_path(&java_home);

        seen_paths.insert(java_path.clone());
        javas.push(JavaInstallation {
            path: java_path,
            version,
            vendor,
            is_jdk,
        });
    };

    // 1. 从注册表 HKLM\SOFTWARE\JavaSoft 读取
    let registry_path: Vec<u16> = "SOFTWARE\\JavaSoft"
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    let mut hkey = std::mem::MaybeUninit::uninit();
    let result = unsafe {
        RegOpenKeyExW(
            HKEY_LOCAL_MACHINE,
            PCWSTR::from_raw(registry_path.as_ptr()),
            Some(0u32),
            KEY_READ,
            hkey.as_mut_ptr(),
        )
    };

    if result == ERROR_SUCCESS {
        let hkey = unsafe { hkey.assume_init() };
        let mut index: u32 = 0;

        loop {
            let mut key_name = [0u16; 256];
            let mut cb_name: u32 = key_name.len() as u32;

            let result = unsafe {
                RegEnumKeyExW(
                    hkey,
                    index,
                    Some(windows::core::PWSTR::from_raw(key_name.as_mut_ptr())),
                    &mut cb_name,
                    None,
                    None,
                    None,
                    None,
                )
            };

            if result != ERROR_SUCCESS {
                break;
            }

            let subkey_name = String::from_utf16_lossy(&key_name[..cb_name as usize]);

            // 尝试读取子键的 JavaHome 值
            let java_home_path: Vec<u16> =
                format!("SOFTWARE\\JavaSoft\\{}\\CurrentVersion", subkey_name)
                    .encode_utf16()
                    .chain(std::iter::once(0))
                    .collect();

            let mut sub_hkey = std::mem::MaybeUninit::uninit();
            let sub_result = unsafe {
                RegOpenKeyExW(
                    HKEY_LOCAL_MACHINE,
                    PCWSTR::from_raw(java_home_path.as_ptr()),
                    Some(0u32),
                    KEY_READ,
                    sub_hkey.as_mut_ptr(),
                )
            };

            if sub_result == ERROR_SUCCESS {
                let sub_hkey = unsafe { sub_hkey.assume_init() };
                let mut data = [0u8; 512];
                let mut cb_data: u32 = data.len() as u32;
                let value_name: Vec<u16> = "JavaHome"
                    .encode_utf16()
                    .chain(std::iter::once(0))
                    .collect();

                let query_result = unsafe {
                    RegQueryValueExW(
                        sub_hkey,
                        PCWSTR::from_raw(value_name.as_ptr()),
                        None,
                        None,
                        Some(data.as_mut_ptr()),
                        Some(&mut cb_data),
                    )
                };

                if query_result == ERROR_SUCCESS {
                    // 解析 UTF-16 字符串
                    let java_home = String::from_utf16_lossy(
                        &data[..cb_data as usize]
                            .chunks(2)
                            .map(|chunk| {
                                if chunk.len() == 2 {
                                    u16::from_le_bytes([chunk[0], chunk[1]])
                                } else {
                                    0
                                }
                            })
                            .take_while(|&c| c != 0)
                            .collect::<Vec<_>>(),
                    );

                    let java_exe = PathBuf::from(&java_home).join("bin").join("java.exe");
                    add_java(java_exe);
                }

                let _ = unsafe { RegCloseKey(sub_hkey) };
            }

            index += 1;
        }

        let _ = unsafe { RegCloseKey(hkey) };
    }

    // 2. 扫描 Program Files\Java 目录
    let program_files =
        std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)")
        .unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());

    for pf in [program_files, program_files_x86] {
        let java_dir = PathBuf::from(pf).join("Java");
        if let Ok(entries) = fs::read_dir(&java_dir) {
            for entry in entries.filter_map(|e| e.ok()) {
                let java_exe = entry.path().join("bin").join("java.exe");
                add_java(java_exe);
            }
        }
    }

    // 3. 检查 JAVA_HOME 环境变量
    if let Ok(java_home) = std::env::var("JAVA_HOME") {
        let java_exe = PathBuf::from(&java_home).join("bin").join("java.exe");
        add_java(java_exe);
    }

    // 4. 检查 PATH 中的 java.exe
    if let Ok(path_var) = std::env::var("PATH") {
        for path in std::env::split_paths(&path_var) {
            let java_exe = path.join("java.exe");
            add_java(java_exe);
        }
    }

    if javas.is_empty() {
        Err("Windows 下未扫描到 Java 安装".to_string())
    } else {
        Ok(javas)
    }
}

// =============================================================================
// Tauri 命令
// =============================================================================

/// 扫描系统上所有可用的 Java 安装
#[tauri::command]
pub fn scan_java_installations() -> Result<Vec<JavaInstallation>, String> {
    scan_java_impl()
}

/// 获取指定 Java 路径的版本信息
#[tauri::command]
pub async fn get_java_version(path: String) -> Result<JavaInstallation, String> {
    use std::process::Command;

    let java_path = PathBuf::from(&path);
    if !java_path.exists() {
        return Err(format!("路径不存在: {}", path));
    }

    let output = Command::new(&java_path)
        .arg("-version")
        .output()
        .map_err(|e| format!("执行 java -version 失败: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let (version, vendor) = parse_java_version_output(&stderr);

    let java_home = java_path
        .parent()
        .and_then(|p| p.parent())
        .unwrap_or(&java_path)
        .to_path_buf();
    let is_jdk = is_jdk_at_path(&java_home);

    Ok(JavaInstallation {
        path: java_path,
        version,
        vendor,
        is_jdk,
    })
}

/// 选择 Java 可执行文件（系统文件选择器）
#[tauri::command]
pub async fn select_java_path(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog().file().pick_file(move |path| {
        let path_str = path.and_then(|p| p.as_path().map(|p| p.to_string_lossy().to_string()));
        let _ = tx.send(path_str);
    });

    // 在 tokio 中等待通道
    match tokio::task::block_in_place(|| rx.recv()) {
        Ok(result) => Ok(result),
        Err(_) => Err("通道接收失败".to_string()),
    }
}

// =============================================================================
// 测试
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_java_version_output() {
        let sample = r#"openjdk version "17.0.1" 2021-10-19
                OpenJDK Runtime Environment (Build 17.0.1+12)
                OpenJDK 64-Bit Server VM (Build 17.0.1+12, mixed mode)"#;

        let (version, vendor) = parse_java_version_output(sample);
        assert_eq!(version, "17.0.1");
        assert_eq!(vendor, "Build 17.0.1+12");
    }

    #[test]
    fn test_scan_java() {
        match scan_java_impl() {
            Ok(javas) => {
                println!("Java 安装数量: {}", javas.len());
                for java in javas {
                    println!(
                        "  - path: {:?}, version: {}, vendor: {}, is_jdk: {}",
                        java.path, java.version, java.vendor, java.is_jdk
                    );
                }
            }
            Err(e) => println!("未找到 Java: {}", e),
        }
    }
}
