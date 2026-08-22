//! 账户管理器核心逻辑：全局状态、系统密钥环存取、磁盘持久化
//!
//! 磁盘持久化统一走 `config_io`（`.wecraft.json` 的 `accounts` 顶层键），
//! 运行时依赖通过 `&AppHandle` 传入：配置路径经 `AppContext` 推导，
//! token 经系统密钥环读写。不再使用全局 `APP_HANDLE` / `ConfigManager`。

use crate::account::models::{Account, AccountManager, StoreLoginState};
use crate::account::store;
use crate::account::token_store::{delete_mc_token, get_mc_token};
use crate::app_context::AppContext;
use crate::config_io;
use crate::log_info;
use once_cell::sync::OnceCell;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use tauri::AppHandle;
use tauri_plugin_keyring::{CredentialType, CredentialValue, KeyringExt};

/// 全局账户管理器游戏
static ACCOUNT_MANAGER: OnceCell<Mutex<AccountManager>> = OnceCell::new();

/// 初始化全局账户管理器
pub fn init_account_manager() {
    ACCOUNT_MANAGER
        .set(Mutex::new(AccountManager::default()))
        .unwrap_or_else(|_| panic!("账户管理器已初始化"));
}

/// 配置路径（经 AppContext 推导）
fn config_path(app: &AppHandle) -> PathBuf {
    app.state::<AppContext>().launcher_config_path()
}

/// 获取账户管理器全局锁
pub(crate) fn lock_manager() -> Result<std::sync::MutexGuard<'static, AccountManager>, String> {
    ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化".to_string())
        .and_then(|m| m.lock().map_err(|e| format!("获取账户锁失败: {}", e)))
}

/// 账户管理器是否已初始化
pub(crate) fn is_initialized() -> bool {
    ACCOUNT_MANAGER.get().is_some()
}

// ======================== keyring token 存储 ========================

/// keyring 键：mc_account_{uuid}
fn account_token_key(uuid: &str) -> String {
    format!("mc_account_{}", uuid)
}

