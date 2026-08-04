//! Xbox Live 和 XSTS 验证链

use super::types::*;

/// Xbox Live 身份验证
pub async fn get_xbox_live_validation(
    access_token: &String,
) -> Result<XboxLiveAuthResponse, Box<dyn std::error::Error>> {
    println!("[get_xbox_live_validation] 开始 Xbox Live 认证");
    let url = "https://user.auth.xboxlive.com/user/authenticate";
    let client = reqwest::Client::new();
    println!("[get_xbox_live_validation] access_token 长度={}", access_token.len());

    let body = XboxLiveRequest {
        properties: XboxLiveProperties {
            auth_method: "RPS".to_string(),
            site_name: "user.auth.xboxlive.com".to_string(),
            rps_ticket: format!("d={}", access_token),
        },
        relying_party: "http://auth.xboxlive.com".to_string(),
        token_type: "JWT".to_string(),
    };
    println!("[get_xbox_live_validation] 请求体已构建");

    println!("[get_xbox_live_validation] 发送 POST 请求...");
    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| -> Box<dyn std::error::Error> {
            println!("[get_xbox_live_validation] 网络请求失败: {}", e);
            format!("Xbox Live 请求失败: {}", e).into()
        })?;

    let status = resp.status();
    println!("[get_xbox_live_validation] 响应状态: {}", status);

    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        println!("[get_xbox_live_validation] 请求失败，响应体: {}", body);
        return Err(format!("Xbox Live 认证失败: {}", body).into());
    }

    let auth_response = resp.json::<XboxLiveAuthResponse>().await.map_err(|e| -> Box<dyn std::error::Error> {
        println!("[get_xbox_live_validation] 解析响应失败: {}", e);
        format!("解析 Xbox Live 响应失败: {}", e).into()
    })?;
    println!("[get_xbox_live_validation] 认证成功");
    println!("[get_xbox_live_validation] token 长度={}", auth_response.token.len());
    let uhs = auth_response.display_claims.xui.first().map(|x| &x.uhs);
    println!("[get_xbox_live_validation] UHS={:?}", uhs);

    println!("[get_xbox_live_validation] 准备存入 SESSION...");
    let mut session = SESSION.lock().await;
    session.xbl_response = Some(auth_response.clone());
    println!("[get_xbox_live_validation] xbl_response 已存入 SESSION");

    Ok(auth_response)
}

/// XSTS 身份验证
pub async fn get_xsts_validation(
    xbl_token: &Vec<String>,
) -> Result<XboxLiveAuthResponse, Box<dyn std::error::Error>> {
    println!("[get_xsts_validation] 开始 XSTS 认证");
    let url = "https://xsts.auth.xboxlive.com/xsts/authorize";
    let client = reqwest::Client::new();
    println!("[get_xsts_validation] xbl_token 数量={}", xbl_token.len());

    let body = XSTSAuthRequest {
        properties: XSTSProperties {
            sandbox_id: "RETAIL".to_string(),
            user_tokens: xbl_token.clone(),
        },
        relying_party: "rp://api.minecraftservices.com/".to_string(),
        token_type: "JWT".to_string(),
    };
    println!("[get_xsts_validation] 请求体已构建");

    println!("[get_xsts_validation] 发送 POST 请求...");
    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| -> Box<dyn std::error::Error> {
            println!("[get_xsts_validation] 网络请求失败: {}", e);
            format!("XSTS 请求失败: {}", e).into()
        })?;

    let status = resp.status();
    println!("[get_xsts_validation] 响应状态: {}", status);

    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        println!("[get_xsts_validation] 请求失败，响应体: {}", body);
        return Err(format!("XSTS 认证失败: {}", body).into());
    }

    let auth_response = resp.json::<XboxLiveAuthResponse>().await.map_err(|e| -> Box<dyn std::error::Error> {
        println!("[get_xsts_validation] 解析响应失败: {}", e);
        format!("解析 XSTS 响应失败: {}", e).into()
    })?;
    println!("[get_xsts_validation] 认证成功");
    println!("[get_xsts_validation] token 长度={}", auth_response.token.len());
    let uhs = auth_response.display_claims.xui.first().map(|x| &x.uhs);
    println!("[get_xsts_validation] UHS={:?}", uhs);

    println!("[get_xsts_validation] 准备存入 SESSION...");
    let mut session = SESSION.lock().await;
    session.xsts_response = Some(auth_response.clone());
    println!("[get_xsts_validation] xsts_response 已存入 SESSION");

    Ok(auth_response)
}

/// 获取 Minecraft Access Token
pub async fn get_minecraft_access_token(
    uhs: &str,
    xsts_token: &str,
) -> Result<MinecraftLoginResponse, Box<dyn std::error::Error>> {
    println!("[get_minecraft_access_token] 开始 Minecraft 登录");
    let url = "https://api.minecraftservices.com/authentication/login_with_xbox";
    let client = reqwest::Client::new();
    println!("[get_minecraft_access_token] uhs={}, xsts_token 长度={}", uhs, xsts_token.len());

    let identity_token = format!("XBL3.0 x={};{}", uhs, xsts_token);
    println!("[get_minecraft_access_token] identity_token 已构建");

    let body = MinecraftLoginRequest { identity_token };

    println!("[get_minecraft_access_token] 发送 POST 请求...");
    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| -> Box<dyn std::error::Error> {
            println!("[get_minecraft_access_token] 网络请求失败:");
            println!("[get_minecraft_access_token]   错误类型: {}", e);
            if e.is_timeout() {
                println!("[get_minecraft_access_token]   原因: 请求超时");
            } else if e.is_connect() {
                println!("[get_minecraft_access_token]   原因: 连接失败");
            } else if e.is_redirect() {
                println!("[get_minecraft_access_token]   原因: 重定向错误");
            } else if e.is_request() {
                println!("[get_minecraft_access_token]   原因: 请求构建失败");
            }
            if let Some(source) = std::error::Error::source(&e) {
                println!("[get_minecraft_access_token]   底层错误: {}", source);
            }
            format!("Minecraft 登录请求失败: {}", e).into()
        })?;

    let status = resp.status();
    println!("[get_minecraft_access_token] 响应状态: {}", status);

    let response_text = resp.text().await.map_err(|e| -> Box<dyn std::error::Error> {
        println!("[get_minecraft_access_token] 读取响应体失败: {}", e);
        format!("读取响应失败: {}", e).into()
    })?;
    println!("[get_minecraft_access_token] 响应体长度: {} bytes", response_text.len());

    if !response_text.contains("access_token") {
        println!("[get_minecraft_access_token] 响应中无 access_token: {}", response_text);
        return Err(format!("Minecraft login failed: {}", response_text).into());
    }

    let login_response: MinecraftLoginResponse = serde_json::from_str(&response_text).map_err(|e| -> Box<dyn std::error::Error> {
        println!("[get_minecraft_access_token] 解析 JSON 失败: {}", e);
        format!("解析响应失败: {}", e).into()
    })?;
    println!("[get_minecraft_access_token] 登录成功");
    println!("[get_minecraft_access_token] username={}", login_response.username);
    println!("[get_minecraft_access_token] access_token 长度={}", login_response.access_token.len());
    println!("[get_minecraft_access_token] token_type={}, expires_in={}s", login_response.token_type, login_response.expires_in);

    println!("[get_minecraft_access_token] 准备存入 SESSION...");
    let mut session = SESSION.lock().await;
    session.mc_login = Some(login_response.clone());
    println!("[get_minecraft_access_token] mc_login 已存入 SESSION");

    Ok(login_response)
}
