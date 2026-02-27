// src-tauri/src/launch.rs
// Minecraft 启动模块

use std::process::{Command, Child};
use std::sync::Mutex;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};

// ======================== 类型定义 ========================

/// 启动状态枚举
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum LaunchStatus {
    Idle,           // 未启动
    Launching,      // 启动中
    Running,        // 运行中
    Crashed,        // 崩溃
    Stopped,        // 已停止
}

/// 启动配置结构体
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LaunchConfig {
    pub java_path: String,           // Java可执行文件路径
    pub memory_mb: u32,              // 内存大小（MB）
    pub version: String,             // Minecraft版本
    pub game_dir: String,            // 游戏目录
    pub assets_dir: String,          // 资源目录
    pub username: String,            // 用户名
    pub uuid: String,                // 用户UUID
    pub access_token: Option<String>, // 访问令牌（微软账户）
}

impl Default for LaunchConfig {
    fn default() -> Self {
        Self {
            java_path: "java".to_string(),  // 默认使用PATH中的java
            memory_mb: 2048,                // 2GB内存
            version: "1.20.4".to_string(),
            game_dir: "./.minecraft".to_string(),
            assets_dir: "./.minecraft/assets".to_string(),
            username: "Steve".to_string(),
            uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5".to_string(), // 离线模式Notch的UUID
            access_token: None,
        }
    }
}

/// 启动管理器状态
struct LaunchManager {
    config: LaunchConfig,
    child_process: Option<Child>,  // 子进程句柄
    status: LaunchStatus,
    last_error: Option<String>,
}

impl Default for LaunchManager {
    fn default() -> Self {
        Self {
            config: LaunchConfig::default(),
            child_process: None,
            status: LaunchStatus::Idle,
            last_error: None,
        }
    }
}

// ======================== 全局状态 ========================

/// 全局启动管理器实例
static LAUNCH_MANAGER: OnceCell<Mutex<LaunchManager>> = OnceCell::new();

/// 初始化启动管理器
pub fn init_launch_manager() {
    LAUNCH_MANAGER
        .set(Mutex::new(LaunchManager::default()))
        .unwrap_or_else(|_| panic!("启动管理器已初始化，不可重复调用"));
    println!("✅ 启动管理器初始化完成");
}

// ======================== 核心启动逻辑 ========================

/// 构建启动命令参数
fn build_launch_args(config: &LaunchConfig) -> Vec<String> {
    let mut args = Vec::new();
    
    // JVM参数
    args.push(format!("-Xmx{}M", config.memory_mb));
    args.push(format!("-Xms{}M", config.memory_mb / 2));
    
    // 类路径（简化版，实际需要根据版本管理动态构建）
    args.push("-cp".to_string());
    args.push(format!("{}/libraries/*", config.game_dir));
    args.push("net.minecraft.client.main.Main".to_string());
    
    // 游戏参数
    args.push("--version".to_string());
    args.push(config.version.clone());
    
    args.push("--gameDir".to_string());
    args.push(config.game_dir.clone());
    
    args.push("--assetsDir".to_string());
    args.push(config.assets_dir.clone());
    
    args.push("--assetIndex".to_string());
    args.push(config.version.clone()); // 简化：版本作为asset index
    
    args.push("--uuid".to_string());
    args.push(config.uuid.clone());
    
    args.push("--username".to_string());
    args.push(config.username.clone());
    
    if let Some(token) = &config.access_token {
        args.push("--accessToken".to_string());
        args.push(token.clone());
    }
    
    args.push("--userType".to_string());
    args.push("mojang".to_string()); // 简化：默认mojang
    
    args
}

