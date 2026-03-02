use tauri::command;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use once_cell::sync::OnceCell;
use std::{
    sync::{Mutex},
    collections::HashMap,
    path::PathBuf,
    fs,
};
use chrono::{Local};
use directories::ProjectDirs;

use crate::log_info;

// ======================== 配置常量 ========================
const CONFIG_QUALIFIER: &str = "art";
const CONFIG_ORGANIZATION: &str = "s1yle"; // 替换为你的工作室/组织名
const CONFIG_APPLICATION: &str = "mc_launcher";   // 替换为你的应用名
const CONFIG_FILENAME: &str = "accounts.json";

// ======================== 类型定义 ========================
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum AccountType {
    #[serde(rename = "microsoft")]
    Microsoft,
    #[serde(rename = "offline")]
    Offline,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AccountInfo {
    pub name: String,
    pub account_type: AccountType,
    pub uuid: String,
    pub create_time: String,
    pub last_login_time: Option<String>,
}

// 注意：现在 Account 也可以序列化了
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Account {
    pub info: AccountInfo,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
}

// 注意：AccountManager 现在也可以序列化了
#[derive(Serialize, Deserialize, Clone, Debug)]
struct AccountManager {
    accounts: HashMap<String, Account>,
    current_uuid: Option<String>,
}

impl Default for AccountManager {
    fn default() -> Self {
        Self {
            accounts: HashMap::new(),
            current_uuid: None,
        }
    }
}

// 全局状态
static ACCOUNT_MANAGER: OnceCell<Mutex<AccountManager>> = OnceCell::new();

// ======================== 核心逻辑：文件存储 ========================

/// 获取配置文件的完整路径
fn get_config_path() -> Result<PathBuf, String> {
    let proj_dirs = ProjectDirs::from(CONFIG_QUALIFIER, CONFIG_ORGANIZATION, CONFIG_APPLICATION)
        .ok_or("无法确定系统应用数据目录")?;
    
    // 确保目录存在
    let config_dir = proj_dirs.data_dir();
    fs::create_dir_all(config_dir)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;
    
    Ok(config_dir.join(CONFIG_FILENAME))
}

/// 从磁盘加载账户数据（启动时调用一次）
pub fn load_accounts_from_disk_internal() -> Result<(), String> {
    let path = get_config_path()?;
    
    if !path.exists() {
        println!("ℹ️ 配置文件不存在，将使用空初始状态");
        return Ok(());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;
    
    let loaded_manager: AccountManager = serde_json::from_str(&content)
        .map_err(|e| format!("解析配置文件失败 (JSON格式错误): {}", e))?;

    // 替换全局状态
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("锁获取失败: {}", e))?;

    *manager = loaded_manager;
    println!("✅ 成功加载 {} 个账户", manager.accounts.len());
    Ok(())
}

/// 将当前内存中的账户数据保存到磁盘（内部调用）
fn save_accounts_to_disk_internal() -> Result<(), String> {
    let path = get_config_path()?;
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("锁获取失败: {}", e))?;

    let json_str = serde_json::to_string_pretty(&*manager)
        .map_err(|e| format!("序列化数据失败: {}", e))?;

    fs::write(&path, json_str)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    log_info!("账号配置文件保存成功，存放路径：{}", path.to_string_lossy());

    Ok(())
}

/// 公共保存接口（如果需要手动强制保存）

// ======================== 核心方法 ========================
impl Account {
    pub fn new(
        name: String,
        account_type: AccountType,
        access_token: Option<String>,
        refresh_token: Option<String>,
    ) -> Self {
        let uuid = match &account_type {
            AccountType::Microsoft => Uuid::new_v4().to_string(),
            AccountType::Offline => {
                const MC_OFFLINE_NAMESPACE: Uuid = Uuid::from_u128(0x00000000000000000000000000000000);
                let input = format!("OfflinePlayer:{}", name);
                Uuid::new_v3(&MC_OFFLINE_NAMESPACE, input.as_bytes()).to_string()
            }
        };

        let create_time = Local::now().to_rfc3339();

        Self {
            info: AccountInfo {
                name,
                account_type,
                uuid,
                create_time,
                last_login_time: None,
            },
            access_token,
            refresh_token,
        }
    }

