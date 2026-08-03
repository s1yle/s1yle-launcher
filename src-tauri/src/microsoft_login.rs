use core::time;
use std::fmt;

use serde::{Deserialize, Serialize};
use serde_json::from_str;
use tauri::command;
use tokio::{
    io::join,
    join, spawn,
    sync::{mpsc, oneshot},
    time::sleep,
};

/// 获取 Microsoft 设备码
#[command]
pub async fn microsoft_device_code() -> Result<DeviceCode, String> {
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    let code = get_devicecode(&client_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(code)
}

/// 获取用户授权状态
#[command]
pub async fn microsoft_user_auth_status(code: DeviceCode) -> Result<TokenResponse, String> {
    println!("获取用户授权状态中...");
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    let (handle, token) = get_user_authorize(client_id, code)
        .await
        .map_err(|e| e.to_string())?;
    println!("获取用户授权状态成功: {:?}", token);
    handle
        .await
        .expect("Task panicked")
        .expect("Task returned error");

    Ok(TokenResponse {
        token_type: token.token_type,
        scope: token.scope,
        expires_in: token.expires_in,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        id_token: token.id_token,
    })
}

#[derive(serde::Serialize, serde::Deserialize, std::fmt::Debug)]
pub struct DeviceCode {
    //应用程序需要暂存此代码用于轮询用户授权状态
    device_code: String,
    //应用程序需要将此代码展示给用户
    user_code: String,
    //应用程序需要引导用户在此输入授权码并确认授权
    verification_uri: String,
    //代码对有效期，在超出此时间后失效，单位为秒
    expires_in: u32,
    //应用向验证服务器轮询用户授权状态的最小间隔时间，单位为秒
    interval: u64,
    //用于指导用户登录的文本，默认为英文，可在查询参数中指定 ?mtk=<语言区域性代码> 来将此内容本地化，但建议启动器自行生成文本指导
    message: String,
}

/// 设备码轮询时返回的OAuth错误类型
#[derive(Debug, Clone, PartialEq)]
pub enum DeviceCodeError {
    /// 用户还没操作，继续轮询
    AuthorizationPending,
    /// 用户手动拒绝授权，终止流程
    AuthorizationDeclined,
    /// device_code 缺失/无效
    BadVerificationCode,
    /// 设备码超时失效，需要重新拉取device code
    ExpiredToken,
    /// 轮询间隔小于规定interval，需延长等待时间
    SlowDown,
    /// 其他未知错误
    Unknown(String),
}

impl fmt::Display for DeviceCodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DeviceCodeError::AuthorizationPending => write!(f, "用户尚未完成授权"),
            DeviceCodeError::AuthorizationDeclined => write!(f, "用户拒绝登录授权"),
            DeviceCodeError::BadVerificationCode => write!(f, "无效或缺失device_code"),
            DeviceCodeError::ExpiredToken => write!(f, "设备码已过期，请重新发起登录"),
            DeviceCodeError::SlowDown => write!(f, "轮询过快，需增大等待间隔"),
            DeviceCodeError::Unknown(msg) => write!(f, "OAuth未知错误：{}", msg),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, std::fmt::Debug)]
pub struct TokenResponse {
    // 令牌类型
    token_type: String,
    //申请的权限
    scope: String,
    //访问令牌过期时间
    expires_in: u32,
    //访问令牌
    access_token: String,
    //刷新令牌
    refresh_token: String,
    //如果未要求id令牌则此项不存在
    id_token: Option<String>,
}

impl std::error::Error for DeviceCodeError {}
impl From<reqwest::Error> for DeviceCodeError {
    fn from(e: reqwest::Error) -> Self {
        DeviceCodeError::Unknown(format!("网络/解析错误: {}", e))
    }
}

/// OAuth标准错误返回体
#[derive(Debug, Deserialize)]
pub struct OAuthErrorResp {
    pub error: String,
}

// Xbox Live 身份验证请求体
#[derive(serde::Serialize, std::fmt::Debug)]
#[serde(rename_all = "PascalCase")]
struct XboxLiveProperties {
    auth_method: String,
    site_name: String,
    rps_ticket: String,
}
#[derive(serde::Serialize, std::fmt::Debug)]
#[serde(rename_all = "PascalCase")]
struct XboxLiveRequest {
    properties: XboxLiveProperties,
    relying_party: String,
    token_type: String,
}

// Xbox Live 身份验证响应
#[derive(serde::Deserialize, std::fmt::Debug)]
#[serde(rename_all = "PascalCase")]
struct XboxLiveAuthResponse {
    issue_instant: String,
    not_after: String,
    token: String,
    display_claims: XboxLiveDisplayClaims,
}

