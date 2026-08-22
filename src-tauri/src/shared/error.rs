//! 统一错误类型
//!
//! 当前后端大量命令返回 `Result<T, String>`。逐步迁移到 `AppError` 以获得
//! 类型安全的错误分类。提供 `From<String>` / `From<&str>` 以便与现有 `String` 错误兼容。

use std::fmt;

/// 应用统一错误
#[derive(Debug, Clone)]
pub struct AppError(pub String);

impl AppError {
    /// 构造错误
    pub fn new(msg: impl Into<String>) -> Self {
        Self(msg.into())
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for AppError {}

impl From<String> for AppError {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for AppError {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.0
    }
}
