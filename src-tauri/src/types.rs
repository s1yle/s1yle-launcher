//! 跨模块共享的基础类型（零业务依赖）

/// 账户类型枚举
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum AccountType {
    /// 占位符
    #[serde(rename = "none")]
    None,
    /// 微软正版账户
    #[serde(rename = "microsoft")]
    Microsoft,
    /// 离线账户
    #[serde(rename = "offline")]
    Offline,
    /// 第三方账户
    #[serde(rename = "third-party")]
    ThirdParty,
}
