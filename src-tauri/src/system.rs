//! 系统级命令（内存、分辨率等跨平台系统信息）

use crate::app_context::AppContext;
use crate::config_io;
use crate::log_info;
use crate::shared::models::{SystemConfig, SystemInfo};
use serde_json::Value;
use tauri::AppHandle;
use tauri::State;

/// 获取系统总内存（MB）
/// 跨平台实现：Windows / macOS / Linux
#[tauri::command]
pub fn get_system_memory() -> u64 {
    get_memory_usage().1
}

#[repr(C)]
struct MEMORYSTATUSEX {
    dw_length: u32,
    dw_memory_load: u32,
    ull_total_phys: u64,
    ull_avail_phys: u64,
    ull_total_page_file: u64,
    ull_avail_page_file: u64,
    ull_total_virtual: u64,
    ull_avail_virtual: u64,
    ull_avail_extended_virtual: u64,
}

impl Default for MEMORYSTATUSEX {
    fn default() -> Self {
        Self {
            dw_length: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
            dw_memory_load: 0,
            ull_total_phys: 0,
            ull_avail_phys: 0,
            ull_total_page_file: 0,
            ull_avail_page_file: 0,
            ull_total_virtual: 0,
            ull_avail_virtual: 0,
            ull_avail_extended_virtual: 0,
        }
    }
}

/// 获取系统内存使用情况（MB）
/// 返回 (已使用内存, 总内存)，跨平台真实数据，失败时回退 (0, 0)
#[tauri::command]
pub fn get_memory_usage() -> (u64, u64) {
    #[cfg(target_os = "linux")]
    {
        use std::fs;

        // Linux: /proc/meminfo 的 MemTotal 与 MemAvailable（单位 KB）
        let content = fs::read_to_string("/proc/meminfo").unwrap_or_default();
        let mut total_kb = 0u64;
        let mut available_kb = 0u64;

        for line in content.lines() {
            if let Some(value) = line
                .split_whitespace()
                .nth(1)
                .and_then(|v| v.parse::<u64>().ok())
            {
                if line.starts_with("MemTotal:") {
                    total_kb = value;
                } else if line.starts_with("MemAvailable:") {
                    available_kb = value;
                }
            }
        }

        if total_kb > 0 {
            let used = total_kb.saturating_sub(available_kb) / 1024;
            return (used, total_kb / 1024);
        }
        (0, 0)
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // macOS: 总内存来自 sysctl hw.memsize，可用内存来自 vm_stat（free + inactive + speculative 页）
        let total_bytes = Command::new("sysctl")
            .arg("-n")
            .arg("hw.memsize")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| s.trim().parse::<u64>().ok())
            .unwrap_or(0);

        if total_bytes == 0 {
            return (0, 0);
        }

        let vm = Command::new("vm_stat")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .unwrap_or_default();

        // 解析 page size（默认 4096）
        let page_size = vm
            .lines()
            .find_map(|line| {
                let stripped = line.trim_start().strip_prefix("page size of ")?;
                stripped.split_whitespace().next()?.parse::<u64>().ok()
            })
            .unwrap_or(4096);

        // 解析空闲相关页数（键带尾冒号，值可能带句点）
        let mut free = 0u64;
        let mut inactive = 0u64;
        let mut speculative = 0u64;

        for line in vm.lines() {
            let Some((key, raw)) = line.split_once(':') else {
                continue;
            };
            let value = raw.trim().trim_end_matches('.').parse::<u64>().unwrap_or(0);
            match key.trim() {
                "Pages free" => free = value,
                "Pages inactive" => inactive = value,
                "Pages speculative" => speculative = value,
                _ => {}
            }
        }

        let available_bytes = (free + inactive + speculative) * page_size;
        let total = total_bytes / 1024 / 1024;
        let used = total_bytes.saturating_sub(available_bytes) / 1024 / 1024;
        (used, total)
    }

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};

        let mut status = MEMORYSTATUSEX::default();
        status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;

        match unsafe { GlobalMemoryStatusEx(&mut status) } {
            Ok(()) => {
                let total = status.ullTotalPhys / 1024 / 1024;
                let used = status.ullTotalPhys.saturating_sub(status.ullAvailPhys) / 1024 / 1024;
                return (used, total);
            }
            Err(e) => {
                use crate::log_error;

                log_error!("GlobalMemoryStatusEx 调用失败: {:?}", e);
                log_error!("错误码: {}", e.code().0);
                // 额外获取最后一次错误
                let last_err = unsafe { windows::Win32::Foundation::GetLastError() };
                log_error!("GetLastError: {:?}", last_err);
            }
        }
        (0, 0)
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        // 其他平台无真实数据源，返回 0 交由前端处理
        (0, 0)
    }
}