/// 将账户 token 写入系统密钥环（Secret 类型，JSON 序列化，重复调用幂等）
fn set_account_tokens(app: &AppHandle, account: &Account) -> Result<(), String> {
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
fn get_account_tokens(app: &AppHandle, uuid: &str) -> Option<(Option<String>, Option<String>)> {
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
fn delete_account_tokens_from_keyring(app: &AppHandle, uuid: &str) {
    let _ = app
        .keyring()
        .delete(&account_token_key(uuid), CredentialType::Secret);
}

// ======================== 磁盘持久化 ========================

/// 从磁盘加载账户数据（启动时调用一次，幂等）。
/// AccountManager 直接反序列化（token 字段被 `#[serde(skip)]` 忽略）；
/// 旧格式残留的磁盘明文 token 迁移到系统密钥环，登录状态从 app 节旧字段迁移。
pub(crate) fn load_accounts_from_disk_internal(app: &AppHandle) -> Result<(), String> {
    let path = config_path(app);
    let raw: Value = store::load_accounts_raw(&path);
    let mut loaded: AccountManager = serde_json::from_value(raw.clone()).unwrap_or_default();

    let mut migrated = false;
    {
        // 1. 旧格式残留 token（磁盘明文）→ 迁移入系统密钥环
        if let Some(accounts) = raw.get("accounts").and_then(|v| v.as_object()) {
            for (uuid, acc_json) in accounts {
                let access_token = acc_json
                    .get("access_token")
                    .and_then(|v| v.as_str())
                    .map(String::from);
                let refresh_token = acc_json
                    .get("refresh_token")
                    .and_then(|v| v.as_str())
                    .map(String::from);
                if access_token.is_some() || refresh_token.is_some() {
                    let payload = serde_json::to_vec(&(access_token, refresh_token))
                        .map_err(|e| format!("序列化 token 失败: {}", e))?;
                    app.keyring()
                        .set(
                            &account_token_key(uuid),
                            CredentialType::Secret,
                            CredentialValue::Secret(payload),
                        )
                        .map_err(|e| format!("写入密钥环失败: {}", e))?;
                    migrated = true;
                }
            }
        }
        // 2. 从密钥环恢复 token 到内存（重启后启动/展示需要）
        for account in loaded.accounts.values_mut() {
            if account.access_token.is_none() && account.refresh_token.is_none() {
                if let Some((access_token, refresh_token)) = get_account_tokens(app, &account.info.uuid)
                {
                    account.access_token = access_token;
                    account.refresh_token = refresh_token;
                }
            }
        }
        // 3. 登录状态迁移：accounts 节无 login_state 时，从 app 节旧字段读取
        if raw.get("login_state").is_none() {
            if let Some(app_section) = store::load_app_raw(&path) {
                if let Some(ls) = app_section.get("login_state") {
                    if let Ok(state) = serde_json::from_value::<StoreLoginState>(ls.clone()) {
                        loaded.login_state = state;
                        migrated = true;
                    }
                }
            }
        }
    }

    {
        let mut manager = lock_manager()?;
        *manager = loaded;
    }

    if migrated {
        // 迁移后立即落盘一次，剥离磁盘上的残留 token / 写入 login_state
        save_accounts_to_disk_internal(app)?;
    }
    Ok(())
}

/// 将当前内存中的账户数据保存到磁盘（accounts 节）。
/// token 先同步到系统密钥环，磁盘仅写入剥离版（token 字段 `#[serde(skip)]`）。
pub(crate) fn save_accounts_to_disk_internal(app: &AppHandle) -> Result<(), String> {
    let manager = lock_manager()?;

    // 内存中的 token 同步入密钥环（新登录的账户首次落盘时入环）
    for account in manager.accounts.values() {
        let _ = set_account_tokens(app, account);
    }

    let path = config_path(app);
    store::save_accounts(&path, &manager)?;
    log_info!("账号文件保存成功（token 已剥离，仅存密钥环）");
    Ok(())
}

// ======================== 登录状态 ========================

/// 获取登录状态
pub(crate) fn get_login_state_internal() -> Result<StoreLoginState, String> {
    let manager = lock_manager()?;
    Ok(manager.login_state.clone())
}

/// 更新登录状态并保存到磁盘
pub(crate) fn set_login_state_internal(
    app: &AppHandle,
    state: StoreLoginState,
) -> Result<(), String> {
    {
        let mut manager = lock_manager()?;
        manager.login_state = state;
    }
    save_accounts_to_disk_internal(app)
}

// ======================== 核心操作 ========================

/// 向管理器添加账户并自动保存到磁盘
pub fn add_account_to_manager(
    app: &AppHandle,
    account: Option<Account>,
) -> Result<(), String> {
    let mut manager = lock_manager()?;

    if let Some(acc) = account {
        let uuid = acc.info.uuid.clone();
        if manager.accounts.contains_key(&uuid) {
            return Err(format!("账户 {} 已存在", uuid));
        }

        manager.accounts.insert(uuid, acc);
    }

    // 释放锁后再保存（避免死锁）
    drop(manager);
    save_accounts_to_disk_internal(app)?; // 修改后自动保存
    auto_select_default_account(app)?;

    Ok(())
}

/// 设置当前活动账户（内部使用）
pub(crate) fn set_current_account_internal(
    app: &AppHandle,
    uuid: String,
) -> Result<String, String> {
    let mut manager = lock_manager()?;

    if !manager.accounts.contains_key(&uuid) {
        return Err(format!("账户 {} 不存在", uuid));
    }

    manager.current_uuid = Some(uuid.clone());

    if let Some(account) = manager.accounts.get_mut(&uuid) {
        account.update_last_login();
    }

    drop(manager);
    save_accounts_to_disk_internal(app)?; // 修改后自动保存

    Ok(format!("账户 {} 已设为当前账户", uuid))
}

/// 当前无选中账户且列表非空时，自动选择一个默认账户
/// 正版/第三方要求持有登录凭证，离线账户可直接选择
pub(crate) fn auto_select_default_account(
    app: &AppHandle,
) -> Result<Option<String>, String> {
    let mut manager = lock_manager()?;

    if manager.current_uuid.is_some() || manager.accounts.is_empty() {
        return Ok(None);
    }

    let picked = manager
        .accounts
        .values()
        .filter(|a| match a.info.account_type {
            crate::shared::types::AccountType::Microsoft | crate::shared::types::AccountType::ThirdParty => {
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
    save_accounts_to_disk_internal(app)?;

    log_info!("自动选择默认账户: {}", uuid);
    Ok(Some(uuid))
}

/// 获取当前账户的访问令牌（微软账户有效，离线账户返回 None）
pub(crate) fn get_current_account_token_internal() -> Result<Option<String>, String> {
    let manager = lock_manager()?;

    Ok(manager
        .current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .and_then(|a| a.access_token.clone()))
}

/// 删除指定 UUID 账户的密钥环凭据（含微软登录原始响应，按用户名比对）
pub(crate) fn delete_account_credentials(
    app: &AppHandle,
    uuid: &str,
    name: &str,
    is_microsoft: bool,
) {
    if is_microsoft {
        if let Ok(token) = get_mc_token(app) {
            if token.username == name {
                match delete_mc_token(app) {
                    Ok(()) => log_info!("已清除账户 {} 的密钥环登录凭证", name),
                    Err(e) => log_info!("清除密钥环凭据失败: {}", e),
                }
            }
        }
    }
    delete_account_tokens_from_keyring(app, uuid);
}
