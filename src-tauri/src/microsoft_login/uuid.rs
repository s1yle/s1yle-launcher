//! 获取用户 UUID

use crate::microsoft_login::{MinecraftLoginResponse, SESSION};

use super::types::{UuidErr, UuidResponse};

/// 通过可信化存储获取 Token, 以用于获取用户 UUID
pub async fn get_user_uuid() -> Result<UuidResponse, UuidErr> {
    println!("[get_user_uuid] 开始获取用户 UUID");
    let url = "https://api.minecraftservices.com/minecraft/profile";
    let client = reqwest::Client::new();

    let mut session = SESSION.lock().await;

    let token = session
        .mc_login
        .as_ref()
        .cloned()
        .ok_or_else(|| {
            println!("[get_user_uuid] 错误: mc_login 未设置");
            "mc_login is not set".to_string()
        })
        .map_err(|e| {
            println!("[get_user_uuid] 网络请求失败: {}", e);
            UuidErr {
                path: url.to_string(),
                error_type: "network".to_string(),
                error: "request_failed".to_string(),
                error_message: e.to_string(),
                developer_message: format!("HTTP请求失败: {}", e),
            }
        })?;

    println!(
        "[get_user_uuid] access_token 长度={}",
        token.access_token.len()
    );

    println!("[get_user_uuid] 发送 GET 请求...");
    let resp = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token.access_token))
        .send()
        .await
        .map_err(|e| {
            println!("[get_user_uuid] 网络请求失败: {}", e);
            UuidErr {
                path: url.to_string(),
                error_type: "network".to_string(),
                error: "request_failed".to_string(),
                error_message: e.to_string(),
                developer_message: format!("HTTP请求失败: {}", e),
            }
        })?;

    let status = resp.status();
    println!("[get_user_uuid] 响应状态: {}", status);

    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        println!("[get_user_uuid] 请求失败，响应体: {}", body);
        return Err(UuidErr {
            path: url.to_string(),
            error_type: "http".to_string(),
            error: "request_failed".to_string(),
            error_message: format!("HTTP {}: {}", status, body),
            developer_message: format!("获取 UUID 失败"),
        });
    }

    let body = resp.text().await.map_err(|e| {
        println!("[get_user_uuid] 读取响应体失败: {}", e);
        UuidErr {
            path: url.to_string(),
            error_type: "read".to_string(),
            error: "read_body_failed".to_string(),
            error_message: e.to_string(),
            developer_message: format!("读取响应体失败: {}", e),
        }
    })?;

    println!("[get_user_uuid] 响应体: {}", body);

    let uuid_response: UuidResponse = serde_json::from_str(&body).map_err(|e| {
        println!("[get_user_uuid] 解析 JSON 失败: {}", e);
        UuidErr {
            path: url.to_string(),
            error_type: "parse".to_string(),
            error: "json_parse_failed".to_string(),
            error_message: e.to_string(),
            developer_message: format!("解析 JSON 失败: {}", e),
        }
    })?;

    println!(
        "[get_user_uuid] 成功: id={}, name={}",
        uuid_response.id, uuid_response.name
    );

    session.uuid = Some(uuid_response.clone());

    Ok(uuid_response)
}
