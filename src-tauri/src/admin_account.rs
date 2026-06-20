use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::sync::Mutex;
use tauri::command;
use uuid::Uuid;

use crate::log_info;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdminAccount {
    pub email: String,
    pub password_hash: String,
    pub salt: String,
    pub admin_id: String,
    pub created_at: String,
    pub bound_player_uuids: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AdminSession {
    pub email: String,
    pub admin_id: String,
    pub bound_player_uuids: Vec<String>,
    pub login_time: String,
}

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

static ADMIN_MANAGER: OnceCell<Mutex<AdminManager>> = OnceCell::new();

fn get_admin_file_path() -> Result<std::path::PathBuf, String> {
    let config_dir = &*crate::config::CONFIG_APPLICATION;
    fs::create_dir_all(config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    Ok(config_dir.join("admin_accounts.json"))
}

fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

fn generate_salt() -> String {
    Uuid::new_v4().to_string()
}

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

pub fn init_admin_manager() {
    ADMIN_MANAGER
        .set(Mutex::new(AdminManager::default()))
        .unwrap_or_else(|_| panic!("管理员管理器已初始化"));
}

#[command]
pub fn initialize_admin_system() -> Result<(), String> {
    if ADMIN_MANAGER.get().is_none() {
        ADMIN_MANAGER
            .set(Mutex::new(AdminManager::default()))
            .map_err(|_| "管理员管理器已初始化".to_string())?;
    }
    load_admin_from_disk()
}

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

#[command]
pub fn get_admin_info(email: String) -> Result<Option<AdminAccount>, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(guard.accounts.get(&email).cloned())
}

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

#[command]
pub fn is_admin_registered() -> Result<bool, String> {
    let guard = ADMIN_MANAGER
        .get()
        .ok_or("管理员管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取锁失败: {}", e))?;

    Ok(!guard.accounts.is_empty())
}