#[derive(serde::Deserialize, std::fmt::Debug)]
struct XboxLiveDisplayClaims {
    xui: Vec<XboxLiveXui>,
}

#[derive(serde::Deserialize, std::fmt::Debug)]
struct XboxLiveXui {
    uhs: String,
}

// xsts 身份认证, response 直接复用 XboxLiveAuthResponse
#[derive(serde::Serialize, std::fmt::Debug)]
#[serde(rename_all = "PascalCase")]
struct XSTSProperties {
    sandbox_id: String,
    user_tokens: Vec<String>,
}

#[derive(serde::Serialize, std::fmt::Debug)]
#[serde(rename_all = "PascalCase")]
struct XSTSAuthRequest {
    properties: XSTSProperties,
    relying_party: String,
    token_type: String,
}

// 授权代码登录模式(另一种)
async fn get_token_from_code(
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

    // 打印状态码 + 响应JSON
    println!("Status: {}", resp.status());
    let body = resp.text().await?;

    let token_resp = from_str::<TokenResponse>(&body)?;

    Ok(token_resp)
}

/// 从error字符串转换为枚举
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

async fn get_devicecode(client_id: &String) -> Result<DeviceCode, Box<dyn std::error::Error>> {
    let base_url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
    let client = reqwest::Client::new();

    let resp = client
        .post(base_url)
        .form(&[
            ("client_id", client_id),
            ("scope", &"XboxLive.signin offline_access".to_string()),
        ])
        .send()
        .await?;

    // 打印状态码 + 响应JSON
    println!("Status: {}", resp.status());
    let body = resp.text().await?;
    // println!("Response body:\n{}", body);

    let json_rs = from_str::<DeviceCode>(&body)?;
    println!("device_code: {:?}", json_rs.device_code);
    println!("user_code: {:?}", json_rs.user_code);
    println!("verification_uri: {:?}", json_rs.verification_uri);
    println!("expires_in: {:?}", json_rs.expires_in);
    println!("interval: {:?}", json_rs.interval);
    println!("message: {:?}", json_rs.message);

    Ok(json_rs)
}

async fn get_user_authorize(
    client_id: String,
    code: DeviceCode,
) -> Result<(tokio::task::JoinHandle<Result<(), String>>, TokenResponse), String> {
    let url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
    let client = reqwest::Client::new();

    let (tx, rx) = oneshot::channel::<TokenResponse>();

    let mut interval_sec = code.interval;
    let handle = spawn(async move {
        loop {
            let resp = match client
                .post(url)
                .form(&[
                    ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                    ("client_id", &client_id),
                    ("device_code", &code.device_code),
                ])
                .send()
                // 将该任务暂挂(不会阻塞操作系统线程), 直到响应完成, 再去执行下面的代码
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("网络请求失败: {}", e);
                    sleep(time::Duration::from_secs(interval_sec)).await;
                    continue;
                }
            };

            println!("{:?}", resp);

            if resp.status().is_success() {
                match resp.json::<TokenResponse>().await {
                    Ok(token_data) => {
                        println!("授权成功！token: {:?}", token_data);
                        let _ = tx.send(token_data);
                        return Ok(());
                    }
                    Err(e) => {
                        eprintln!("解析token失败: {}", e);
                        return Err(e.to_string());
                    }
                }
            } else {
                let err_body = match resp.json::<OAuthErrorResp>().await {
                    Ok(b) => b,
                    Err(e) => {
                        eprintln!("解析错误信息失败: {}", e);
                        sleep(time::Duration::from_secs(interval_sec)).await;
                        continue;
                    }
                };

                let err = map_oauth_error(&err_body.error);
                match err {
                    DeviceCodeError::AuthorizationPending => {
                        sleep(time::Duration::from_secs(interval_sec)).await;
                    }
                    DeviceCodeError::SlowDown => {
                        interval_sec += 2;
                        sleep(time::Duration::from_secs(interval_sec)).await;
                    }
                    other => return Err(other.to_string()),
                }
            }
        }
    });

    match rx.await {
        Ok(token_data) => {
            println!("授权成功！token: {:?}", token_data);
            Ok((handle, token_data))
        }
        Err(e) => {
            eprintln!("接收token失败: {}", e);
            Err(e.to_string())
        }
    }
}