/// 获取显示器支持的分辨率列表（"WxH" 字符串，按出现顺序去重）
/// 跨平台真实数据：Linux xrandr 模式、Windows 显示设备枚举、macOS 当前显示器尺寸；
/// 拿不到时返回空列表，由前端合并常用预设
#[tauri::command]
pub fn get_display_resolutions(app: AppHandle) -> Vec<String> {
    #[cfg(target_os = "linux")]
    {
        use std::collections::HashSet;
        use std::process::Command;

        let mut seen = HashSet::new();
        let mut resolutions = Vec::new();

        if let Ok(output) = Command::new("xrandr").arg("--current").output() {
            if output.status.success() {
                if let Ok(text) = String::from_utf8(output.stdout) {
                    for line in text.lines() {
                        let line = line.trim_start();
                        // 活动模式行形如 "1920x1080     60.00*+  59.94"（行首为 WxH + 刷新率）
                        let mut parts = line.split_whitespace();
                        let Some(mode) = parts.next() else { continue };
                        let is_resolution = mode.split_once('x').is_some_and(|(w, h)| {
                            w.chars().all(|c| c.is_ascii_digit())
                                && h.chars().all(|c| c.is_ascii_digit())
                        });
                        // 第二个字段必须是数字刷新率，排除显示器名称行
                        if is_resolution
                            && parts.next().is_some_and(|r| {
                                r.chars().next().is_some_and(|c| c.is_ascii_digit())
                            })
                        {
                            if seen.insert(mode.to_string()) {
                                resolutions.push(mode.to_string());
                            }
                        }
                    }
                }
            }
        }
        let _ = &app;
        return resolutions;
    }

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Graphics::Gdi::{
            DEVMODEW, ENUM_DISPLAY_SETTINGS_MODE, EnumDisplaySettingsW,
        };
        use windows::core::PCWSTR;

        let mut seen = std::collections::HashSet::new();
        let mut resolutions = Vec::new();
        let mut index = 0u32;

        loop {
            let mut devmode: DEVMODEW = unsafe { std::mem::zeroed() };
            // 模式枚举到返回 false 为止（index 0 为当前模式）
            if !unsafe {
                EnumDisplaySettingsW(
                    PCWSTR::null(),
                    ENUM_DISPLAY_SETTINGS_MODE(index),
                    &mut devmode,
                )
            }
            .as_bool()
            {
                break;
            }
            let (width, height) = (devmode.dmPelsWidth, devmode.dmPelsHeight);
            if width > 0 && height > 0 {
                let key = format!("{}x{}", width, height);
                if seen.insert(key.clone()) {
                    resolutions.push(key);
                }
            }
            index += 1;
        }
        let _ = &app;
        return resolutions;
    }

    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;

        // macOS：无额外依赖，返回当前各显示器分辨率
        let resolutions = app
            .available_monitors()
            .map(|monitors| {
                monitors
                    .iter()
                    .map(|m| format!("{}x{}", m.size().width, m.size().height))
                    .collect()
            })
            .unwrap_or_default();
        return resolutions;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = &app;
        Vec::new()
    }
}

// ==================== 应用配置（.wecraft.json 的 `app` 节） ====================

/// 获取全局配置（app 节反序列化为 SystemConfig）
#[tauri::command]
pub fn get_config(ctx: State<'_, AppContext>) -> Result<SystemConfig, String> {
    Ok(config_io::read_section::<SystemConfig>(&ctx.launcher_config_path(), "app")
        .unwrap_or_default())
}

/// 动态写入配置值（支持点号分隔的路径，写入 app 节下的嵌套字段）
#[tauri::command]
pub fn set_config_value(
    ctx: State<'_, AppContext>,
    key: String,
    value: Value,
) -> Result<(), String> {
    let path = ctx.launcher_config_path();
    let mut root = config_io::read_raw(&path);
    if root.get("app").is_none() || !root["app"].is_object() {
        root["app"] = serde_json::json!({});
    }
    set_nested_value(&mut root["app"], &parse_key_path(&key), value)?;
    config_io::write_raw(&path, &root)
}

/// 将点号分隔的配置路径拆分为路径段
fn parse_key_path(key: &str) -> Vec<&str> {
    key.split('.').collect()
}

