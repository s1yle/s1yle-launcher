use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use super::models::{GameInstance, GameSettings, InstanceMeta};
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
    let instance = instance_manager
        .get_instance(&instance_id)
        .ok_or_else(|| format!("实例不存在：{}", instance_id))?;
    
    // 加载或创建 InstanceConfig
    let mut config = instance_manager.load_instance_config(&instance.version_id)
        .unwrap_or_else(|| {
            // 如果配置不存在，创建一个新的
            crate::config::InstanceConfig {
                id: instance.id.clone(),
                name: instance.name.clone(),
                version: instance.version_id.clone(),
                loader_type: instance.loader_type,
                loader_version: instance.loader_version.clone(),
                java: crate::config::JavaConfig::default(),
                memory: crate::config::MemoryConfig::default(),
                graphics: crate::config::GraphicsConfig::default(),
                custom_args: Vec::new(),
                icon_path: instance.icon_path.clone(),
                last_played: instance.last_played,
                created_at: instance.created_at,
                enabled: instance.enabled,
            }
        });
    
    // 更新配置中的设置
    config.java.java_path = settings.java_path.clone();
    config.memory.min_memory = settings.min_memory.unwrap_or(1024) as u32;
    config.memory.max_memory = settings.max_memory.unwrap_or(2048) as u32;
    config.java.java_args = settings.jvm_args.clone().unwrap_or_default();
    config.graphics.width = settings.width.unwrap_or(854);
    config.graphics.height = settings.height.unwrap_or(480);
    config.graphics.fullscreen = settings.fullscreen.unwrap_or(false);
    
    // 保存到实例配置文件
    instance_manager.save_instance_config(&config)?;
    
    // 同时保存到旧式元数据（兼容）
    let meta = InstanceMeta {
        id: instance.id.clone(),
        name: instance.name.clone(),
        version_id: instance.version_id.clone(),
        loader_type: instance.loader_type,
        loader_version: instance.loader_version.clone(),
        icon_path: instance.icon_path.clone(),
        created_at: instance.created_at,
        last_played: instance.last_played,
        game_settings: Some(settings),
    };
    instance_manager.save_meta(&instance.name, &meta)?;
    
    // 重新获取实例（包含更新后的配置）
    let updated_instance = instance_manager
        .get_instance(&instance_id)
        .ok_or_else(|| format!("实例不存在：{}", instance_id))?;
    
    Ok(updated_instance)
}

/// 获取系统总内存（MB）
/// 跨平台实现：Windows / macOS / Linux
#[tauri::command]
pub fn get_system_memory() -> u64 {
    #[cfg(target_os = "windows")]
    {
        use std::mem;
        
        let mut memory: u64 = 0;
        unsafe {
            use windows::Win32::System::SystemInformation::GetPhysicallyInstalledSystemMemory;

            if GetPhysicallyInstalledSystemMemory(&mut memory) != Ok(()) {
                return memory / 1024; // KB to MB
            }
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
            use windows::Win32::System::SystemInformation::GlobalMemoryStatusEx;

            // if GlobalMemoryStatusEx(&mut status) != Ok(()) {
            //     return status.ull_total_phys / 1024 / 1024; // Bytes to MB
            // }
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
