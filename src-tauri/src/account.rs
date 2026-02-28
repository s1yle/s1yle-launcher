// src-tauri/src/account.rs
use tauri::command;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use once_cell::sync::OnceCell;
use std::{
    sync::{Mutex, Arc},
    collections::HashMap,
};
use chrono::{DateTime, FixedOffset, Local, TimeZone, Utc, format::ParseError};

// ======================== 类型定义 ========================
/// 账户类型枚举（强类型替代字符串，避免魔法值）
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum AccountType {
    #[serde(rename = "microsoft")]
    Microsoft,
    #[serde(rename = "offline")]
    Offline,
}

/// 账户信息结构体（序列化友好，用于前端交互）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AccountInfo {
    pub name: String,
    pub account_type: AccountType,
    pub uuid: String,
    pub create_time: String, // ISO 8601 格式: "2026-02-27T12:34:56+08:00"
    pub last_login_time: Option<String>, // 新增：最后登录时间
}

/// 完整账户结构体（包含后端内部使用的字段）
#[derive(Clone, Debug)]
pub struct Account {
    pub info: AccountInfo,
    pub access_token: Option<String>, // 微软账户的访问令牌
    pub refresh_token: Option<String>, // 微软账户的刷新令牌
}

// ======================== 全局状态 ========================
/// 全局账户管理器：支持多账户存储 + 当前选中账户
struct AccountManager {
    accounts: HashMap<String, Account>, // key: uuid
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

// 全局账户管理器实例（Arc 支持多线程共享）
static ACCOUNT_MANAGER: OnceCell<Mutex<AccountManager>> = OnceCell::new();

// ======================== 核心方法 ========================
impl Account {
    /// 创建新账户（封装 MC 标准 UUID 生成逻辑）
    pub fn new(
        name: String,
        account_type: AccountType,
        access_token: Option<String>,
        refresh_token: Option<String>,
    ) -> Self {
        // 生成符合 MC 规范的 UUID
        let uuid = match &account_type {
            AccountType::Microsoft => {
                // 微软账户 UUID 由微软认证接口返回，这里先随机生成（实际应从认证结果获取）
                Uuid::new_v4().to_string()
            }
            AccountType::Offline => {
                // MC 离线账户 UUID 生成规则：Namespace + "OfflinePlayer:" + 用户名
                const MC_OFFLINE_NAMESPACE: Uuid = Uuid::from_u128(0x00000000000000000000000000000000);
                let input = format!("OfflinePlayer:{}", name);
                Uuid::new_v3(&MC_OFFLINE_NAMESPACE, input.as_bytes()).to_string()
            }
        };

        // 获取当前时间（ISO 8601 格式，带时区）
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

    /// 更新账户最后登录时间
    pub fn update_last_login(&mut self) {
        self.info.last_login_time = Some(Local::now().to_rfc3339());
    }

    /// 解析时间字符串为 DateTime（辅助方法）
    pub fn parse_time(time_str: &str) -> Result<DateTime<FixedOffset>, ParseError> {
        DateTime::parse_from_str(time_str, "%Y-%m-%dT%H:%M:%S%.f%:z")
    }
}

// ======================== 全局状态操作 ========================
/// 初始化账户管理器（确保全局状态只初始化一次）
pub fn init_account_manager() {
    ACCOUNT_MANAGER
        .set(Mutex::new(AccountManager::default()))
        .unwrap_or_else(|_| panic!("账户管理器已初始化，不可重复调用"));
    println!("✅ 账户管理器初始化完成");
}

/// 添加账户到全局管理器
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
    Ok(())
}

/// 设置当前选中账户
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
    // 更新最后登录时间
    if let Some(account) = manager.accounts.get_mut(uuid) {
        account.update_last_login();
    }

    Ok(())
}

// ======================== Tauri 前端命令 ========================
/// 添加账户（前端调用）
#[command]
pub fn add_account(
    name: String,
    account_type: String,
    access_token: Option<String>,
    refresh_token: Option<String>,
) -> Result<String, String> {

    tracing::info!(
        "收到 add_account 请求: name={}, account_type={}, access_token={}, refresh_token={}",
        name,
        account_type,
        access_token.is_some(),
        refresh_token.is_some()
    );

    if name.is_empty() {
        return Err("用户名不能为空".to_string());
    }

    // 用户名不能包含非法字符（模拟 MC 规则：只允许字母、数字、下划线）
    if !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(format!("用户名 '{}' 包含非法字符，仅允许字母、数字、下划线", name));
    }

    // 转换并验证账户类型
    let account_type = match account_type.as_str() {
        "microsoft" => AccountType::Microsoft,
        "offline" => AccountType::Offline,
        _ => return Err(format!("不支持的账户类型: {}", account_type)),
    };

    // 根据账户类型验证 token
    match account_type {
        AccountType::Microsoft => {
            // 微软账户必须有 access_token
            if access_token.is_none() {
                return Err("微软账户必须提供 access_token".to_string());
            }
            // 可选：也可以要求 refresh_token 必须存在
            if refresh_token.is_none() {
                return Err("微软账户必须提供 refresh_token".to_string());
            }
        }
        AccountType::Offline => {
            // 离线账户不需要 token，即使传了也可以忽略（或者提示）
            if access_token.is_some() || refresh_token.is_some() {
                println!("警告：离线账户不需要 token，已忽略");
            }
        }
    }
    
    // 创建账户
    let account = Account::new(name, account_type, access_token, refresh_token);
    let uuid = account.info.uuid.clone();

    add_account_to_manager(account)?;

    // 持久化存储
    

    Ok(format!("账户创建成功，UUID: {}", uuid))
}

/// 获取账户列表（前端调用）
#[command]
pub fn get_account_list() -> Result<Vec<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    // 转换为前端需要的 AccountInfo 列表
    let account_list: Vec<AccountInfo> = manager
        .accounts
        .values()
        .map(|account| account.info.clone())
        .collect();

    Ok(account_list)
}

/// 获取当前选中的账户信息（前端调用）
#[command]
pub fn get_current_account() -> Result<Option<AccountInfo>, String> {
    let manager = ACCOUNT_MANAGER
        .get()
        .ok_or("账户管理器未初始化")?
        .lock()
        .map_err(|e| format!("获取账户锁失败: {}", e))?;

    let current_account = manager
        .current_uuid
        .as_ref()
        .and_then(|uuid| manager.accounts.get(uuid))
        .map(|account| account.info.clone());

    Ok(current_account)
}

/// 删除账户（前端调用）
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

    // 如果删除的是当前账户，清空当前选中
    if manager.current_uuid.as_deref() == Some(&uuid) {
        manager.current_uuid = None;
    }

    Ok(format!("账户 {} 删除成功", uuid))
}

// ======================== 测试示例 ========================
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_offline_account_uuid() {
        // 初始化管理器
        init_account_manager();

        // 创建离线账户
        let account = Account::new(
            "Notch".to_string(),
            AccountType::Offline,
            None,
            None,
        );

        // MC 离线账户 "Notch" 的标准 UUID 是 069a79f4-44e9-4726-a5be-fca90e38aaf5
        assert_eq!(
            account.info.uuid,
            "069a79f4-44e9-4726-a5be-fca90e38aaf5"
        );
    }

    #[test]
    fn test_add_and_get_account() {
        init_account_manager();

        // 添加账户
        let result = add_account(
            "TestPlayer".to_string(),
            "offline".to_string(),
            None,
            None,
        );
        assert!(result.is_ok());

        // 获取账户列表
        let list = get_account_list().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "TestPlayer");
    }
}