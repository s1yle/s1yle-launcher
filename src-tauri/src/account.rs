// src-tauri/src/account.rs

// 导入tauri和serde
use tauri::command;
use serde::{Deserialize, Serialize};

/// 账户信息结构体
#[derive(Serialize,Deserialize)]
pub struct AccountInfo {
    pub name: String,
    pub account_type: String,
    pub create_time: String,
}

#[command] 
pub fn add_account(name: String) -> String {
    format!("调用了 rust 后端的 add_account 方法, {}", name)
}

/// 获取账户列表的命令
#[command]
pub fn get_account_list() -> Vec<AccountInfo> {
    // 模拟返回账户列表
    vec![
        AccountInfo {
            name: "离线账户123".to_string(),
            account_type: "offline".to_string(),
            create_time: "2026-02-24".to_string(),
        },
        AccountInfo {
            name: "微软账户test".to_string(),
            account_type: "microsoft".to_string(),
            create_time: "2026-02-24".to_string(),
        },
    ]
}

pub fn get_account_info(name: &str) -> AccountInfo {
    // 模拟根据账户名称返回账户信息
    AccountInfo {
        name: name.to_string(),
        account_type: "offline".to_string(),
        create_time: "2026-02-24".to_string(),
    }
}

pub fn get_cur_account_info() -> AccountInfo {
    // 模拟返回当前账户信息
    AccountInfo {
        name: "当前账户".to_string(),
        account_type: "offline".to_string(),
        create_time: "2026-02-24".to_string(),
    }
}

pub fn gen_uuid() {
    let buf: [u8; 5] = *b"steve";
    get_cur_account_info();
}