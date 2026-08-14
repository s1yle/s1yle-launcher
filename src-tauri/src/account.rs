use crate::config::ConfigManager;
use crate::microsoft_login::token_store::{delete_mc_token, get_mc_token};
use chrono::Local;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Mutex};
use tauri::{command, Manager};
use tauri_plugin_keyring::{CredentialType, CredentialValue, KeyringExt};
use uuid::Uuid;

use crate::log_info;
use crate::APP_HANDLE;

// ======================== 类型定义 ========================

/// 账户类型（定义见 crate::types）
pub use crate::types::AccountType;

/// 账户基本信息（公开暴露给前端）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AccountInfo {
    /// 玩家名
    pub name: String,
    /// 账户类型
    pub account_type: AccountType,
    /// 账户 UUID
    pub uuid: String,
    /// 创建时间
    pub create_time: String,
    /// 最后登录时间
    pub last_login_time: Option<String>,
}

/// 完整账户信息（含 Token）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Account {
    pub info: AccountInfo,
    /// 微软账户访问令牌
    pub access_token: Option<String>,
    /// 微软账户刷新令牌
    pub refresh_token: Option<String>,
}

/// 账户管理器（内存状态）
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

// ======================== keyring token 存储 ========================

/// keyring 键：mc_account_{uuid}
fn account_token_key(uuid: &str) -> String {
    format!("mc_account_{}", uuid)
}

/// 将账户 token 写入系统密钥环（Secret 类型，JSON 序列化，重复调用幂等）
fn set_account_tokens(app: &tauri::AppHandle, account: &Account) -> Result<(), String> {
    if account.access_token.is_none() && account.refresh_token.is_none() {
        return Ok(());
    }
    let payload = serde_json::to_vec(&(
        account.access_token.clone(),
        account.refresh_token.clone(),
    ))
    .map_err(|e| format!("序列化 token 失败: {}", e))?;
    app.keyring()
        .set(
            &account_token_key(&account.info.uuid),
            CredentialType::Secret,
            CredentialValue::Secret(payload),
        )
        .map_err(|e| format!("写入密钥环失败: {}", e))
}

/// 从系统密钥环读取账户 token，不存在或损坏返回 None
fn get_account_tokens(
    app: &tauri::AppHandle,
    uuid: &str,
) -> Option<(Option<String>, Option<String>)> {
    match app
        .keyring()
        .get(&account_token_key(uuid), CredentialType::Secret)
    {
        Ok(CredentialValue::Secret(bytes)) => {
            serde_json::from_slice::<(Option<String>, Option<String>)>(&bytes).ok()
        }
        _ => None,
    }
}

/// 删除系统密钥环中的账户 token（忽略不存在）
fn delete_account_tokens_from_keyring(app: &tauri::AppHandle, uuid: &str) {
    let _ = app
        .keyring()
        .delete(&account_token_key(uuid), CredentialType::Secret);
}

/// 磁盘持久化格式（严格不含 token，兼容旧格式：旧字段被 serde 忽略）
#[derive(Serialize, Deserialize, Clone, Debug)]
struct DiskAccount {
    info: AccountInfo,
}

/// 磁盘持久化账户管理器（token 只存在系统密钥环，绝不落盘）
#[derive(Serialize, Deserialize, Clone, Debug)]
struct DiskAccountManager {
    accounts: HashMap<String, DiskAccount>,
    current_uuid: Option<String>,
}

impl From<&AccountManager> for DiskAccountManager {
    fn from(manager: &AccountManager) -> Self {
        Self {
            accounts: manager
                .accounts
                .iter()
                .map(|(key, account)| {
                    (key.clone(), DiskAccount {
                        info: account.info.clone(),
                    })
                })
                .collect(),
            current_uuid: manager.current_uuid.clone(),
        }
    }
}

// ======================== 核心逻辑：文件存储 ========================

