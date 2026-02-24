// src-tauri/src/account.rs

// 导入tauri和serde（如果用到序列化）
use tauri::command;
use serde::Serialize;

/// 账户信息结构体
#[derive(Serialize)]
pub struct AccountInfo {
    pub name: String,
    pub account_type: String,
    pub create_time: String,
}

#[command] // 等同于 #[tauri::command]，因为上面导入了use tauri::command;
pub fn add_account(name: &str) -> String {
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