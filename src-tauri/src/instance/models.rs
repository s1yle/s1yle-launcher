use crate::modloader::ModLoaderType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceMeta {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub icon_path: Option<String>,
    pub created_at: i64,
    pub last_played: Option<i64>,
}

impl Default for InstanceMeta {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: String::new(),
            version: String::new(),
            loader_type: ModLoaderType::Vanilla,
            loader_version: None,
            icon_path: None,
            created_at: 0,
            last_played: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInstance {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader_type: ModLoaderType,
    pub loader_version: Option<String>,
    pub path: String,
    pub icon_path: Option<String>,
    pub last_played: Option<i64>,
    pub created_at: i64,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnownPath {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_default: bool,
}

impl Default for KnownPath {
    fn default() -> Self {
        Self {
            id: String::from("default"),
            name: String::from("default"),
            path: String::new(),
            is_default: true,
        }
    }
}