/// 从磁盘加载账户数据（启动时调用一次）。
/// token 不落盘：旧格式残留的磁盘 token 迁移到密钥环，新格式从密钥环恢复内存 token。
pub fn load_accounts_from_disk_internal() -> Result<(), String> {
    let cm = config_manager()?;
    let mut loaded = cm
        .read_section::<AccountManager>("accounts")
        .unwrap_or_default();

    let mut migrated = false;
    if let Some(app) = APP_HANDLE.get() {
        // 1. 旧格式（磁盘残留 token）→ 迁移入密钥环
        for account in loaded.accounts.values() {
            if account.access_token.is_some() || account.refresh_token.is_some() {
                if set_account_tokens(app, account).is_ok() {
                    migrated = true;
                }
            }
        }
        // 2. 从密钥环恢复 token 到内存（重启后启动/展示需要）
        for account in loaded.accounts.values_mut() {
            if account.access_token.is_none() && account.refresh_token.is_none() {
                if let Some((access_token, refresh_token)) =
                    get_account_tokens(app, &account.info.uuid)
                {
                    account.access_token = access_token;
                    account.refresh_token = refresh_token;
                }
            }
        }
    }

    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("锁获取失败: {}", e))?;

    *manager = loaded;
    drop(manager);

    if migrated {
        // 迁移后立即落盘一次，剥离磁盘上的残留 token
        save_accounts_to_disk_internal()?;
    }
    Ok(())
}

/// 将当前内存中的账户数据保存到磁盘（内部调用）。
/// token 先同步到系统密钥环，磁盘仅写入剥离版（DiskAccountManager）。
fn save_accounts_to_disk_internal() -> Result<(), String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("锁获取失败: {}", e))?;

    if let Some(app) = APP_HANDLE.get() {
        // 内存中的 token 同步入密钥环（新登录的账户首次落盘时入环）
        for account in manager.accounts.values() {
            let _ = set_account_tokens(app, account);
        }
    }

    let disk: DiskAccountManager = (&*manager).into();
    config_manager()?.write_section("accounts", &disk)?;
    log_info!("账号文件保存成功（token 已剥离，仅存密钥环）");
    Ok(())
}

/// 获取统一配置管理器（经 APP_HANDLE 定位，与 window.rs 同模式）
fn config_manager() -> Result<tauri::State<'static, ConfigManager>, String> {
    APP_HANDLE
        .get()
        .ok_or_else(|| "APP_HANDLE 未初始化".to_string())
        .map(|h| h.state::<ConfigManager>())
}

/// 公共保存接口（如果需要手动强制保存）

// ======================== 核心方法 ========================
impl Account {
    /// 创建新账户，自动生成 UUID 和创建时间
    pub fn new(
        name: String,
        account_type: AccountType,
        access_token: Option<String>,
        refresh_token: Option<String>,
    ) -> Self {
        // Microsoft -> uuid根据正版账号获取
        // Offline/ThirdParty -> uuid随机生成(第三方账户不确定是否需要根据相应api来获取)
        // Admin -> admin账户不属于mc账户，无uuid
        let uuid = match &account_type {
            AccountType::None => Uuid::nil().to_string(),
            AccountType::Microsoft => Uuid::new_v4().to_string(),
            AccountType::Offline => {
                const MC_OFFLINE_NAMESPACE: Uuid =
                    Uuid::from_u128(0x00000000000000000000000000000000);
                let input = format!("OfflinePlayer:{}", name);
                Uuid::new_v3(&MC_OFFLINE_NAMESPACE, input.as_bytes()).to_string()
            }
            AccountType::ThirdParty => {
                // 第三方账号的uuid自动生成
                Uuid::new_v4().to_string()
            }
            AccountType::Admin => {
                // 服主账户无uuid
                Uuid::nil().to_string()
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

    /// 更新最后登录时间为当前时间
    pub fn update_last_login(&mut self) {
        self.info.last_login_time = Some(Local::now().to_rfc3339());
    }
}

// ======================== 全局状态操作 ========================

/// 初始化全局账户管理器
pub fn init_account_manager() {
    ACCOUNT_MANAGER
        .set(Mutex::new(AccountManager::default()))
        .unwrap_or_else(|_| panic!("账户管理器已初始化"));
}

/// 向管理器添加账户并自动保存到磁盘
pub fn add_account_to_manager(account: Option<Account>) -> Result<(), String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    if let Some(acc) = account {
        let uuid = acc.info.uuid.clone();
        if manager.accounts.contains_key(&uuid) {
            return Err(format!("账户 {} 已存在", uuid));
        }

        manager.accounts.insert(uuid, acc);
    }

    // 释放锁后再保存（避免死锁）
    drop(manager);
    save_accounts_to_disk_internal()?; // 修改后自动保存
    auto_select_default_account()?;

    Ok(())
}

/// 设置当前活动账户（内部使用）
#[allow(dead_code)]
pub fn set_current_account_internal(uuid: String) -> Result<String, String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    if !manager.accounts.contains_key(&uuid) {
        return Err(format!("账户 {} 不存在", uuid));
    }

    manager.current_uuid = Some(uuid.clone());

    if let Some(account) = manager.accounts.get_mut(&uuid) {
        account.update_last_login();
    }

    drop(manager);
    save_accounts_to_disk_internal()?; // 修改后自动保存

    Ok(format!("账户 {} 已设为当前账户", uuid))
}

/// 当前无选中账户且列表非空时，自动选择一个默认账户
/// 正版/第三方要求持有登录凭证，离线账户可直接选择
fn auto_select_default_account() -> Result<Option<String>, String> {
    let mut manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    if manager.current_uuid.is_some() || manager.accounts.is_empty() {
        return Ok(None);
    }

    let picked = manager
        .accounts
        .values()
        .filter(|a| match a.info.account_type {
            AccountType::Microsoft | AccountType::ThirdParty => {
                a.access_token.is_some() && a.refresh_token.is_some()
            }
            _ => true,
        })
        .max_by_key(|a| a.info.create_time.clone())
        .map(|a| a.info.uuid.clone());

    let Some(uuid) = picked else {
        return Ok(None);
    };

    manager.current_uuid = Some(uuid.clone());
    if let Some(account) = manager.accounts.get_mut(&uuid) {
        account.update_last_login();
    }

    drop(manager);
    save_accounts_to_disk_internal()?;

    log_info!("自动选择默认账户: {}", uuid);
    Ok(Some(uuid))
}

// ======================== Tauri 前端命令 ========================

/// 初始化账户系统（加载磁盘中的账户数据），推荐在应用启动时调用一次
#[command]
pub fn initialize_account_system() -> Result<(), String> {
    // 确保账户管理器已初始化
    if ACCOUNT_MANAGER.get().is_none() {
        ACCOUNT_MANAGER
            .set(Mutex::new(AccountManager::default()))
            .map_err(|_| "账户管理器已初始化".to_string())?;
        println!("✅ 账户管理器初始化完成");
    }
    load_accounts_from_disk_internal()?;
    auto_select_default_account()?;
    Ok(())
}

/// 添加新账户（支持 microsoft/offline 两种类型）
#[command]
pub fn add_player_account(
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
    add_account_to_manager(Some(account))?;

    Ok(format!("账户创建成功，UUID: {}", uuid))
}

/// 获取所有已保存账户的列表
#[command]
pub fn get_account_list() -> Result<Vec<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    Ok(manager.accounts.values().map(|a| a.info.clone()).collect())
}

