use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use super::models::{GameInstance, GameSettings};
use super::manager::InstanceManager;

/// 获取实例的游戏设置
#[tauri::command]
pub fn get_instance_settings(
    instance_id: String,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameSettings, String> {
    let instance = instance_manager
        .get_instance(&instance_id)
        .ok_or_else(|| format!("实例不存在：{}", instance_id))?;
    
    Ok(instance.game_settings.unwrap_or_default())
}

/// 更新实例的游戏设置
#[tauri::command]
pub fn update_instance_settings(
    instance_id: String,
    settings: GameSettings,
    instance_manager: State<'_, InstanceManager>,
) -> Result<GameInstance, String> {
    let mut instance = instance_manager
        .get_instance(&instance_id)
        .ok_or_else(|| format!("实例不存在：{}", instance_id))?;
    
    instance.game_settings = Some(settings);
    
    // 注意：当前实现中，GameInstance 的修改不会持久化到磁盘
    // 后续需要实现实例配置的持久化存储
    // 暂时返回更新后的实例（内存中）
    
    Ok(instance)
}

/// 获取系统总内存（MB）
/// 跨平台实现：Windows / macOS / Linux
#[tauri::command]
pub fn get_system_memory() -> u64 {
    #[cfg(target_os = "windows")]
    {
        use std::mem;
        
        // Windows: 使用 GetPhysicallyInstalledSystemMemory
        // 需要链接 kernel32.lib
        #[link(name = "kernel32")]
        extern "system" {
            fn GetPhysicallyInstalledSystemMemory(memory: *mut u64) -> i32;
        }
        
        let mut memory: u64 = 0;
        unsafe {
            if GetPhysicallyInstalledSystemMemory(&mut memory) != 0 {
                return memory / 1024; // KB to MB
            }
        }
        
        // 如果失败，尝试使用 GlobalMemoryStatusEx
        #[link(name = "kernel32")]
        extern "system" {
            fn GlobalMemoryStatusEx(lp_buffer: *mut MEMORYSTATUSEX) -> i32;
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
        
        let mut status = MEMORYSTATUSEX {
            dw_length: mem::size_of::<MEMORYSTATUSEX>() as u32,
            dw_memory_load: 0,
            ull_total_phys: 0,
            ull_avail_phys: 0,
            ull_total_page_file: 0,
            ull_avail_page_file: 0,
            ull_total_virtual: 0,
            ull_avail_virtual: 0,
            ull_avail_extended_virtual: 0,
        };
        
        unsafe {
            if GlobalMemoryStatusEx(&mut status) != 0 {
                return status.ull_total_phys / 1024 / 1024; // Bytes to MB
            }
        }
        
        // 默认值
        8192
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // macOS: 使用 sysctl 命令获取物理内存
        let output = Command::new("sysctl")
            .arg("-n")
            .arg("hw.memsize")
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                if let Ok(mem_str) = String::from_utf8(output.stdout) {
                    if let Ok(mem_bytes) = mem_str.trim().parse::<u64>() {
                        return mem_bytes / 1024 / 1024; // Bytes to MB
                    }
                }
            }
        }
        
        // 备用方法：使用 host_page_size 和 host_max_mem
        // 但需要调用 IOKit，比较复杂，这里使用默认值
        8192
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        
        // Linux: 读取 /proc/meminfo
        let content = fs::read_to_string("/proc/meminfo").unwrap_or_default();
        
        for line in content.lines() {
            if line.starts_with("MemTotal:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() > 1 {
                    if let Ok(kb) = parts[1].parse::<u64>() {
                        return kb / 1024; // KB to MB
                    }
                }
            }
        }
        
        // 备用方法：读取 /sys/devices/system/memory/
        // 但 /proc/meminfo 通常都可用
        8192
    }
    
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        // 其他平台返回默认值
        8192
    }
}

/// 选择 Java 路径
#[tauri::command]
pub async fn select_java_path(app: AppHandle) -> Result<Option<String>, String> {
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
