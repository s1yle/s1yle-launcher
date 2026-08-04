//! Microsoft 登录相关类型定义

use serde::{Deserialize, Serialize};
use std::fmt;
use tokio::sync::{Mutex};
use once_cell::sync::Lazy; // 需要添加 once_cell 依赖

pub trait Clear {
    fn clear(&mut self) -> Result<(),String>;
}

impl LoginSession {
    pub fn new() -> Self {
        Self::default()
    }
}

/// 登录会话状态，存储整个流程的中间数据
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LoginSession {
    pub device_code: Option<DeviceCode>,
    pub ms_token: Option<TokenResponse>,
    pub xbl_response: Option<XboxLiveAuthResponse>,
    pub xsts_response: Option<XboxLiveAuthResponse>,
    pub mc_login: Option<MinecraftLoginResponse>,
    pub uuid: Option<UuidResponse>,
}

impl Clear for LoginSession {
    fn clear(&mut self) -> Result<(),String> {
        self.device_code = None;
        self.ms_token = None;
        self.xbl_response = None;
        self.xsts_response = None;
        self.mc_login = None;
        self.uuid = None;

        Ok(())
    }
}

pub static SESSION: Lazy<Mutex<LoginSession>> = Lazy::new(|| Mutex::from(LoginSession::default()));


/// 设备码响应
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct DeviceCode {
    /// 应用程序需要暂存此代码用于轮询用户授权状态
    pub device_code: String,
    /// 应用程序需要将此代码展示给用户
    pub user_code: String,
    /// 应用程序需要引导用户在此输入授权码并确认授权
    pub verification_uri: String,
    /// 代码对有效期，在超出此时间后失效，单位为秒
    pub expires_in: u32,
    /// 应用向验证服务器轮询用户授权状态的最小间隔时间，单位为秒
    pub interval: u64,
    /// 用于指导用户登录的文本
    pub message: String,
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

impl std::error::Error for DeviceCodeError {}

impl From<reqwest::Error> for DeviceCodeError {
    fn from(e: reqwest::Error) -> Self {
        DeviceCodeError::Unknown(format!("网络/解析错误: {}", e))
    }
}

/// Token 响应
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct TokenResponse {
    /// 令牌类型
    pub token_type: String,
    /// 申请的权限
    pub scope: String,
    /// 访问令牌过期时间
    pub expires_in: u32,
    /// 访问令牌
    pub access_token: String,
    /// 刷新令牌
    pub refresh_token: String,
    /// 如果未要求id令牌则此项不存在
    pub id_token: Option<String>,
}

/// OAuth标准错误返回体
#[derive(Debug, Deserialize)]
pub struct OAuthErrorResp {
    pub error: String,
}

/// UUID 响应
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct UuidResponse {
    /// 账号的真实UUID
    pub id: String,
    /// 该账号的Minecraft用户名
    pub name: String,
    #[serde(default)]
    pub skins: Vec<Skin>,
    #[serde(default)]
    pub capes: Vec<Cape>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Skin {
    pub id: String,
    pub state: String,
    pub url: String,
    pub variant: String,
    pub alias: Option<String>,
    #[serde(default)]
    pub texture_key: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Cape {
    pub id: String,
    pub state: String,
    pub url: String,
    pub alias: String,
    pub variant: Option<String>,
}

/// UUID 获取错误
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UuidErr {
    pub path: String,
    pub error_type: String,
    pub error: String,
    pub error_message: String,
    pub developer_message: String,
}

impl std::fmt::Display for UuidErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "UUID获取失败: {} \n
                - 开发人员信息: {}\n
                - 路径: {}\n 
                - 错误类型: {}\n 
                - 错误：{}
            ",
            self.error_message,
            self.developer_message,
            self.path,
            self.error_type,
            self.error
        )
    }
}

impl std::error::Error for UuidErr {}

// Xbox Live 身份验证请求体
#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct XboxLiveProperties {
    pub auth_method: String,
    pub site_name: String,
    pub rps_ticket: String,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct XboxLiveRequest {
    pub properties: XboxLiveProperties,
    pub relying_party: String,
    pub token_type: String,
}

// Xbox Live 身份验证响应
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct XboxLiveAuthResponse {
    pub issue_instant: String,
    pub not_after: String,
    pub token: String,
    pub display_claims: XboxLiveDisplayClaims,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct XboxLiveDisplayClaims {
    pub xui: Vec<XboxLiveXui>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct XboxLiveXui {
    pub uhs: String,
}

// XSTS 身份认证请求
#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct XSTSProperties {
    pub sandbox_id: String,
    pub user_tokens: Vec<String>,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct XSTSAuthRequest {
    pub properties: XSTSProperties,
    pub relying_party: String,
    pub token_type: String,
}

// Minecraft 登录验证
#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MinecraftLoginRequest {
    pub identity_token: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct MinecraftLoginResponse {
    pub username: String,
    pub roles: Vec<String>,
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u32,
}
