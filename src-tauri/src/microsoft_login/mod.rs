//! Microsoft 账户登录模块

mod oauth;
#[cfg(test)]
mod tests;
mod token_store;
mod types;
mod uuid;
mod xbox;

#[cfg(target_os = "windows")]
use crate::microsoft_login::token_store::set_mc_token;
pub use oauth::{get_devicecode, get_user_authorize};
use serde::{Deserialize, Serialize};
pub use types::*;
pub use uuid::get_user_uuid;
pub use xbox::{get_minecraft_access_token, get_xbox_live_validation, get_xsts_validation};

use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendDeviceCodeResponse {
    user_code: String,
    url: String,
}

/// 获取 Microsoft 设备码
/// 获取 device code 并存入 SESSION
#[command]
pub async fn start_device_code() -> Result<FrontendDeviceCodeResponse, String> {
    println!("[start_device_code] 开始获取 device_code");
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    println!("[start_device_code] client_id={}", client_id);
    let user_code = get_devicecode(&client_id)
        .await
        .map_err(|e| {
            println!("[start_device_code] get_devicecode 失败: {}", e);
            e.to_string()
        })?;
    println!("[start_device_code] 成功: user_code={}", user_code.user_code);

    Ok(FrontendDeviceCodeResponse {
        user_code: user_code.user_code,
        url: user_code.verification_uri,
    })
}

/// 获取 Microsoft 设备码
/// 轮询 Microsoft token，存入 SESSION

#[command]
pub async fn poll_oauth_token() -> Result<(), String> {
    println!("[poll_oauth_token] 开始轮询 OAuth token");
    microsoft_user_auth_status_internal()
        .await
        .map_err(|err| {
            println!("[poll_oauth_token] 失败: {}", err);
            err.to_string()
        })?;
    println!("[poll_oauth_token] 成功");

    Ok(())
}

pub async fn microsoft_user_auth_status_internal() -> Result<TokenResponse, String> {
    println!("[auth_status_internal] 开始获取用户授权状态");
    let mut session = SESSION
        .lock()
        .await;
    println!("[auth_status_internal] SESSION 已锁定");
    let code = session
        .device_code
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[auth_status_internal] 错误: device_code 未设置");
            "device_code is not set".to_string()
        })?;
    println!("[auth_status_internal] device_code 已获取: {}", code.device_code);
    drop(session);
    println!("[auth_status_internal] SESSION 已释放");

    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    println!("[auth_status_internal] 调用 get_user_authorize...");
    let (handle, token) = get_user_authorize(client_id, code)
        .await
        .map_err(|e| {
            println!("[auth_status_internal] get_user_authorize 失败: {}", e);
            e.to_string()
        })?;
    println!("[auth_status_internal] get_user_authorize 返回，等待 handle 完成");
    handle
        .await
        .expect("Task panicked")
        .expect("Task returned error");
    println!("[auth_status_internal] handle 完成，token 已获取");

    let token_resp = TokenResponse {
        token_type: token.token_type,
        scope: token.scope,
        expires_in: token.expires_in,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        id_token: token.id_token,
    };
    println!("[auth_status_internal] token_type={}, scope={}", token_resp.token_type, token_resp.scope);

    let mut session = SESSION.lock().await;
    session.ms_token = Some(token_resp.clone());
    println!("[auth_status_internal] ms_token 已存入 SESSION");

    Ok(token_resp)
}

/// 从 SESSION 读取 ms_token，进行 Xbox Live 认证，存入 xbl_response
#[command]
pub async fn do_xbox_auth() -> Result<(), String> {
    println!("[do_xbox_auth] 开始 Xbox Live 认证");
    let session = SESSION
        .lock()
        .await;
    println!("[do_xbox_auth] SESSION 已锁定");
    let oauth_token = session
        .ms_token
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[do_xbox_auth] 错误: ms_token 未设置");
            "ms_token is not set".to_string()
        })?;
    println!("[do_xbox_auth] ms_token 已获取，access_token 长度={}", oauth_token.access_token.len());
    drop(session);
    println!("[do_xbox_auth] SESSION 已释放");

    println!("[do_xbox_auth] 调用 get_xbox_live_validation...");
    get_xbox_live_validation(&oauth_token.access_token)
        .await
        .map_err(|e| {
            println!("[do_xbox_auth] get_xbox_live_validation 失败: {}", e);
            e.to_string()
        })?;
    println!("[do_xbox_auth] Xbox Live 认证成功");

    Ok(())
}

