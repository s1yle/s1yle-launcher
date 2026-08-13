//! Microsoft 账户登录模块

mod oauth;
#[cfg(test)]
mod tests;
pub mod token_store;
mod types;
mod uuid;
mod xbox;

use crate::account::{add_account_to_manager, Account, AccountInfo};
use crate::microsoft_login::token_store::set_mc_token;
use crate::types::AccountType;
use chrono::Local;
pub use oauth::{get_devicecode, get_user_authorize};
use serde::{Deserialize, Serialize};
use std::future::Future;
pub use types::*;
pub use uuid::get_user_uuid;
pub use xbox::{get_minecraft_access_token, get_xbox_live_validation, get_xsts_validation};
use tauri::Emitter;
use tokio_util::sync::CancellationToken;

use tauri::command;

const CLIENT_ID: &str = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd";

/// 登录进度事件，每一步操作开始时推送给前端
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginProgressEvent {
    pub step: String,
    pub message: String,
}

pub const LOGIN_PROGRESS_EVENT: &str = "login-progress";

/// 向所有前端窗口广播登录进度
fn emit_progress(app: &tauri::AppHandle, step: &str, message: &str) {
    let _ = app.emit(
        LOGIN_PROGRESS_EVENT,
        LoginProgressEvent {
            step: step.to_string(),
            message: message.to_string(),
        },
    );
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrontendDeviceCodeResponse {
    user_code: String,
    url: String,
}

/// 获取 Microsoft 设备码并启动登录流程
/// 若上一轮流程仍活跃，先将其取消并中止
#[command]
pub async fn start_device_code(app: tauri::AppHandle) -> Result<FrontendDeviceCodeResponse, String> {
    println!("[start_device_code] 开始获取 device_code");
    emit_progress(&app, "device-code", "正在获取设备码...");
    {
        let mut session = SESSION.lock().await;
        if matches!(session.status, LoginStatus::Polling | LoginStatus::Completing) {
            println!("[start_device_code] 终止上一轮登录流程");
            session.cancel.cancel();
            if let Some(h) = session.poll_handle.take() {
                h.abort();
            }
        }
        session.status = LoginStatus::Polling;
        session.device_code = None;
        session.cancel = CancellationToken::new();
    }

    let client_id = CLIENT_ID.to_string();
    let device_code_result = get_devicecode(&client_id).await;
    let user_code = match device_code_result {
        Ok(code) => code,
        Err(e) => {
            let msg = e.to_string();
            println!("[start_device_code] get_devicecode 失败: {}", msg);
            drop(e);
            SESSION.lock().await.status = LoginStatus::Idle;
            return Err(msg);
        }
    };
    println!("[start_device_code] 成功: user_code={}", user_code.user_code);
    emit_progress(&app, "polling", "设备码已生成，请在网页中输入验证码并完成授权");

    Ok(FrontendDeviceCodeResponse {
        user_code: user_code.user_code,
        url: user_code.verification_uri,
    })
}

/// 取消 Microsoft 设备码登录流程
/// 触发取消令牌并中止轮询任务，会话进入终态，任务内凭证随之销毁
#[command]
pub async fn cancel_device_code() -> Result<(), String> {
    println!("[cancel_device_code] 用户取消登录流程");
    let mut session = SESSION.lock().await;
    session.cancel.cancel();
    if let Some(h) = session.poll_handle.take() {
        h.abort();
    }
    session.status = LoginStatus::Cancelled;
    session.device_code = None;
    println!("[cancel_device_code] 已取消登录流程并清理会话");
    Ok(())
}

/// 查询当前登录流程状态
#[command]
pub async fn get_login_status() -> Result<LoginStatus, String> {
    let session = SESSION.lock().await;
    Ok(session.status)
}

/// 在取消令牌与异步操作之间选择，取消信号到达后立即终止当前步骤
async fn run_cancellable<T, E, F>(cancel: &CancellationToken, f: F) -> Result<T, String>
where
    E: std::fmt::Display,
    F: Future<Output = Result<T, E>>,
{
    tokio::select! {
        _ = cancel.cancelled() => Err("用户已取消登录".to_string()),
        r = f => r.map_err(|e| e.to_string()),
    }
}

/// 完成 Microsoft 登录全流程
/// 轮询授权 + Xbox Live / XSTS / Minecraft 认证 + UUID 获取 + 凭据存储 + 账户入库
/// 全程在 Rust 端完成，不向前端暴露任何 Token 敏感信息；
/// 任何步骤均可被取消，取消后流程立即终止且不会产生账户
#[command]
pub async fn poll_and_complete_login(app: tauri::AppHandle) -> Result<AccountInfo, String> {
    println!("[poll_and_complete_login] 开始 Microsoft 登录全流程");
    emit_progress(&app, "polling", "正在等待用户授权...");

    let (code, cancel) = {
        let mut session = SESSION.lock().await;
        if session.status != LoginStatus::Polling {
            let msg = match session.status {
                LoginStatus::Cancelled => "登录已取消".to_string(),
                LoginStatus::Idle => "登录未开始".to_string(),
                _ => "登录流程已在进行中".to_string(),
            };
            println!("[poll_and_complete_login] 状态机守卫拒绝: {}", msg);
            return Err(msg);
        }
        session.status = LoginStatus::Completing;
        let code = session.device_code.take().ok_or_else(|| {
            println!("[poll_and_complete_login] device_code 未设置");
            "device_code is not set".to_string()
        })?;
        (code, session.cancel.clone())
    };

    let client_id = CLIENT_ID.to_string();
    println!("[poll_and_complete_login] 启动授权轮询...");
    let handle = get_user_authorize(client_id, code, cancel.clone())
        .await
        .map_err(|e| {
            println!("[poll_and_complete_login] get_user_authorize 失败: {}", e);
            e
        })?;
    SESSION.lock().await.poll_handle = Some(handle.abort_handle());

    let token = handle
        .await
        .map_err(|e| {
            if cancel.is_cancelled() {
                return "用户已取消登录".to_string();
            }
            println!("[poll_and_complete_login] 轮询任务异常终止: {}", e);
            format!("轮询任务异常终止: {}", e)
        })?
        .map_err(|e| {
            println!("[poll_and_complete_login] 授权轮询失败: {}", e);
            e
        })?;
    println!("[poll_and_complete_login] OAuth token 已获取");
    emit_progress(&app, "authorized", "授权成功，正在完成登录...");

    println!("[poll_and_complete_login] 执行 Xbox Live 认证...");
    emit_progress(&app, "xbox", "正在完成 Xbox Live 认证...");
    let xbl = run_cancellable(&cancel, get_xbox_live_validation(&token.access_token)).await?;
    let uhs = xbl
        .display_claims
        .xui
        .first()
        .map(|x| x.uhs.as_str())
        .ok_or_else(|| "uhs not found".to_string())?;

    println!("[poll_and_complete_login] 执行 XSTS 认证...");
    emit_progress(&app, "xsts", "正在完成 XSTS 认证...");
    let xsts = run_cancellable(&cancel, get_xsts_validation(&vec![xbl.token])).await?;

    println!("[poll_and_complete_login] 执行 Minecraft 登录...");
    emit_progress(&app, "minecraft", "正在登录 Minecraft 服务...");
    let mc = run_cancellable(&cancel, get_minecraft_access_token(uhs, &xsts.token)).await?;

    println!("[poll_and_complete_login] 获取玩家 UUID 与名称...");
    emit_progress(&app, "uuid", "正在获取玩家资料...");
    let uuid_resp = run_cancellable(&cancel, get_user_uuid(&mc.access_token)).await?;

    if cancel.is_cancelled() {
        println!("[poll_and_complete_login] 流程已取消，不再执行存储与入库");
        return Err("用户已取消登录".to_string());
    }

    println!("[poll_and_complete_login] 存储凭据到系统密钥环...");
    emit_progress(&app, "storing", "正在保存登录凭据...");
    if let Err(e) = set_mc_token(&app, &mc) {
        println!("[poll_and_complete_login] set_mc_token 失败（不阻断）: {}", e);
    }

    println!("[poll_and_complete_login] 创建账户...");
    emit_progress(&app, "adding", "正在创建账户...");
    let info = AccountInfo {
        name: uuid_resp.name.clone(),
        account_type: AccountType::Microsoft,
        uuid: uuid_resp.id.clone(),
        create_time: Local::now().to_rfc3339(),
        last_login_time: None,
    };
    let account = Account {
        info: info.clone(),
        access_token: Some(token.access_token.clone()),
        refresh_token: Some(token.refresh_token.clone()),
    };
    add_account_to_manager(Some(account))?;

    SESSION.lock().await.status = LoginStatus::Done;
    emit_progress(&app, "done", "登录完成");
    println!(
        "[poll_and_complete_login] 完成: 账户 {} ({}) 已添加",
        info.name, info.uuid
    );
    Ok(info)
}
