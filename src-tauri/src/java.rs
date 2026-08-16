use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::app_context::AppContext;
use crate::config::ConfigManager;
use tauri::State;

// 扫描策略（对齐 PCL 四层搜索源）：
// 1. 缓存：读取 .wecraft.json 的 java_cache 节，缓存仍有效则直接返回
// 2. 注册表：HKLM\SOFTWARE\JavaSoft（64 位）与 WOW6432Node（32 位）下的
//    Java Runtime Environment / JDK / Java Development Kit 版本子键 JavaHome
// 3. 环境变量：JAVA_HOME / JDK_HOME / JRE_HOME 与 PATH（进程环境 + 系统/用户注册表兜底），
//    PATH 条目既按 bin 目录也按 JDK/JRE 根目录探测
// 4. 预设目录递归：Program Files(x86)\Java、{game_root}\runtime、启动器 runtime、游戏实例目录
// 候选路径统一经 java -version 校验，解析主版本号与 64 位标记，按 Java Home 目录去重。

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
    /// 主版本号（8 / 11 / 17 / 21 ...）
    pub major_version: u32,
    /// 是否为 64 位
    pub is_64bit: bool,
}

/// java -version 解析结果（内部使用）
#[derive(Default, Clone)]
struct JavaVersionInfo {
    version: String,
    vendor: String,
    major_version: u32,
    is_64bit: bool,
}

/// 从完整版本号解析主版本号（Java 8 报告 "1.8.0_xxx" → 8）
fn parse_major_version(version: &str) -> u32 {
    if let Some(rest) = version.strip_prefix("1.") {
        rest.split('.')
            .next()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0)
    } else {
        version
            .split('.')
            .next()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0)
    }
}

/// 从 java -version 输出中解析版本信息
fn parse_java_version_output(stderr: &str) -> JavaVersionInfo {
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

    JavaVersionInfo {
        major_version: parse_major_version(&version),
        is_64bit: stderr.contains("64-Bit"),
        version,
        vendor,
    }
}

/// 检测指定路径是否为 JDK
#[cfg(target_os = "windows")]
fn is_jdk_at_path(java_home: &Path) -> bool {
    java_home.join("bin").join("javac.exe").exists()
}

#[cfg(not(target_os = "windows"))]
fn is_jdk_at_path(java_home: &Path) -> bool {
    java_home.join("bin").join("javac").exists()
}

/// 校验候选 java 可执行文件：存在 + java -version 可运行，返回封装后的安装信息
fn probe_java(java_path: &Path) -> Option<JavaInstallation> {
    if !java_path.exists() {
        return None;
    }

    let output = Command::new(java_path).arg("-version").output().ok()?;
    let stderr = String::from_utf8_lossy(&output.stderr);
    let info = parse_java_version_output(&stderr);

    let java_home = java_path.parent()?.parent()?;
    let is_jdk = is_jdk_at_path(java_home);

    Some(JavaInstallation {
        path: java_path.to_path_buf(),
        version: info.version,
        vendor: info.vendor,
        is_jdk,
        major_version: info.major_version,
        is_64bit: info.is_64bit,
    })
}

// =============================================================================
// Linux 平台实现
// =============================================================================

