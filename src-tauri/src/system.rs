//! 系统级命令（内存、分辨率等跨平台系统信息）

use tauri::AppHandle;

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
            if let Some(value) = line.split_whitespace().nth(1).and_then(|v| v.parse::<u64>().ok()) {
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
        // Windows: GlobalMemoryStatusEx 一次性拿到总内存与可用内存（单位字节）
        use windows::Win32::System::SystemInformation::GlobalMemoryStatusEx;

        let mut status = MEMORYSTATUSEX::default();
        if unsafe { GlobalMemoryStatusEx(&mut status) }.is_ok() && status.ull_total_phys > 0 {
            let total = status.ull_total_phys / 1024 / 1024;
            let used = status.ull_total_phys.saturating_sub(status.ull_avail_phys) / 1024 / 1024;
            return (used, total);
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
                        let is_resolution = mode
                            .split_once('x')
                            .is_some_and(|(w, h)| w.chars().all(|c| c.is_ascii_digit()) && h.chars().all(|c| c.is_ascii_digit()));
                        // 第二个字段必须是数字刷新率，排除显示器名称行
                        if is_resolution && parts.next().is_some_and(|r| r.chars().next().is_some_and(|c| c.is_ascii_digit())) {
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
        use windows::core::PCWSTR;
        use windows::Win32::Graphics::Gdi::{EnumDisplaySettingsW, DEVMODEW};

        let mut seen = std::collections::HashSet::new();
        let mut resolutions = Vec::new();
        let mut index = 0u32;

        loop {
            let mut devmode: DEVMODEW = unsafe { std::mem::zeroed() };
            // 模式枚举到返回 false 为止（index 0 为当前模式）
            if !unsafe { EnumDisplaySettingsW(PCWSTR::null(), index, &mut devmode) }.as_bool() {
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