async fn get_xbox_live_validation(
    access_token: &String,
) -> Result<XboxLiveAuthResponse, Box<dyn std::error::Error>> {
    let url = "https://user.auth.xboxlive.com/user/authenticate";
    let client = reqwest::Client::new();

    let body = XboxLiveRequest {
        properties: XboxLiveProperties {
            auth_method: "RPS".to_string(),
            site_name: "user.auth.xboxlive.com".to_string(),
            rps_ticket: format!("d={}", access_token),
        },
        relying_party: "http://auth.xboxlive.com".to_string(),
        token_type: "JWT".to_string(),
    };

    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;

    println!("Xbox Live Auth Status: {}", resp.status());

    let auth_response = resp.json::<XboxLiveAuthResponse>().await?;
    println!("Xbox Live Auth Token: {:?}", auth_response.token);
    println!(
        "Xbox Live UHS: {:?}",
        auth_response.display_claims.xui.first().map(|x| &x.uhs)
    );

    Ok(auth_response)
}

async fn get_xsts_validation(
    xbl_token: &Vec<String>,
) -> Result<XboxLiveAuthResponse, Box<dyn std::error::Error>> {
    let url = "https://xsts.auth.xboxlive.com/xsts/authorize";
    let client = reqwest::Client::new();

    let body = XSTSAuthRequest {
        properties: XSTSProperties {
            sandbox_id: "RETAIL".to_string(),
            user_tokens: xbl_token.clone(),
        },
        relying_party: "rp://api.minecraftservices.com/".to_string(),
        token_type: "JWT".to_string(),
    };

    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;

    println!("XSTS Validation Status: {}", resp.status());

    let auth_response = resp.json::<XboxLiveAuthResponse>().await?;
    println!("XSTS Token: {:?}", auth_response.token);
    println!(
        "XSTS UHS: {:?}",
        auth_response.display_claims.xui.first().map(|x| &x.uhs)
    );

    Ok(auth_response)
}

// Minecraft 登录验证
#[derive(serde::Serialize, std::fmt::Debug)]
#[serde(rename_all = "camelCase")]
struct MinecraftLoginRequest {
    identity_token: String,
}

#[derive(serde::Deserialize, std::fmt::Debug)]
struct MinecraftLoginResponse {
    username: String,
    roles: Vec<String>,
    access_token: String,
    token_type: String,
    expires_in: u32,
}

async fn get_minecraft_access_token(
    uhs: &str,
    xsts_token: &str,
) -> Result<MinecraftLoginResponse, Box<dyn std::error::Error>> {
    let url = "https://api.minecraftservices.com/authentication/login_with_xbox";
    let client = reqwest::Client::new();

    let identity_token = format!("XBL3.0 x={};{}", uhs, xsts_token);

    let body = MinecraftLoginRequest { identity_token };

    let resp = client
        .post(url)
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;

    println!("Minecraft Login Status: {}", resp.status());

    // 先获取响应体用于调试
    let response_text = resp.text().await?;
    println!("Minecraft Login Response: {}", response_text);

    // 检查状态码
    if !response_text.contains("access_token") {
        return Err(format!("Minecraft login failed: {}", response_text).into());
    }

    // 重新解析 JSON
    let login_response: MinecraftLoginResponse = serde_json::from_str(&response_text)?;
    println!("Minecraft Access Token: {:?}", login_response.access_token);
    println!("Minecraft Username (UUID): {:?}", login_response.username);
    println!("Token Type: {:?}", login_response.token_type);
    println!("Expires In: {} seconds", login_response.expires_in);

    Ok(login_response)
}

#[tokio::test]
async fn login_microsoft() {
    // 1. 获取 Device Code
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    let device_code = get_devicecode(&client_id)
        .await
        .expect("get_devicecode failed");

    // 2. 轮询获取 Microsoft Token
    let (handle, mut rx) = get_user_authorize(client_id, device_code)
        .await
        .expect("get_user_authorize failed");
    let ms_token = rx;
    println!("Microsoft Access Token: {:?}", ms_token.access_token);
    handle
        .await
        .expect("Task panicked")
        .expect("Task returned error");

    // 3. 获取 Xbox Live Token
    let xbl_response = get_xbox_live_validation(&ms_token.access_token)
        .await
        .expect("xbox 验证失败");
    let uhs = xbl_response
        .display_claims
        .xui
        .first()
        .map(|x| x.uhs.as_str())
        .expect("uhs not found");
    println!("Xbox Live UHS: {}", uhs);

    // 4. 获取 XSTS Token
    let xsts_response = get_xsts_validation(&vec![xbl_response.token])
        .await
        .expect("xsts 验证失败");

    // 5. 获取 Minecraft Access Token
    let mc_token = get_minecraft_access_token(uhs, &xsts_response.token)
        .await
        .expect("minecraft 登录失败");
    println!("Minecraft Access Token: {}", mc_token.access_token);
}