#[cfg(target_os = "linux")]
fn scan_java_impl(_ctx: &AppContext) -> Result<Vec<JavaInstallation>, String> {
    use std::collections::HashSet;
    use std::fs;
    use std::fs::symlink_metadata;

    const USR_LIB_JVM: &str = "/usr/lib/jvm/";
    const USR_LIB_JAVA: &str = "/usr/lib/java/";
    const USR_JAVA: &str = "/usr/java";

    let mut javas: Vec<JavaInstallation> = Vec::new();
    let mut seen: HashSet<PathBuf> = HashSet::new();
    let linux_java_paths = [USR_LIB_JVM, USR_LIB_JAVA, USR_JAVA];

    for path in linux_java_paths {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let entry_path = entry.path();
                let metadata = match symlink_metadata(&entry_path) {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                if metadata.is_symlink() {
                    continue;
                }

                let java_exe = entry_path.join("bin").join("java");
                if !java_exe.is_file() {
                    continue;
                }

                let home = entry_path.canonicalize().unwrap_or(entry_path);
                if !seen.insert(home) {
                    continue;
                }

                if let Some(info) = probe_java(&java_exe) {
                    javas.push(info);
                }
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
fn reg_open(hkey: windows::Win32::System::Registry::HKEY, subkey: &str) -> Option<windows::Win32::System::Registry::HKEY> {
    use windows::Win32::System::Registry::{RegOpenKeyExW, KEY_READ};
    use windows::core::PCWSTR;

    let path: Vec<u16> = subkey.encode_utf16().chain(std::iter::once(0)).collect();
    let mut out = std::mem::MaybeUninit::uninit();
    let result = unsafe {
        RegOpenKeyExW(
            hkey,
            PCWSTR::from_raw(path.as_ptr()),
            Some(0u32),
            KEY_READ,
            out.as_mut_ptr(),
        )
    };
    if result.is_ok() {
        Some(unsafe { out.assume_init() })
    } else {
        None
    }
}

#[cfg(target_os = "windows")]
fn reg_read_string(hkey: windows::Win32::System::Registry::HKEY, value_name: &str) -> Option<String> {
    use windows::Win32::System::Registry::RegQueryValueExW;
    use windows::core::PCWSTR;

    let value: Vec<u16> = value_name.encode_utf16().chain(std::iter::once(0)).collect();

    // 先查询所需缓冲区字节数（UTF-16，含结尾空字符）；PATH 等环境变量可能超过 1KB，需动态分配
    let mut cb_data: u32 = 0;
    let result = unsafe {
        RegQueryValueExW(
            hkey,
            PCWSTR::from_raw(value.as_ptr()),
            None,
            None,
            None,
            Some(&mut cb_data),
        )
    };
    if result.is_err() {
        return None;
    }

    let mut data: Vec<u16> = vec![0u16; (cb_data as usize / 2).max(1) + 1];
    let mut actual: u32 = cb_data;
    let result = unsafe {
        RegQueryValueExW(
            hkey,
            PCWSTR::from_raw(value.as_ptr()),
            None,
            None,
            Some(data.as_mut_ptr() as *mut u8),
            Some(&mut actual),
        )
    };
    if result.is_err() {
        return None;
    }

    let len = (actual as usize / 2).min(data.len());
    Some(
        data[..len]
            .iter()
            .take_while(|&&c| c != 0)
            .map(|&c| char::from_u32(c as u32).unwrap_or('\u{FFFD}'))
            .collect(),
    )
}

/// 读取环境变量值：进程环境 + 系统/用户注册表兜底。
///
/// 进程启动后用户在「系统属性 → 环境变量」中新增/修改的 PATH、JAVA_HOME 等
/// 不会反映到已运行进程的环境快照里，因此额外读取注册表（HKLM 系统变量、
/// HKCU 用户变量）。注册表值名不区分大小写，同一来源的值去重后合并返回。
#[cfg(target_os = "windows")]
fn collect_env_var_values(name: &str) -> Vec<String> {
    use windows::Win32::System::Registry::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, RegCloseKey};

    let mut values = Vec::new();
    if let Ok(v) = std::env::var(name) {
        values.push(v);
    }

    for (hkey, subkey) in [
        (
            HKEY_LOCAL_MACHINE,
            "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment",
        ),
        (HKEY_CURRENT_USER, "Environment"),
    ] {
        if let Some(k) = reg_open(hkey, subkey) {
            if let Some(v) = reg_read_string(k, name) {
                if !v.is_empty() && !values.contains(&v) {
                    values.push(v);
                }
            }
            let _ = unsafe { RegCloseKey(k) };
        }
    }

    values
}

#[cfg(target_os = "windows")]
fn reg_enum_subkeys(hkey: windows::Win32::System::Registry::HKEY) -> Vec<String> {
    use windows::Win32::System::Registry::RegEnumKeyExW;
    use windows::core::PWSTR;

    let mut names = Vec::new();
    let mut index: u32 = 0;
    loop {
        let mut name = [0u16; 256];
        let mut cb_name: u32 = name.len() as u32;
        let result = unsafe {
            RegEnumKeyExW(
                hkey,
                index,
                Some(PWSTR::from_raw(name.as_mut_ptr())),
                &mut cb_name,
                None,
                None,
                None,
                None,
            )
        };
        if result.is_err() {
            break;
        }
        names.push(String::from_utf16_lossy(&name[..cb_name as usize]));
        index += 1;
    }
    names
}

/// 遍历注册表（64 位 + WOW6432Node 32 位视图），返回 JavaHome 列表
#[cfg(target_os = "windows")]
fn scan_registry_java_homes() -> Vec<PathBuf> {
    use windows::Win32::System::Registry::{RegCloseKey, HKEY_LOCAL_MACHINE};

    let mut homes = Vec::new();
    let bases = ["SOFTWARE\\JavaSoft", "SOFTWARE\\WOW6432Node\\JavaSoft"];

    for base in bases {
        let Some(base_key) = reg_open(HKEY_LOCAL_MACHINE, base) else {
            continue;
        };

        if let Some(h) = reg_read_string(base_key, "JavaHome") {
            homes.push(PathBuf::from(h));
        }

        for sub in ["Java Runtime Environment", "JDK", "Java Development Kit"] {
            let Some(env_key) = reg_open(base_key, sub) else {
                continue;
            };
            for version_key in reg_enum_subkeys(env_key) {
                let Some(vk) = reg_open(env_key, &version_key) else {
                    continue;
                };
                if let Some(h) = reg_read_string(vk, "JavaHome") {
                    homes.push(PathBuf::from(h));
                }
                let _ = unsafe { RegCloseKey(vk) };
            }
            let _ = unsafe { RegCloseKey(env_key) };
        }
        let _ = unsafe { RegCloseKey(base_key) };
    }

    homes
}

/// 递归向下查找 bin/java.exe / bin/javaw.exe（depth 限制深度，命中即返回）
#[cfg(target_os = "windows")]
fn scan_dir_recursive(dir: &Path, depth: u32, out: &mut Vec<PathBuf>) {
    use std::fs;

    if depth == 0 {
        return;
    }

    let bin = dir.join("bin");
    for name in ["java.exe", "javaw.exe"] {
        let exe = bin.join(name);
        if exe.is_file() {
            out.push(exe);
            return;
        }
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let p = entry.path();
            if p.is_dir() {
                scan_dir_recursive(&p, depth - 1, out);
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn scan_java_impl(ctx: &AppContext) -> Result<Vec<JavaInstallation>, String> {
    use std::collections::HashSet;
    use std::fs;

    let mut javas: Vec<JavaInstallation> = Vec::new();
    let mut seen_homes: HashSet<PathBuf> = HashSet::new();

    let mut add_java = |java_path: PathBuf| {
        let home = java_path
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.canonicalize().unwrap_or_else(|_| p.to_path_buf()))
            .unwrap_or_else(|| java_path.clone());
        if !seen_homes.insert(home) {
            return;
        }
        if let Some(info) = probe_java(&java_path) {
            javas.push(info);
        }
    };

    // 1. 注册表（64 位 + WOW6432Node 32 位视图）
    for home in scan_registry_java_homes() {
        add_java(home.join("bin").join("java.exe"));
    }

    // 2. 环境变量（进程环境 + 系统/用户注册表）
    //    HOME 类：JAVA_HOME / JDK_HOME / JRE_HOME → {home}\bin\java.exe
    //    PATH 类：每个条目可能是 bin 目录，也可能是 JDK/JRE 根目录，两者都探测
    for home_var in ["JAVA_HOME", "JDK_HOME", "JRE_HOME"] {
        for value in collect_env_var_values(home_var) {
            add_java(PathBuf::from(&value).join("bin").join("java.exe"));
        }
    }
    for value in collect_env_var_values("PATH") {
        for entry in std::env::split_paths(&value) {
            add_java(entry.join("java.exe"));
            add_java(entry.join("bin").join("java.exe"));
        }
    }

    // 3. 预设目录递归扫描（兜底：绿色版 / 便携版 / 整合包内置 Java）
    let program_files =
        std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)")
        .unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());

    let mut candidates: Vec<PathBuf> = Vec::new();
    for pf in [&program_files, &program_files_x86] {
        scan_dir_recursive(&PathBuf::from(pf).join("Java"), 4, &mut candidates);
    }
    scan_dir_recursive(&ctx.game_root().join("runtime"), 4, &mut candidates);
    scan_dir_recursive(&ctx.launcher_work_dir().join("runtime"), 4, &mut candidates);

    if let Ok(entries) = fs::read_dir(ctx.versions_dir()) {
        for entry in entries.filter_map(|e| e.ok()) {
            if !entry.path().is_dir() {
                continue;
            }
            scan_dir_recursive(&entry.path().join("runtime"), 4, &mut candidates);
            scan_dir_recursive(&entry.path(), 2, &mut candidates);
        }
    }

    for c in candidates {
        add_java(c);
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

/// 扫描系统上所有可用的 Java 安装（缓存优先，缓存失效才全量扫描）
#[tauri::command]
pub fn scan_java_installations(
    ctx: State<'_, AppContext>,
    config: State<'_, ConfigManager>,
) -> Result<Vec<JavaInstallation>, String> {
    // 1. 缓存优先：上一轮扫描成功的路径仍有效则直接返回
    let cache: Vec<PathBuf> = config.read_section("java_cache").unwrap_or_default();
    if !cache.is_empty() {
        let mut cached = Vec::new();
        for p in &cache {
            if let Some(info) = probe_java(p) {
                cached.push(info);
            }
        }
        if !cached.is_empty() {
            return Ok(cached);
        }
    }

    // 2. 全量扫描
    let javas = scan_java_impl(&ctx)?;

    // 3. 写回缓存
    if !javas.is_empty() {
        let paths: Vec<PathBuf> = javas.iter().map(|j| j.path.clone()).collect();
        let _ = config.write_section("java_cache", &paths);
    }

    Ok(javas)
}

/// 获取指定 Java 路径的版本信息
#[tauri::command]
pub async fn get_java_version(path: String) -> Result<JavaInstallation, String> {
    let java_path = PathBuf::from(&path);
    if !java_path.exists() {
        return Err(format!("路径不存在: {}", path));
    }
    probe_java(&java_path).ok_or_else(|| format!("执行 java -version 失败: {}", path))
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

        let info = parse_java_version_output(sample);
        assert_eq!(info.version, "17.0.1");
        assert_eq!(info.vendor, "Build 17.0.1+12");
        assert_eq!(info.major_version, 17);
        assert!(info.is_64bit);
    }

    #[test]
    fn test_parse_java8_and_32bit() {
        let sample = r#"java version "1.8.0_372"
                Java(TM) SE Runtime Environment (build 1.8.0_372-b07)
                Java HotSpot(TM) Client VM (build 25.372-b07, mixed mode)"#;

        let info = parse_java_version_output(sample);
        assert_eq!(info.version, "1.8.0_372");
        assert_eq!(info.major_version, 8);
        assert!(!info.is_64bit);
    }

    #[test]
    fn test_scan_java() {
        match scan_java_impl(&AppContext::new(
            std::env::temp_dir(),
            std::env::temp_dir().join("minecraft"),
        )) {
            Ok(javas) => {
                println!("Java 安装数量: {}", javas.len());
                for java in javas {
                    println!(
                        "  - path: {:?}, version: {}, vendor: {}, is_jdk: {}, major: {}, 64bit: {}",
                        java.path, java.version, java.vendor, java.is_jdk, java.major_version,
                        java.is_64bit
                    );
                }
            }
            Err(e) => println!("未找到 Java: {}", e),
        }
    }
}
