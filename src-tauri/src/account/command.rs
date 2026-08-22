//! 账户模块 Tauri 前端命令

use crate::account::manager::{
    add_account_to_manager, auto_select_default_account, delete_account_credentials,
    get_current_account_token_internal, get_login_state_internal, init_account_manager,
    is_initialized, load_accounts_from_disk_internal, lock_manager, set_current_account_internal,
    set_login_state_internal, save_accounts_to_disk_internal,
};
use crate::account::models::{Account, AccountInfo, StoreLoginState};
use crate::shared::types::AccountType;
use tauri::AppHandle;
use tauri::command;

/// 初始化账户系统（加载磁盘中的账户数据），推荐在应用启动时调用一次
#[command]
pub fn initialize_account_system(app: AppHandle) -> Result<(), String> {
    if !is_initialized() {
        init_account_manager();
    }
    load_accounts_from_disk_internal(&app)?;
    auto_select_default_account(&app)?;
    Ok(())
}

/// 添加新账户（offline / third-party）
/// 微软账户必须通过 poll_and_complete_login（后端全程 OAuth，token 绝不经过前端）
#[command]
pub fn add_player_account(
    app: AppHandle,
    name: String,
    account_type: String,
) -> Result<String, String> {
    if name.is_empty() {
        return Err("用户名不能为空".to_string());
    }
    if !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(format!("用户名 '{}' 包含非法字符", name));
    }

    let account_type = match account_type.as_str() {
        "microsoft" => {
            return Err("微软账户请通过设备码登录流程添加".to_string());
        }
        "offline" => AccountType::Offline,
        "third-party" => AccountType::ThirdParty,
        _ => return Err(format!("不支持的账户类型: {}", account_type)),
    };

    let account = Account::new(name, account_type, None, None);
    let uuid = account.info.uuid.clone();
    add_account_to_manager(&app, Some(account))?;

    Ok(format!("账户创建成功，UUID: {}", uuid))
}

/// 获取所有已保存账户的列表
#[command]
pub fn get_account_list() -> Result<Vec<AccountInfo>, String> {
    let manager = lock_manager()?;
    Ok(manager.accounts.values().map(|a| a.info.clone()).collect())
}

/// 获取当前选中的活动账户信息
#[command]
pub fn get_current_account() -> Result<Option<AccountInfo>, String> {
    let manager = lock_manager()?;
    Ok(manager
        .current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .map(|a| a.info.clone()))
}

/// 获取当前活动账户的访问令牌（仅微软账户有值，离线账户为 None）
#[command]
pub fn get_current_account_token() -> Result<Option<String>, String> {
    get_current_account_token_internal()
}

/// 获取登录状态（启动时用于判断是否展示登录门禁）
#[command]
pub fn get_login_state() -> Result<StoreLoginState, String> {
    get_login_state_internal()
}

/// 保存登录状态（玩家登录/管理员登录成功后调用）
#[command]
pub fn save_login_state(app: AppHandle, login_state: StoreLoginState) -> Result<(), String> {
    set_login_state_internal(&app, login_state)
}

/// 清除登录状态（登出时调用）
#[command]
pub fn clear_login_state(app: AppHandle) -> Result<(), String> {
    set_login_state_internal(&app, StoreLoginState::default())
}

/// 删除指定 UUID 的账户
/// 正版账户删除时同步清除系统密钥环中对应的登录凭证，避免泄漏
#[command]
pub fn delete_account(app: AppHandle, uuid: String) -> Result<String, String> {
    let (deleted_type, deleted_name) = {
        let mut manager = lock_manager()?;

        let removed = manager
            .accounts
            .remove(&uuid)
            .ok_or_else(|| format!("账户 {} 不存在", uuid))?;

        if manager.current_uuid.as_deref() == Some(&uuid) {
            manager.current_uuid = None;
        }

        (removed.info.account_type, removed.info.name)
    };

    delete_account_credentials(
        &app,
        &uuid,
        &deleted_name,
        deleted_type == AccountType::Microsoft,
    );

    save_accounts_to_disk_internal(&app)?; // 修改后自动保存
    auto_select_default_account(&app)?;

    Ok(format!("账户 {} 删除成功", uuid))
}

/// 设置指定 UUID 的账户为当前活动账户
#[command]
pub fn set_current_account(app: AppHandle, uuid: String) -> Result<String, String> {
    set_current_account_internal(&app, uuid)
}
