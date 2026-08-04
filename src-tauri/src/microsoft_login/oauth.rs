//! OAuth 设备码流程

use core::time;
use serde_json::{from_str};
use tokio::{
    sync::{oneshot},
    time::sleep,
};

use super::types::*;

/// 获取设备码
pub async fn get_devicecode(client_id: &String) -> Result<DeviceCode, Box<dyn std::error::Error>> {
    println!("[get_devicecode] 开始获取设备码");
    let base_url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
    let client = reqwest::Client::new();
    println!("[get_devicecode] 发送 POST 请求到 {}", base_url);

    let resp = client
        .post(base_url)
        .form(&[
            ("client_id", client_id),
            ("scope", &"XboxLive.signin offline_access".to_string()),
        ])
        .send()
        .await
        .map_err(|e| -> Box<dyn std::error::Error> {
            println!("[get_devicecode] 网络请求失败: {}", e);
            format!("网络请求失败: {}", e).into()
        })?;

    println!("[get_devicecode] 响应状态: {}", resp.status());

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        println!("[get_devicecode] 请求失败，响应体: {}", body);
        return Err(format!("设备码请求失败: {}", body).into());
    }

    let body = resp.text().await.map_err(|e| {
        println!("[get_devicecode] 读取响应体失败: {}", e);
        format!("读取响应体失败: {}", e)
    })?;
    println!("[get_devicecode] 响应体长度: {} bytes", body.len());

    let device_code: DeviceCode = from_str(&body).map_err(|e| {
        println!("[get_devicecode] 解析 JSON 失败: {}", e);
        format!("解析设备码失败: {}", e)
    })?;
    println!("[get_devicecode] 解析成功: user_code={}", device_code.user_code);

    println!("[get_devicecode] 准备存入 SESSION...");
    let mut session = SESSION.lock().await;
    session.device_code = Some(device_code.clone());
    println!("[get_devicecode] device_code 已存入 SESSION");

    Ok(device_code)
}

/// 轮询用户授权状态
pub async fn get_user_authorize(
    client_id: String,
    code: DeviceCode,
) -> Result<(tokio::task::JoinHandle<Result<(), String>>, TokenResponse), String> {
    println!("[get_user_authorize] 开始轮询用户授权");
    let url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
    let client = reqwest::Client::new();

    let (tx, rx) = oneshot::channel::<TokenResponse>();
    println!("[get_user_authorize] oneshot channel 已创建");

    let mut interval_sec = code.interval;
    println!("[get_user_authorize] 初始轮询间隔: {}s", interval_sec);

    let handle = tokio::spawn(async move {
        println!("[get_user_authorize:spawn] 轮询任务已启动");
        let mut poll_count = 0u32;
        loop {
            poll_count += 1;
            println!("[get_user_authorize:spawn] 第 {} 次轮询", poll_count);

            let resp = match client
                .post(url)
                .form(&[
                    ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                    ("client_id", &client_id),
                    ("device_code", &code.device_code),
                ])
                .send()
                .await
            {
                Ok(r) => {
                    println!("[get_user_authorize:spawn] 请求成功，状态: {}", r.status());
                    r
                }
                Err(e) => {
                    println!("[get_user_authorize:spawn] 网络请求失败: {}", e);
                    sleep(time::Duration::from_secs(interval_sec)).await;
                    continue;
                }
            };

            if resp.status().is_success() {
                println!("[get_user_authorize:spawn] 收到成功响应，解析 token...");
                match resp.json::<TokenResponse>().await {
                    Ok(token_data) => {
                        println!("[get_user_authorize:spawn] token 解析成功，token_type={}", token_data.token_type);
                        let _ = tx.send(token_data);
                        println!("[get_user_authorize:spawn] token 已发送到 channel");
                        return Ok(());
                    }
                    Err(e) => {
                        println!("[get_user_authorize:spawn] 解析 token 失败: {}", e);
                        return Err(e.to_string());
                    }
                }
            } else {
                println!("[get_user_authorize:spawn] 收到错误响应，解析错误信息...");
                let err_body = match resp.json::<OAuthErrorResp>().await {
                    Ok(b) => {
                        println!("[get_user_authorize:spawn] 错误类型: {}", b.error);
                        b
                    }
                    Err(e) => {
                        println!("[get_user_authorize:spawn] 解析错误信息失败: {}", e);
                        sleep(time::Duration::from_secs(interval_sec)).await;
                        continue;
                    }
                };

                let err = map_oauth_error(&err_body.error);
                println!("[get_user_authorize:spawn] 映射错误: {:?}", err);
                match err {
                    DeviceCodeError::AuthorizationPending => {
                        println!("[get_user_authorize:spawn] 等待用户授权，{}s 后重试", interval_sec);
                        sleep(time::Duration::from_secs(interval_sec)).await;
                    }
                    DeviceCodeError::SlowDown => {
                        interval_sec += 2;
                        println!("[get_user_authorize:spawn] 收到 SlowDown，新间隔: {}s", interval_sec);
                        sleep(time::Duration::from_secs(interval_sec)).await;
                    }
                    other => {
                        println!("[get_user_authorize:spawn] 不可恢复错误: {:?}", other);
                        return Err(other.to_string());
                    }
                }
            }
        }
    });

    println!("[get_user_authorize] 等待 rx channel 接收 token...");
    match rx.await {
        Ok(token_data) => {
            println!("[get_user_authorize] 成功接收 token");
            Ok((handle, token_data))
        }
        Err(e) => {
            println!("[get_user_authorize] 接收 token 失败: {}", e);
            Err(e.to_string())
        }
    }
}

/// 从error字符串转换为枚举 (helper func)
pub fn map_oauth_error(err_str: &str) -> DeviceCodeError {
    match err_str {
        "authorization_pending" => DeviceCodeError::AuthorizationPending,
        "authorization_declined" => DeviceCodeError::AuthorizationDeclined,
        "bad_verification_code" => DeviceCodeError::BadVerificationCode,
        "expired_token" => DeviceCodeError::ExpiredToken,
        "slow_down" => DeviceCodeError::SlowDown,
        other => DeviceCodeError::Unknown(other.to_string()),
    }
}

/// 授权代码登录模式
pub async fn get_token_from_code(
    client_id: &String,
    auth_code: &String,
    redirect_uri: &String,
) -> Result<TokenResponse, Box<dyn std::error::Error>> {
    let url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
    let client = reqwest::Client::new();

    let resp = client
        .post(url)
        .form(&[
            ("client_id", client_id),
            ("code", auth_code),
            ("grant_type", &"authorization_code".to_string()),
            ("redirect_uri", redirect_uri),
            ("scope", &"XboxLive.signin offline_access".to_string()),
        ])
        .send()
        .await?;

    println!("Status: {}", resp.status());
    let body = resp.text().await?;

    let token_resp = from_str::<TokenResponse>(&body)?;

    Ok(token_resp)
}