/// 启动 Minecraft 实例
pub fn launch_instance(config: Option<LaunchConfig>) -> Result<String, String> {
    let mut manager = LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取启动锁失败: {}", e))?;
    
    // 检查是否已在运行
    if manager.status == LaunchStatus::Running || manager.status == LaunchStatus::Launching {
        return Err("Minecraft 已在运行".to_string());
    }
    
    // 使用提供的配置或默认配置
    if let Some(new_config) = config {
        manager.config = new_config;
    }
    
    // 更新状态
    manager.status = LaunchStatus::Launching;
    manager.last_error = None;
    
    // 构建命令
    let java_path = &manager.config.java_path;
    let launch_args = build_launch_args(&manager.config);
    
    println!("🚀 启动 Minecraft:");
    println!("  Java路径: {}", java_path);
    println!("  内存: {}MB", manager.config.memory_mb);
    println!("  版本: {}", manager.config.version);
    println!("  用户名: {}", manager.config.username);
    
    // 启动进程
    match Command::new(java_path)
        .args(&launch_args)
        .current_dir(&manager.config.game_dir)
        .spawn()
    {
        Ok(child) => {
            manager.child_process = Some(child);
            manager.status = LaunchStatus::Running;
            println!("✅ Minecraft 启动成功");
            Ok("Minecraft 启动成功".to_string())
        }
        Err(e) => {
            let error_msg = format!("启动失败: {}", e);
            manager.status = LaunchStatus::Crashed;
            manager.last_error = Some(error_msg.clone());
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

/// 停止 Minecraft 实例
pub fn stop_instance() -> Result<String, String> {
    let mut manager = LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取启动锁失败: {}", e))?;
    
    match manager.child_process.take() {
        Some(mut child) => {
            // 尝试正常终止
            if let Err(e) = child.kill() {
                let error_msg = format!("终止进程失败: {}", e);
                manager.last_error = Some(error_msg.clone());
                return Err(error_msg);
            }
            
            // 等待进程结束
            if let Err(e) = child.wait() {
                let error_msg = format!("等待进程结束失败: {}", e);
                manager.last_error = Some(error_msg.clone());
                return Err(error_msg);
            }
            
            manager.status = LaunchStatus::Stopped;
            println!("✅ Minecraft 已停止");
            Ok("Minecraft 已停止".to_string())
        }
        None => {
            manager.status = LaunchStatus::Idle;
            Ok("Minecraft 未在运行".to_string())
        }
    }
}

/// 获取当前启动状态
pub fn get_launch_status() -> Result<LaunchStatus, String> {
    let mut manager = LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取启动锁失败: {}", e))?;
    
    // 如果状态为Running，检查进程是否还在运行
    if manager.status == LaunchStatus::Running {
        if let Some(child) = &mut manager.child_process {
            match child.try_wait() {
                Ok(Some(status)) => {
                    // 进程已结束
                    manager.status = if status.success() {
                        LaunchStatus::Stopped
                    } else {
                        LaunchStatus::Crashed
                    };
                    manager.child_process = None;
                    
                    return Ok(manager.status.clone());
                }
                Ok(None) => {
                    // 进程仍在运行
                    return Ok(LaunchStatus::Running);
                }
                Err(e) => {
                    // 检查失败
                    let error_msg = format!("检查进程状态失败: {}", e);
                    return Err(error_msg);
                }
            }
        }
    }
    
    Ok(manager.status.clone())
}

/// 获取启动配置
pub fn get_launch_config() -> Result<LaunchConfig, String> {
    let manager = LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取启动锁失败: {}", e))?;
    
    Ok(manager.config.clone())
}

/// 更新启动配置
pub fn update_launch_config(config: LaunchConfig) -> Result<String, String> {
    let mut manager = LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取启动锁失败: {}", e))?;
    
    manager.config = config;
    println!("✅ 启动配置已更新");
    Ok("启动配置已更新".to_string())
}

// ======================== Tauri 前端命令 ========================

#[tauri::command]
pub fn tauri_launch_instance(config: Option<LaunchConfig>) -> Result<String, String> {
    launch_instance(config)
}

#[tauri::command]
pub fn tauri_stop_instance() -> Result<String, String> {
    stop_instance()
}

#[tauri::command]
pub fn tauri_get_launch_status() -> Result<LaunchStatus, String> {
    get_launch_status()
}

#[tauri::command]
pub fn tauri_get_launch_config() -> Result<LaunchConfig, String> {
    get_launch_config()
}

#[tauri::command]
pub fn tauri_update_launch_config(config: LaunchConfig) -> Result<String, String> {
    update_launch_config(config)
}

// ======================== 测试 ========================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_build_launch_args() {
        let config = LaunchConfig::default();
        let args = build_launch_args(&config);
        
        assert!(args.contains(&format!("-Xmx{}M", config.memory_mb)));
        assert!(args.contains(&format!("-Xms{}M", config.memory_mb / 2)));
        assert!(args.contains(&format!("--version {}", config.version)));
        assert!(args.contains(&format!("--username {}", config.username)));
    }
    
    #[test]
    fn test_default_config() {
        let config = LaunchConfig::default();
        
        assert_eq!(config.java_path, "java");
        assert_eq!(config.memory_mb, 2048);
        assert_eq!(config.version, "1.20.4");
        assert_eq!(config.username, "Steve");
    }
}