use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::sync::Mutex;
use tauri::command;
use uuid::Uuid;

use crate::log_info;

/// 管理员账户信息
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdminAccount {
    /// 管理员邮箱
    pub email: String,
    /// 密码哈希值
    pub password_hash: String,
    /// 密码加盐
    pub salt: String,
    /// 管理员唯一标识
    pub admin_id: String,
    /// 账户创建时间
    pub created_at: String,
    /// 绑定的玩家 UUID 列表
    pub bound_player_uuids: Vec<String>,
}

/// 管理员登录会话信息（返回给前端）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdminSession {
    /// 管理员邮箱
    pub email: String,
    /// 管理员唯一标识
    pub admin_id: String,
    /// 绑定的玩家 UUID 列表
    pub bound_player_uuids: Vec<String>,
    /// 登录时间
    pub login_time: String,
}

/// 管理员管理器（内存状态）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdminManager {
    pub accounts: HashMap<String, AdminAccount>,
    pub current_email: Option<String>,
}

impl Default for AdminManager {
    fn default() -> Self {
        Self {
            accounts: HashMap::new(),
            current_email: None,
        }
    }
}

/// 全局管理员管理器实例
static ADMIN_MANAGER: OnceCell<Mutex<AdminManager>> = OnceCell::new();

/// 获取管理员数据文件路径
fn get_admin_file_path() -> Result<std::path::PathBuf, String> {
    let config_dir = &*crate::config::CONFIG_APPLICATION;
    fs::create_dir_all(config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    Ok(config_dir.join("admin_accounts.json"))
}

/// 使用 SHA-256 加盐哈希密码
fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

/// 生成随机盐值
fn generate_salt() -> String {
    Uuid::new_v4().to_string()
}

/// 从磁盘加载管理员数据
fn load_admin_from_disk() -> Result<(), String> {
    let path = get_admin_file_path()?;
    if !path.exists() {
        return Ok(());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("读取管理员配置文件失败: {}", e))?;
    let manager: AdminManager =
        serde_json::from_str(&content).map_err(|e| format!("解析管理员配置失败: {}", e))?;
    let mut guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;
    *guard = manager;
    log_info!("管理员账号加载成功");
    Ok(())
}

/// 保存管理员数据到磁盘
fn save_admin_to_disk() -> Result<(), String> {
    let path = get_admin_file_path()?;
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;
    let json =
        serde_json::to_string_pretty(&*guard).map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("写入管理员配置失败: {}", e))?;
    log_info!("管理员账号保存成功");
    Ok(())
}

/// 初始化管理员管理器
pub fn init_admin_manager() {
    ADMIN_MANAGER
        .set(Mutex::new(AdminManager::default()))
        .unwrap_or_else(|_| panic!("管理员管理器已初始化"));
}

/// 初始化管理员系统（加载磁盘数据），推荐在应用启动时调用
#[command]
pub fn initialize_admin_system() -> Result<(), String> {
    if ADMIN_MANAGER.get().is_none() {
        ADMIN_MANAGER
            .set(Mutex::new(AdminManager::default()))
            .map_err(|_| "管理员管理器已初始化".to_string())?;
    }
    load_admin_from_disk()
}

/// 注册管理员账户（邮箱+密码），返回会话信息
#[command]
pub fn register_admin(email: String, password: String) -> Result<AdminSession, String> {
    if email.is_empty() || !email.contains('@') {
        return Err("请输入有效的邮箱地址".to_string());
    }
    if password.len() < 6 {
        return Err("密码长度至少为6位".to_string());
    }

    let mut guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    if guard.accounts.contains_key(&email) {
        return Err("该邮箱已被注册".to_string());
    }

    let salt = generate_salt();
    let password_hash = hash_password(&password, &salt);
    let now = chrono::Local::now().to_rfc3339();

    let account = AdminAccount {
        email: email.clone(),
        password_hash,
        salt,
        admin_id: Uuid::new_v4().to_string(),
        created_at: now.clone(),
        bound_player_uuids: Vec::new(),
    };

    guard.accounts.insert(email.clone(), account);
    guard.current_email = Some(email.clone());

    drop(guard);
    save_admin_to_disk()?;

    Ok(AdminSession {
        email,
        admin_id: Uuid::new_v4().to_string(),
        bound_player_uuids: Vec::new(),
        login_time: now,
    })
}

/// 管理员登录，验证邮箱密码并返回会话信息
#[command]
pub fn login_admin(email: String, password: String) -> Result<AdminSession, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    let account = guard
        .accounts
        .get(&email)
        .ok_or("邮箱或密码错误".to_string())?;

    let hash = hash_password(&password, &account.salt);
    if hash != account.password_hash {
        return Err("邮箱或密码错误".to_string());
    }

    let now = chrono::Local::now().to_rfc3339();

    Ok(AdminSession {
        email: email.clone(),
        admin_id: account.admin_id.clone(),
        bound_player_uuids: account.bound_player_uuids.clone(),
        login_time: now,
    })
}

/// 将玩家 UUID 绑定到指定的管理员账号
#[command]
pub fn bind_player_to_admin(email: String, player_uuid: String) -> Result<(), String> {
    let mut guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    let account = guard
        .accounts
        .get_mut(&email)
        .ok_or("管理员账号不存在".to_string())?;

    if account.bound_player_uuids.contains(&player_uuid) {
        return Err("该玩家已绑定到此管理员".to_string());
    }

    account.bound_player_uuids.push(player_uuid);

    drop(guard);
    save_admin_to_disk()?;

    Ok(())
}

/// 从管理员账号解绑指定玩家 UUID
#[command]
pub fn unbind_player_from_admin(email: String, player_uuid: String) -> Result<(), String> {
    let mut guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    let account = guard
        .accounts
        .get_mut(&email)
        .ok_or("管理员账号不存在".to_string())?;

    account.bound_player_uuids.retain(|uuid| uuid != &player_uuid);

    drop(guard);
    save_admin_to_disk()?;

    Ok(())
}

/// 获取指定管理员账号的详细信息
#[command]
pub fn get_admin_info(email: String) -> Result<Option<AdminAccount>, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(guard.accounts.get(&email).cloned())
}

/// 获取指定管理员绑定的玩家 UUID 列表
#[command]
pub fn get_bound_players(email: String) -> Result<Vec<String>, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(guard
        .accounts
        .get(&email)
        .map(|a| a.bound_player_uuids.clone())
        .unwrap_or_default())
}

/// 检查系统是否已注册至少一个管理员
#[command]
pub fn is_admin_registered() -> Result<bool, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(!guard.accounts.is_empty())
}