/// 获取当前选中的活动账户信息
#[command]
pub fn get_current_account() -> Result<Option<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    Ok(manager
        .current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .map(|a| a.info.clone()))
}

/// 获取当前账户的访问令牌（微软账户有效，离线账户返回 None）
#[command]
pub fn get_current_account_token() -> Result<Option<String>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    Ok(manager
        .current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .and_then(|a| a.access_token.clone()))
}

/// 删除指定 UUID 的账户
/// 正版账户删除时同步清除系统密钥环中对应的登录凭证，避免泄漏
#[command]
pub fn delete_account(app: tauri::AppHandle, uuid: String) -> Result<String, String> {
    let (deleted_type, deleted_name) = {
        let mut manager = ACCOUNT_MANAGER
            .get()
            .ok_or("账户管理器未初始化")?
            .lock()
            .map_err(|e| format!("获取账户锁失败: {}", e))?;

        let removed = manager
            .accounts
            .remove(&uuid)
            .ok_or_else(|| format!("账户 {} 不存在", uuid))?;

        if manager.current_uuid.as_deref() == Some(&uuid) {
            manager.current_uuid = None;
        }

        (removed.info.account_type, removed.info.name)
    };

    if let AccountType::Microsoft = deleted_type {
        if let Ok(token) = get_mc_token(&app) {
            if token.username == deleted_name {
                match delete_mc_token(&app) {
                    Ok(()) => {
                        println!("[delete_account] 已清除账户 {} 的密钥环登录凭证", deleted_name);
                    }
                    Err(e) => {
                        println!("[delete_account] 清除密钥环凭据失败: {}", e);
                    }
                }
            }
        }
    }

    // 清理按账户存储的密钥环 token
    delete_account_tokens_from_keyring(&app, &uuid);

    save_accounts_to_disk_internal()?; // 修改后自动保存
    auto_select_default_account()?;

    Ok(format!("账户 {} 删除成功", uuid))
}

/// 设置指定 UUID 的账户为当前活动账户
#[command]
pub fn set_current_account(uuid: String) -> Result<String, String> {
    set_current_account_internal(uuid)
}