/// 根据路径段设置嵌套 JSON 值（自动创建中间节点）
fn set_nested_value(value: &mut Value, path: &[&str], new_val: Value) -> Result<(), String> {
    let mut current = value;
    let (last, segments) = path.split_last().ok_or("空的配置路径")?;

    for segment in segments {
        if !current.get(segment).is_some() {
            current[*segment] = Value::Object(serde_json::Map::new());
        }
        if !current[segment].is_object() {
            return Err(format!("配置路径不是对象类型：{}", segment));
        }
        current = current.get_mut(segment).unwrap();
    }

    current[last] = new_val;
    Ok(())
}

// ==================== 系统信息 ====================

/// 计算系统信息（操作系统 / 架构 / 启动器数据目录）
pub fn system_info(ctx: &AppContext) -> SystemInfo {
    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    let arch = if cfg!(target_arch = "x86") {
        "x86"
    } else if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "arm") {
        "arm"
    } else if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        "unknown"
    };

    let wecraft_dir = ctx.wecraft_data_dir().to_string_lossy().to_string();

    SystemInfo {
        os: os.to_string(),
        arch: arch.to_string(),
        wecraft_dir,
    }
}

/// 获取当前操作系统和架构信息
#[tauri::command]
pub fn get_system_info(ctx: State<'_, AppContext>) -> Result<SystemInfo, String> {
    Ok(system_info(&ctx))
}

// ==================== 文件 / 磁盘 / 外部打开 ====================

/// 获取指定路径所在磁盘的剩余可用空间（字节）
#[tauri::command]
pub fn get_disk_free_space(path: String) -> Result<u64, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

        let path_u16: Vec<u16> = std::path::Path::new(&path)
            .as_os_str()
            .encode_wide()
            .collect();
        let mut free_bytes: u64 = 0;
        let result = unsafe {
            GetDiskFreeSpaceExW(
                windows::core::PCWSTR(path_u16.as_ptr()),
                Some(&mut free_bytes),
                None,
                None,
            )
        };
        if result.is_ok() {
            Ok(free_bytes)
        } else {
            Err("获取磁盘剩余空间失败".to_string())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::ffi::CString;

        let c_path = CString::new(path).map_err(|e| format!("路径无效: {}", e))?;
        let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
        let ret = unsafe { libc::statvfs(c_path.as_ptr(), &mut stat) };
        if ret == 0 {
            let free = (stat.f_frsize as u64).saturating_mul(stat.f_bavail as u64);
            Ok(free)
        } else {
            Err(format!("获取磁盘剩余空间失败 (errno {})", ret))
        }
    }
}

/// 使用系统默认浏览器打开指定 URL
#[tauri::command]
pub fn open_url(url: String) -> Result<String, String> {
    log_info!("打开链接: {}", url);
    tauri_plugin_opener::open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(url)
}

/// 使用系统文件管理器打开指定文件夹（目录不存在时先创建，保证浏览子目录可用）
#[tauri::command]
pub fn open_folder(path: String) -> Result<String, String> {
    log_info!("打开文件夹: {}", path);
    if let Err(e) = std::fs::create_dir_all(&path) {
        log_info!("创建目录失败（忽略并继续打开）: {}", e);
    }
    tauri_plugin_opener::open_path(&path, None::<&str>)
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(path)
}

#[test]
pub fn get_win_memory() {
    let (mem, totalMem) = get_memory_usage();
    println!("mem: {}, totalMem: {}", mem, totalMem);

    println!("---------------------------------------------");
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};

        let mut status = MEMORYSTATUSEX::default();
        status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
        println!("status before call: {:?}", status);

        // 调用并处理返回值
        match unsafe { GlobalMemoryStatusEx(&mut status) } {
            Ok(()) => {
                println!("✅ 调用成功");
                println!("status after call: {:?}", status);
                println!("总内存: {} MB", status.ullTotalPhys / 1024 / 1024);
                println!("可用内存: {} MB", status.ullAvailPhys / 1024 / 1024);
                println!("百分比: {} %", status.dwMemoryLoad);
                println!(
                    "已提交内存限制: {} MB",
                    status.ullTotalPageFile / 1024 / 1024
                );
                println!("总共虚拟: {} MB", status.ullTotalVirtual / 1024 / 1024);
                println!("可用虚拟: {} MB", status.ullAvailVirtual / 1024 / 1024);
            }
            Err(e) => {
                println!("❌ 调用失败: {:?}", e);
                println!("错误码: {}", e.code().0);
                // 额外获取最后一次错误
                let last_err = unsafe { windows::Win32::Foundation::GetLastError() };
                println!("GetLastError: {:?}", last_err);
            }
        }
    }
}