/// 从 SESSION 读取 xbl_response，进行 XSTS 认证，存入 xsts_response
#[command]
pub async fn do_xsts_auth() -> Result<(), String> {
    println!("[do_xsts_auth] 开始 XSTS 认证");
    let session = SESSION
        .lock()
        .await;
    println!("[do_xsts_auth] SESSION 已锁定");
    let xbl_token = session
        .xbl_response
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[do_xsts_auth] 错误: xbl_response 未设置");
            "xbl_response is not set".to_string()
        })?;
    println!("[do_xsts_auth] xbl_response 已获取，token 长度={}", xbl_token.token.len());
    drop(session);
    println!("[do_xsts_auth] SESSION 已释放");

    println!("[do_xsts_auth] 调用 get_xsts_validation...");
    get_xsts_validation(&vec![xbl_token.token])
        .await
        .map_err(|e| {
            println!("[do_xsts_auth] get_xsts_validation 失败: {}", e);
            e.to_string()
        })?;
    println!("[do_xsts_auth] XSTS 认证成功");

    Ok(())
}

/// 从 SESSION 读取 xsts_response，获取 Minecraft access_token，存入 mc_login
#[command]
pub async fn do_minecraft_login() -> Result<(), String> {
    println!("[do_minecraft_login] 开始 Minecraft 登录");
    let mut session = SESSION
        .lock()
        .await;
    println!("[do_minecraft_login] SESSION 已锁定");
    let xbl_token = session
        .xbl_response
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[do_minecraft_login] 错误: xbl_response 未设置");
            "xbl_token is not set".to_string()
        })?;
    println!("[do_minecraft_login] xbl_response 已获取");
    let xsts_token = session
        .xsts_response
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[do_minecraft_login] 错误: xsts_response 未设置");
            "xsts_token is not set".to_string()
        })?;
    println!("[do_minecraft_login] xsts_response 已获取");

    let uhs = xbl_token
        .display_claims
        .xui
        .first()
        .map(|x| x.uhs.as_str())
        .ok_or_else(|| {
            println!("[do_minecraft_login] 错误: uhs 未找到");
            "uhs not found".to_string()
        })?;
    println!("[do_minecraft_login] uhs={}", uhs);
    drop(session);
    println!("[do_minecraft_login] SESSION 已释放");

    println!("[do_minecraft_login] 调用 get_minecraft_access_token...");
    get_minecraft_access_token(uhs, &xsts_token.token)
        .await
        .map_err(|e| {
            println!("[do_minecraft_login] get_minecraft_access_token 失败: {}", e);
            e.to_string()
        })?;
    println!("[do_minecraft_login] Minecraft 登录成功");

    Ok(())
}

/// 从 SESSION 读取 mc_login，提取 username 和 token，存储到可信存储，然后清空会话（将所有字段设为 None）
#[command]
pub async fn finalize_and_store() -> Result<(), String> {
    println!("[finalize_and_store] 开始最终存储流程");
    let mut session = SESSION
        .lock()
        .await;
    println!("[finalize_and_store] SESSION 已锁定");
    let mc_token = session
        .mc_login
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[finalize_and_store] 错误: mc_login 未设置");
            "mc_login is not set".to_string()
        })?;
    println!("[finalize_and_store] mc_login 已获取，username={}", mc_token.username);

    let uuid = session
        .uuid
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[finalize_and_store] 错误: uuid 未设置");
            "uuid is not set".to_string()
        })?;
    println!("[finalize_and_store] uuid 已获取，id={}, name={}", uuid.id, uuid.name);

    #[cfg(target_os = "windows")]
    {
        println!("[finalize_and_store] 调用 set_mc_token, username={}", uuid.name);
        set_mc_token(uuid.name, &mc_token.clone()).map_err(|e| {
            println!("[finalize_and_store] set_mc_token 失败: {}", e);
            e.to_string()
        })?;
        println!("[finalize_and_store] 凭据已存储到可信存储");
    }

    drop(session);
    println!("[finalize_and_store] SESSION 已释放，准备清空");
    SESSION.lock().await.clear().map_err(|e| {
        println!("[finalize_and_store] SESSION clear 失败: {}", e);
        e
    })?;
    println!("[finalize_and_store] SESSION 已清空，流程完成");
    Ok(())
}