    pub fn update_last_login(&mut self) {
        self.info.last_login_time = Some(Local::now().to_rfc3339());
    }
}

// ======================== 全局状态操作 ========================
pub fn init_account_manager() {
    ACCOUNT_MANAGER
        .set(Mutex::new(AccountManager::default()))
        .unwrap_or_else(|_| panic!("账户管理器已初始化"));
    println!("✅ 账户管理器初始化完成");
}

pub fn add_account_to_manager(account: Account) -> Result<(), String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    let uuid = account.info.uuid.clone();
    if manager.accounts.contains_key(&uuid) {
        return Err(format!("账户 {} 已存在", uuid));
    }

    manager.accounts.insert(uuid, account);
    
    // 释放锁后再保存（避免死锁，虽然这里作用域结束自动释放，但这是个好习惯）
    drop(manager); 
    save_accounts_to_disk_internal()?; // 修改后自动保存

    Ok(())
}

pub fn set_current_account(uuid: &str) -> Result<(), String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    if !manager.accounts.contains_key(uuid) {
        return Err(format!("账户 {} 不存在", uuid));
    }

    manager.current_uuid = Some(uuid.to_string());
    
    if let Some(account) = manager.accounts.get_mut(uuid) {
        account.update_last_login();
    }

    drop(manager);
    save_accounts_to_disk_internal()?; // 修改后自动保存

    Ok(())
}

// ======================== Tauri 前端命令 ========================

/// 初始化命令（推荐在前端应用启动时调用一次）
#[command]
pub fn initialize_account_system() -> Result<(), String> {
    load_accounts_from_disk_internal()?;
    Ok(())
}

#[command]
pub fn add_account(
    name: String,
    account_type: String,
    access_token: Option<String>,
    refresh_token: Option<String>,
) -> Result<String, String> {
    if name.is_empty() {
        return Err("用户名不能为空".to_string());
    }
    if !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(format!("用户名 '{}' 包含非法字符", name));
    }

    let account_type = match account_type.as_str() {
        "microsoft" => AccountType::Microsoft,
        "offline" => AccountType::Offline,
        _ => return Err(format!("不支持的账户类型: {}", account_type)),
    };

    if let AccountType::Microsoft = account_type {
        if access_token.is_none() || refresh_token.is_none() {
            return Err("微软账户必须提供完整的 Token".to_string());
        }
    }

    let account = Account::new(name, account_type, access_token, refresh_token);
    let uuid = account.info.uuid.clone();
    add_account_to_manager(account)?;
    save_accounts_to_disk_internal()?;

    Ok(format!("账户创建成功，UUID: {}", uuid))
}

#[command]
pub fn get_account_list() -> Result<Vec<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    Ok(manager.accounts.values().map(|a| a.info.clone()).collect())
}

#[command]
pub fn get_current_account() -> Result<Option<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    Ok(manager.current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .map(|a| a.info.clone()))
}

#[command]
pub fn delete_account(uuid: String) -> Result<String, String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    if manager.accounts.remove(&uuid).is_none() {
        return Err(format!("账户 {} 不存在", uuid));
    }

    if manager.current_uuid.as_deref() == Some(&uuid) {
        manager.current_uuid = None;
    }

    drop(manager);
    save_accounts_to_disk_internal()?; // 修改后自动保存

    Ok(format!("账户 {} 删除成功", uuid))
}

#[command]
pub fn save_accounts_to_disk() -> Result<(), String> {
    save_accounts_to_disk_internal()
}

#[command]
pub fn load_accounts_from_disk() -> Result<(), String> {
    load_accounts_from_disk_internal()
}