//! 账户模块类型定义

use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

pub use crate::types::AccountType;

/// 登录状态（持久化到 accounts 节的 login_state 字段）
/// 当前账户由 accounts.current_uuid 单一事实源提供
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StoreLoginState {
    /// 是否已登录
    pub is_logged_in: bool,
    /// 登录类型（none/offline/microsoft/admin）
    pub logged_in_type: AccountType,
    /// 登录时间
    pub login_time: String,
}

impl Default for StoreLoginState {
    fn default() -> Self {
        Self {
            is_logged_in: false,
            logged_in_type: AccountType::None,
            login_time: Local::now().to_rfc3339(),
        }
    }
}

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

/// 完整账户信息（含 Token，仅内存持有）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Account {
    pub info: AccountInfo,
    /// 微软账户访问令牌
    #[serde(skip)]
    pub access_token: Option<String>,
    /// 微软账户刷新令牌
    #[serde(skip)]
    pub refresh_token: Option<String>,
}

impl Account {
    /// 创建新账户，自动生成 UUID 和创建时间
    pub fn new(
        name: String,
        account_type: AccountType,
        access_token: Option<String>,
        refresh_token: Option<String>,
    ) -> Self {
        let uuid = match account_type {
            AccountType::Microsoft | AccountType::ThirdParty => {
                // 第三方账号的uuid自动生成
                Uuid::new_v4().to_string()
            }
            AccountType::Offline => {
                const MC_OFFLINE_NAMESPACE: Uuid =
                    Uuid::from_u128(0x00000000000000000000000000000000);
                let input = format!("OfflinePlayer:{}", name);
                Uuid::new_v3(&MC_OFFLINE_NAMESPACE, input.as_bytes()).to_string()
            }
            AccountType::Admin => {
                // 服主账户无uuid
                Uuid::nil().to_string()
            }
            AccountType::None => Uuid::nil().to_string(),
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

/// 账户管理器（内存状态，唯一持久化结构）
/// token 字段由 `#[serde(skip)]` 保证绝不落盘，仅存系统密钥环；
/// 登录状态与账户同节持久化
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AccountManager {
    pub accounts: HashMap<String, Account>,
    pub current_uuid: Option<String>,
    #[serde(default)]
    pub login_state: StoreLoginState,
}

impl Default for AccountManager {
    fn default() -> Self {
        Self {
            accounts: HashMap::new(),
            current_uuid: None,
            login_state: StoreLoginState::default(),
        }
    }
}
