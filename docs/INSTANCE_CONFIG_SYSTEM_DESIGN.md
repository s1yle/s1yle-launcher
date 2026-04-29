# 实例配置系统设计方案

> **版本**: v1.0  
> **日期**: 2026-04-29  
> **状态**: 已实现 ✅

---

## 📋 目录

1. [现状分析](#1-现状分析)
2. [架构设计](#2-架构设计)
3. [数据模型设计](#3-数据模型设计)
4. [API 设计](#4-api-设计)
5. [前端集成方案](#5-前端集成方案)
6. [配置文件结构](#6-配置文件结构)
7. [实现路线图](#7-实现路线图)
8. [最佳实践](#8-最佳实践)

---

## 1. 现状分析

### 1.1 当前架构

#### **后端配置模块** (`src-tauri/src/config/`)

**现有组件**：
- `models.rs` - 配置数据模型（`AppConfig`, `WindowPosition`）
- `manager.rs` - 配置管理器（`ConfigManager`）
- 已实现的 Tauri 命令：
  - `get_config()` - 获取完整配置
  - `update_config()` - 更新完整配置
  - `get_value()` - 动态获取配置项（内部使用）
  - `write_config()` - 动态写入配置项（内部使用）

**配置文件路径**：
```
{base_dir}/.smcl/app_config.json
```

**当前配置结构**：
```json
{
  "base_path": "/path/to/config",
  "window_position": {
    "x": 100,
    "y": 100,
    "width": 1024,
    "height": 680,
    "maximized": false
  }
}
```

#### **实例管理模块** (`src-tauri/src/instance/`)

**现有组件**：
- `models.rs` - 实例模型（`GameInstance`, `InstanceMeta`, `KnownPath`）
- `manager.rs` - 实例管理器（`InstanceManager`）
- `commands.rs` - Tauri 命令
- `utils.rs` - 工具函数

**当前实现**：
- ✅ 实例扫描（基于目录结构）
- ✅ 实例 CRUD 操作
- ✅ 已知文件夹管理
- ✅ 元数据管理（instance_meta.json）

**问题点**：
1. ❌ **实例配置分散**：实例配置信息存储在 `instance_meta.json` 中，未纳入统一配置系统
2. ❌ **配置 API 未暴露**：前端的 `rustInvoke.ts` 中未封装 `get_config` 和 `update_config` 调用
3. ❌ **缺少实例级配置**：每个实例的独立配置（Java 参数、内存分配等）未实现
4. ❌ **配置与业务耦合**：实例管理器直接操作元数据文件，未通过配置系统

### 1.2 前端现状

#### **状态管理** (`src/stores/instanceStore.ts`)

**当前实现**：
- Zustand store 管理实例状态
- localStorage 持久化选中状态
- 调用 Rust API 进行实例操作

**缺失功能**：
- ❌ 实例配置管理
- ❌ 全局配置同步
- ❌ 配置变更通知

#### **UI 组件**

**实例管理页面**：
- `InstanceManage.tsx` - 实例管理主页面（卡片视图）
- `InstanceList.tsx` - 实例列表页面（列表视图）
- `Instance.tsx` - 实例展示组件

**配置相关页面**：
- `GameSettingsGeneral.tsx` - 通用设置（待开发）
- `GameSettingsJava.tsx` - Java 管理（待开发）
- `GameSettingsDownload.tsx` - 下载设置（待开发）
- `GameSettingsAppearance.tsx` - 外观设置（主题系统已实现）

---

## 2. 架构设计

### 2.1 设计原则

1. **单一数据源**：所有配置统一存储在配置文件中
2. **配置与业务分离**：业务逻辑不直接操作配置文件
3. **类型安全**：Rust 和 TypeScript 两端保持类型一致
4. **响应式更新**：配置变更自动通知前端
5. **向后兼容**：支持配置文件版本迁移

### 2.2 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
├─────────────────────────────────────────────────────────┤
│  UI Components  │  Zustand Stores  │  Config Hooks     │
└────────┬─────────────────┬──────────────────┬──────────┘
         │                 │                  │
         │ invoke()        │ subscribe()      │ useConfig()
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Tauri Command Layer                    │
│  - get_config()         - update_instance_config()      │
│  - update_config()      - get_instance_config()         │
│  - get_value()          - reset_config()                │
│  - write_config()       - export_config()               │
│                         - import_config()               │
└────────┬─────────────────────────────────┬──────────────┘
         │                                 │
         │ State<'_, ConfigManager>        │ State<'_, InstanceManager>
         ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────────┐
│   ConfigManager     │         │    InstanceManager      │
│  - config: Mutex    │         │  - base_path: PathBuf   │
│  - window: Mutex    │         │  - scan_instances()     │
│  - get_value()      │         │  - create_instance()    │
│  - write_config()   │         │  - delete_instance()    │
└─────────────────────┘         └─────────────────────────┘
         │                                 │
         └──────────┬──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  app_config.json     │
         │  instance_configs/   │
         └──────────────────────┘
```

### 2.3 配置层次结构

```
配置系统
├── 全局配置 (Global Config)
│   ├── 应用配置 (App Config)
│   │   ├── base_path
│   │   └── ...
│   ├── 窗口配置 (Window Config)
│   │   ├── x, y, width, height, maximized
│   │   └── ...
│   └── 用户偏好 (User Preferences)
│       ├── theme
│       ├── language
│       └── ...
│
├── 实例配置 (Instance Config)
│   ├── 基础配置 (Base Config)
│   │   ├── name
│   │   ├── version
│   │   ├── loader_type
│   │   └── loader_version
│   ├── Java 配置 (Java Config)
│   │   ├── java_path
│   │   ├── java_arguments
│   │   └── memory
│   ├── 图形配置 (Graphics Config)
│   │   ├── resolution
│   │   └── fullscreen
│   └── 其他配置 (Other Config)
│       └── ...
│
└── 下载配置 (Download Config)
    ├── download_path
    ├── concurrent_limit
    └── ...
```

---

## 3. 数据模型设计

### 3.1 Rust 后端数据模型

#### **配置文件结构** (`src-tauri/src/config/models.rs`)

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 配置版本号，用于迁移
pub const CONFIG_VERSION: u32 = 1;

/// # 全局配置结构
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    /// 配置文件版本
    #[serde(default = "default_version")]
    pub version: u32,
    
    /// 应用基础路径
    pub base_path: PathBuf,
    
    /// 窗口位置配置
    #[serde(default)]
    pub window_position: WindowPosition,
    
    /// 用户偏好配置
    #[serde(default)]
    pub preferences: UserPreferences,
    
    /// 下载配置
    #[serde(default)]
    pub download: DownloadConfig,
    
    /// 实例配置映射（实例 ID -> 配置）
    #[serde(default)]
    pub instance_configs: std::collections::HashMap<String, InstanceConfig>,
}

fn default_version() -> u32 {
    CONFIG_VERSION
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: CONFIG_VERSION,
            base_path: CONFIG_FILE_PATH.clone(),
            window_position: WindowPosition::default(),
            preferences: UserPreferences::default(),
            download: DownloadConfig::default(),
            instance_configs: std::collections::HashMap::new(),
        }
    }
}

/// # 用户偏好配置
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserPreferences {
    /// 主题模式 (dark/light/system)
    #[serde(default = "default_theme")]
    pub theme: String,
    
    /// 强调色
    #[serde(default = "default_accent")]
    pub accent_color: String,
    
    /// 语言
    #[serde(default = "default_language")]
    pub language: String,
    
    /// 是否启用动画
    #[serde(default = "default_true")]
    pub enable_animation: bool,
}

fn default_theme() -> String { "dark".to_string() }
fn default_accent() -> String { "indigo".to_string() }
fn default_language() -> String { "zh-CN".to_string() }
fn default_true() -> bool { true }

/// # 下载配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DownloadConfig {
    /// 下载目录路径
    pub download_path: PathBuf,
    
    /// 并发下载数量
    #[serde(default = "default_concurrent")]
    pub concurrent_limit: u32,
    
    /// 是否自动校验文件
    #[serde(default = "default_true")]
    pub auto_verify: bool,
}

impl Default for DownloadConfig {
    fn default() -> Self {
        Self {
            download_path: DOWNLOAD_BASE_PATH.clone(),
            concurrent_limit: 16,
            auto_verify: true,
        }
    }
}

/// # 实例配置结构
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstanceConfig {
    /// 实例 ID（与 GameInstance.id 一致）
    pub id: String,
    
    /// 实例名称
    pub name: String,
    
    /// 游戏版本
    pub version: String,
    
    /// 模组加载器类型
    pub loader_type: ModLoaderType,
    
    /// 模组加载器版本
    pub loader_version: Option<String>,
    
    /// Java 配置
    #[serde(default)]
    pub java: JavaConfig,
    
    /// 内存配置
    #[serde(default)]
    pub memory: MemoryConfig,
    
    /// 图形配置
    #[serde(default)]
    pub graphics: GraphicsConfig,
    
    /// 自定义参数
    #[serde(default)]
    pub custom_args: Vec<String>,
    
    /// 图标路径
    pub icon_path: Option<String>,
    
    /// 最后游玩时间
    pub last_played: Option<i64>,
    
    /// 创建时间
    pub created_at: i64,
    
    /// 是否启用
    #[serde(default = "default_true")]
    pub enabled: bool,
}

impl Default for InstanceConfig {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            version: String::new(),
            loader_type: ModLoaderType::Vanilla,
            loader_version: None,
            java: JavaConfig::default(),
            memory: MemoryConfig::default(),
            graphics: GraphicsConfig::default(),
            custom_args: Vec::new(),
            icon_path: None,
            last_played: None,
            created_at: chrono::Utc::now().timestamp(),
            enabled: true,
        }
    }
}

/// # Java 配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JavaConfig {
    /// Java 可执行文件路径
    pub java_path: Option<String>,
    
    /// Java 参数
    #[serde(default)]
    pub java_args: Vec<String>,
    
    /// 是否使用 bundled Java
    #[serde(default = "default_true")]
    pub use_bundled: bool,
}

impl Default for JavaConfig {
    fn default() -> Self {
        Self {
            java_path: None,
            java_args: Vec::new(),
            use_bundled: true,
        }
    }
}

/// # 内存配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MemoryConfig {
    /// 最小内存 (MB)
    #[serde(default = "default_min_memory")]
    pub min_memory: u32,
    
    /// 最大内存 (MB)
    #[serde(default = "default_max_memory")]
    pub max_memory: u32,
}

fn default_min_memory() -> u32 { 512 }
fn default_max_memory() -> u32 { 2048 }

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            min_memory: default_min_memory(),
            max_memory: default_max_memory(),
        }
    }
}

/// # 图形配置
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GraphicsConfig {
    /// 窗口宽度
    #[serde(default = "default_width")]
    pub width: u32,
    
    /// 窗口高度
    #[serde(default = "default_height")]
    pub height: u32,
    
    /// 是否全屏
    #[serde(default)]
    pub fullscreen: bool,
}

fn default_width() -> u32 { 1920 }
fn default_height() -> u32 { 1080 }

impl Default for GraphicsConfig {
    fn default() -> Self {
        Self {
            width: default_width(),
            height: default_height(),
            fullscreen: false,
        }
    }
}
```

#### **配置管理器增强** (`src-tauri/src/config/manager.rs`)

```rust
use crate::config::{
    AppConfig, ConfigManager, InstanceConfig, WindowPosition, CONFIG_APPLICATION, 
    CONFIG_FILE_PATH, MIN_HEIGHT, MIN_WIDTH,
};
use crate::{log_error, log_info};
use serde::Serialize;
use serde_json::Value;
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::State;

impl ConfigManager {
    // ... 现有方法保持不变 ...

    /// # 获取实例配置
    pub fn get_instance_config(&self, instance_id: &str) -> Result<Option<InstanceConfig>, String> {
        let config = self.get_config()?;
        Ok(config.instance_configs.get(instance_id).cloned())
    }

    /// # 更新实例配置
    pub fn update_instance_config(
        &self,
        instance_id: &str,
        new_config: InstanceConfig,
    ) -> Result<(), String> {
        let mut config = self.get_config()?;
        config.instance_configs.insert(instance_id.to_string(), new_config);
        self.update_config(config)
    }

    /// # 删除实例配置
    pub fn remove_instance_config(&self, instance_id: &str) -> Result<(), String> {
        let mut config = self.get_config()?;
        config.instance_configs.remove(instance_id);
        self.update_config(config)
    }

    /// # 获取所有实例配置
    pub fn get_all_instance_configs(&self) -> Result<std::collections::HashMap<String, InstanceConfig>, String> {
        let config = self.get_config()?;
        Ok(config.instance_configs.clone())
    }

    /// # 重置配置到默认值
    pub fn reset_config(&self) -> Result<(), String> {
        let default = AppConfig::default();
        self.update_config(default)
    }

    /// # 导出配置到文件
    pub fn export_config(&self, target_path: PathBuf) -> Result<(), String> {
        let config = self.get_config()?;
        let json = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("序列化配置失败：{}", e))?;
        fs::write(&target_path, json)
            .map_err(|e| format!("写入配置失败：{}", e))?;
        log_info!("配置已导出到：{}", target_path.to_string_lossy());
        Ok(())
    }

    /// # 从文件导入配置
    pub fn import_config(&self, source_path: PathBuf) -> Result<(), String> {
        let content = fs::read_to_string(&source_path)
            .map_err(|e| format!("读取配置失败：{}", e))?;
        let imported: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("解析配置失败：{}", e))?;
        
        // 版本迁移
        let migrated = self.migrate_config(imported)?;
        self.update_config(migrated)
    }

    /// # 配置版本迁移
    fn migrate_config(&self, mut config: AppConfig) -> Result<AppConfig, String> {
        let current_version = CONFIG_VERSION;
        
        if config.version < current_version {
            log_info!("检测到旧版本配置 (v{} -> v{})", config.version, current_version);
            
            // 版本迁移逻辑
            match config.version {
                0 => {
                    // v0 -> v1 迁移
                    config.version = 1;
                    // 添加迁移逻辑...
                }
                _ => {}
            }
            
            // 递归迁移
            if config.version < current_version {
                return self.migrate_config(config);
            }
        }
        
        Ok(config)
    }
}
```

### 3.2 前端 TypeScript 类型定义

#### **配置类型** (`src/types/config.ts`)

```typescript
// 配置版本
export const CONFIG_VERSION = 1;

/**
 * 全局配置结构
 */
export interface AppConfig {
  version: number;
  base_path: string;
  window_position: WindowPosition;
  preferences: UserPreferences;
  download: DownloadConfig;
  instance_configs: Record<string, InstanceConfig>;
}

/**
 * 窗口位置配置
 */
export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

/**
 * 用户偏好配置
 */
export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  accent_color: string;
  language: 'zh-CN' | 'en-US';
  enable_animation: boolean;
}

/**
 * 下载配置
 */
export interface DownloadConfig {
  download_path: string;
  concurrent_limit: number;
  auto_verify: boolean;
}

/**
 * 实例配置
 */
export interface InstanceConfig {
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  java: JavaConfig;
  memory: MemoryConfig;
  graphics: GraphicsConfig;
  custom_args: string[];
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}

/**
 * Java 配置
 */
export interface JavaConfig {
  java_path: string | null;
  java_args: string[];
  use_bundled: boolean;
}

/**
 * 内存配置
 */
export interface MemoryConfig {
  min_memory: number;
  max_memory: number;
}

/**
 * 图形配置
 */
export interface GraphicsConfig {
  width: number;
  height: number;
  fullscreen: boolean;
}
```

---

## 4. API 设计

### 4.1 Rust Tauri 命令

#### **配置相关命令** (`src-tauri/src/config/commands.rs`)

```rust
use crate::config::{AppConfig, ConfigManager, InstanceConfig};
use std::path::PathBuf;
use tauri::State;

/// # 获取全局配置
#[tauri::command]
pub fn get_config(config_manager: State<'_, ConfigManager>) -> Result<AppConfig, String> {
    config_manager.get_config()
}

/// # 更新全局配置
#[tauri::command]
pub fn update_config(
    config_manager: State<'_, ConfigManager>,
    new_config: AppConfig,
) -> Result<(), String> {
    config_manager.update_config(new_config)
}

/// # 动态获取配置值
#[tauri::command]
pub fn get_config_value(
    config_manager: State<'_, ConfigManager>,
    key: String,
) -> Result<Option<String>, String> {
    config_manager.get_value(&key)
}

/// # 动态写入配置值
#[tauri::command]
pub fn set_config_value<T: Serialize>(
    config_manager: State<'_, ConfigManager>,
    key: String,
    value: T,
) -> Result<(), String> {
    config_manager.write_config(&key, value)
}

/// # 获取实例配置
#[tauri::command]
pub fn get_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<Option<InstanceConfig>, String> {
    config_manager.get_instance_config(&instance_id)
}

/// # 更新实例配置
#[tauri::command]
pub fn update_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
    config: InstanceConfig,
) -> Result<(), String> {
    config_manager.update_instance_config(&instance_id, config)
}

/// # 删除实例配置
#[tauri::command]
pub fn remove_instance_config(
    config_manager: State<'_, ConfigManager>,
    instance_id: String,
) -> Result<(), String> {
    config_manager.remove_instance_config(&instance_id)
}

/// # 重置配置到默认值
#[tauri::command]
pub fn reset_config(config_manager: State<'_, ConfigManager>) -> Result<(), String> {
    config_manager.reset_config()
}

/// # 导出配置
#[tauri::command]
pub fn export_config(
    config_manager: State<'_, ConfigManager>,
    target_path: String,
) -> Result<(), String> {
    config_manager.export_config(PathBuf::from(target_path))
}

/// # 导入配置
#[tauri::command]
pub fn import_config(
    config_manager: State<'_, ConfigManager>,
    source_path: String,
) -> Result<(), String> {
    config_manager.import_config(PathBuf::from(source_path))
}
```

#### **注册命令** (`src-tauri/src/lib.rs`)

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! 来自 Rust 后端的问候", name)
}

// ... 其他现有命令 ...

// 配置相关命令注册
tauri::generate_handler![
    greet,
    get_system_info,
    // 账户相关
    add_account,
    get_account_list,
    // ... 其他账户命令 ...
    // 配置相关
    get_config,
    update_config,
    get_config_value,
    set_config_value,
    get_instance_config,
    update_instance_config,
    remove_instance_config,
    reset_config,
    export_config,
    import_config,
    // 实例相关
    scan_instances,
    create_instance,
    // ... 其他实例命令 ...
]
```

### 4.2 前端 API 封装

#### **配置 API 封装** (`src/helper/configApi.ts`)

```typescript
import { invokeRustFunction } from './rustInvoke';
import type { AppConfig, InstanceConfig } from '@/types/config';
import { logger } from './logger';

/**
 * 获取全局配置
 */
export const getConfig = async (): Promise<AppConfig> => {
  logger.info('获取全局配置');
  return await invokeRustFunction('get_config', {});
};

/**
 * 更新全局配置
 */
export const updateConfig = async (newConfig: AppConfig): Promise<void> => {
  logger.info('更新全局配置', newConfig);
  return await invokeRustFunction('update_config', { new_config: newConfig });
};

/**
 * 动态获取配置值
 * @param key 配置键路径，如 'preferences.theme'
 */
export const getConfigValue = async (key: string): Promise<string | null> => {
  logger.info('获取配置值', { key });
  return await invokeRustFunction('get_config_value', { key });
};

/**
 * 动态设置配置值
 * @param key 配置键路径
 * @param value 配置值
 */
export const setConfigValue = async <T>(key: string, value: T): Promise<void> => {
  logger.info('设置配置值', { key, value });
  return await invokeRustFunction('set_config_value', { key, value });
};

/**
 * 获取实例配置
 */
export const getInstanceConfig = async (instanceId: string): Promise<InstanceConfig | null> => {
  logger.info('获取实例配置', { instanceId });
  return await invokeRustFunction('get_instance_config', { instance_id: instanceId });
};

/**
 * 更新实例配置
 */
export const updateInstanceConfig = async (
  instanceId: string,
  config: InstanceConfig
): Promise<void> => {
  logger.info('更新实例配置', { instanceId, config });
  return await invokeRustFunction('update_instance_config', { 
    instance_id: instanceId, 
    config 
  });
};

/**
 * 删除实例配置
 */
export const removeInstanceConfig = async (instanceId: string): Promise<void> => {
  logger.info('删除实例配置', { instanceId });
  return await invokeRustFunction('remove_instance_config', { instance_id: instanceId });
};

/**
 * 重置配置到默认值
 */
export const resetConfig = async (): Promise<void> => {
  logger.info('重置配置到默认值');
  return await invokeRustFunction('reset_config', {});
};

/**
 * 导出配置到文件
 */
export const exportConfig = async (targetPath: string): Promise<void> => {
  logger.info('导出配置', { targetPath });
  return await invokeRustFunction('export_config', { target_path: targetPath });
};

/**
 * 从文件导入配置
 */
export const importConfig = async (sourcePath: string): Promise<void> => {
  logger.info('导入配置', { sourcePath });
  return await invokeRustFunction('import_config', { source_path: sourcePath });
};
```

---

## 5. 前端集成方案

### 5.1 配置 Store

#### **配置状态管理** (`src/stores/configStore.ts`)

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getConfig, updateConfig, setConfigValue } from '@/helper/configApi';
import type { AppConfig, InstanceConfig, UserPreferences } from '@/types/config';

interface ConfigState {
  // 配置数据
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  
  // 初始化
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // 全局配置操作
  updateGlobalConfig: (partial: Partial<AppConfig>) => Promise<void>;
  setPreference: (key: keyof UserPreferences, value: any) => Promise<void>;
  
  // 实例配置操作
  getInstanceConfig: (instanceId: string) => InstanceConfig | null;
  updateInstanceConfig: (instanceId: string, config: Partial<InstanceConfig>) => Promise<void>;
  removeInstanceConfig: (instanceId: string) => Promise<void>;
  
  // 动态配置操作
  setConfigValue: <T>(key: string, value: T) => Promise<void>;
  
  // 配置导入导出
  exportConfig: (path: string) => Promise<void>;
  importConfig: (path: string) => Promise<void>;
  resetConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  subscribeWithSelector((set, get) => ({
    config: null,
    loading: false,
    error: null,
    
    // 初始化配置
    init: async () => {
      set({ loading: true, error: null });
      try {
        const config = await getConfig();
        set({ config, loading: false });
      } catch (e) {
        set({ 
          error: e instanceof Error ? e.message : '加载配置失败', 
          loading: false 
        });
      }
    },
    
    // 刷新配置
    refresh: async () => {
      try {
        const config = await getConfig();
        set({ config });
      } catch {
        // 保持现有配置
      }
    },
    
    // 更新全局配置
    updateGlobalConfig: async (partial) => {
      const current = get().config;
      if (!current) return;
      
      const updated = { ...current, ...partial };
      await updateConfig(updated);
      set({ config: updated });
    },
    
    // 设置用户偏好
    setPreference: async (key, value) => {
      const current = get().config;
      if (!current) return;
      
      const updated = {
        ...current,
        preferences: {
          ...current.preferences,
          [key]: value,
        },
      };
      
      await setConfigValue(`preferences.${key}`, value);
      set({ config: updated });
    },
    
    // 获取实例配置
    getInstanceConfig: (instanceId) => {
      const { config } = get();
      if (!config) return null;
      return config.instance_configs[instanceId] || null;
    },
    
    // 更新实例配置
    updateInstanceConfig: async (instanceId, partial) => {
      const current = get().getInstanceConfig(instanceId);
      if (!current) return;
      
      const updated = { ...current, ...partial };
      await import('@/helper/configApi').then(m => m.updateInstanceConfig(instanceId, updated));
      
      // 更新本地状态
      const globalConfig = get().config;
      if (globalConfig) {
        set({
          config: {
            ...globalConfig,
            instance_configs: {
              ...globalConfig.instance_configs,
              [instanceId]: updated,
            },
          },
        });
      }
    },
    
    // 删除实例配置
    removeInstanceConfig: async (instanceId) => {
      await import('@/helper/configApi').then(m => m.removeInstanceConfig(instanceId));
      
      const globalConfig = get().config;
      if (globalConfig) {
        const { [instanceId]: removed, ...rest } = globalConfig.instance_configs;
        set({
          config: {
            ...globalConfig,
            instance_configs: rest,
          },
        });
      }
    },
    
    // 动态设置配置值
    setConfigValue: async (key, value) => {
      await setConfigValue(key, value);
      await get().refresh();
    },
    
    // 导出配置
    exportConfig: async (path) => {
      await import('@/helper/configApi').then(m => m.exportConfig(path));
    },
    
    // 导入配置
    importConfig: async (path) => {
      await import('@/helper/configApi').then(m => m.importConfig(path));
      await get().refresh();
    },
    
    // 重置配置
    resetConfig: async () => {
      await import('@/helper/configApi').then(m => m.resetConfig());
      await get().refresh();
    },
  }))
);
```

### 5.2 配置 Hook

#### **useConfig Hook** (`src/hooks/useConfig.ts`)

```typescript
import { useCallback } from 'react';
import { useConfigStore } from '@/stores/configStore';
import type { InstanceConfig, UserPreferences } from '@/types/config';

/**
 * 全局配置 Hook
 */
export const useConfig = () => {
  const config = useConfigStore((s) => s.config);
  const loading = useConfigStore((s) => s.loading);
  const error = useConfigStore((s) => s.error);
  const init = useConfigStore((s) => s.init);
  const refresh = useConfigStore((s) => s.refresh);
  
  return {
    config,
    loading,
    error,
    init,
    refresh,
  };
};

/**
 * 用户偏好 Hook
 */
export const usePreferences = () => {
  const preferences = useConfigStore((s) => s.config?.preferences);
  const setPreference = useConfigStore((s) => s.setPreference);
  
  const setTheme = useCallback((theme: UserPreferences['theme']) => {
    return setPreference('theme', theme);
  }, [setPreference]);
  
  const setLanguage = useCallback((language: UserPreferences['language']) => {
    return setPreference('language', language);
  }, [setPreference]);
  
  const toggleAnimation = useCallback(() => {
    const current = preferences?.enable_animation ?? true;
    return setPreference('enable_animation', !current);
  }, [preferences, setPreference]);
  
  return {
    preferences,
    setTheme,
    setLanguage,
    toggleAnimation,
  };
};

/**
 * 实例配置 Hook
 */
export const useInstanceConfig = (instanceId: string) => {
  const instanceConfig = useConfigStore((s) => s.getInstanceConfig(instanceId));
  const updateInstanceConfig = useConfigStore((s) => s.updateInstanceConfig);
  const removeInstanceConfig = useConfigStore((s) => s.removeInstanceConfig);
  
  const updateJava = useCallback((javaPath: string, javaArgs: string[]) => {
    return updateInstanceConfig(instanceId, {
      java: {
        ...instanceConfig?.java,
        java_path: javaPath,
        java_args: javaArgs,
      },
    });
  }, [instanceId, instanceConfig, updateInstanceConfig]);
  
  const updateMemory = useCallback((minMemory: number, maxMemory: number) => {
    return updateInstanceConfig(instanceId, {
      memory: {
        min_memory: minMemory,
        max_memory: maxMemory,
      },
    });
  }, [instanceId, updateInstanceConfig]);
  
  return {
    instanceConfig,
    updateJava,
    updateMemory,
    removeInstanceConfig,
  };
};

/**
 * 下载配置 Hook
 */
export const useDownloadConfig = () => {
  const downloadConfig = useConfigStore((s) => s.config?.download);
  const updateGlobalConfig = useConfigStore((s) => s.updateGlobalConfig);
  
  const setDownloadPath = useCallback((path: string) => {
    return updateGlobalConfig({
      download: {
        ...downloadConfig!,
        download_path: path,
      },
    });
  }, [downloadConfig, updateGlobalConfig]);
  
  const setConcurrentLimit = useCallback((limit: number) => {
    return updateGlobalConfig({
      download: {
        ...downloadConfig!,
        concurrent_limit: limit,
      },
    });
  }, [downloadConfig, updateGlobalConfig]);
  
  return {
    downloadConfig,
    setDownloadPath,
    setConcurrentLimit,
  };
};
```

### 5.3 UI 组件集成

#### **实例配置面板** (`src/components/InstanceConfigPanel.tsx`)

```typescript
import React, { useState } from 'react';
import { useInstanceConfig } from '@/hooks/useConfig';
import { useDialog } from '@/hooks/useDialog';
import { ConfirmPopup } from '@/components/popup/ConfirmPopup';
import { useNotification } from '@/components/common';

interface InstanceConfigPanelProps {
  instanceId: string;
  onClose: () => void;
}

const InstanceConfigPanel: React.FC<InstanceConfigPanelProps> = ({ instanceId, onClose }) => {
  const { instanceConfig, updateJava, updateMemory } = useInstanceConfig(instanceId);
  const { dialog, showConfirm } = useDialog();
  const { success, error: notifyError } = useNotification();
  
  const [javaPath, setJavaPath] = useState(instanceConfig?.java.java_path || '');
  const [javaArgs, setJavaArgs] = useState(instanceConfig?.java.java_args.join(' ') || '');
  const [minMemory, setMinMemory] = useState(instanceConfig?.memory.min_memory || 512);
  const [maxMemory, setMaxMemory] = useState(instanceConfig?.memory.max_memory || 2048);
  
  const handleSave = async () => {
    try {
      await updateJava(javaPath, javaArgs.split(' ').filter(Boolean));
      await updateMemory(minMemory, maxMemory);
      success('配置已保存');
      onClose();
    } catch (e) {
      notifyError('保存失败', e instanceof Error ? e.message : '未知错误');
    }
  };
  
  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: '确认重置',
      message: '确定要重置此实例的配置吗？',
      type: 'warning',
    });
    
    if (confirmed) {
      // 重置逻辑
    }
  };
  
  if (!instanceConfig) {
    return <div>加载中...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-text-primary">实例配置</h2>
      
      {/* Java 配置 */}
      <section>
        <h3 className="text-lg font-semibold text-text-secondary mb-3">Java 设置</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-tertiary">Java 路径</label>
            <input
              type="text"
              value={javaPath}
              onChange={(e) => setJavaPath(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
              placeholder="例如：C:/Program Files/Java/jdk-17/bin/java.exe"
            />
          </div>
          <div>
            <label className="text-sm text-text-tertiary">Java 参数</label>
            <input
              type="text"
              value={javaArgs}
              onChange={(e) => setJavaArgs(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
              placeholder="-Xmx2G -Xms1G"
            />
          </div>
        </div>
      </section>
      
      {/* 内存配置 */}
      <section>
        <h3 className="text-lg font-semibold text-text-secondary mb-3">内存设置</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-tertiary">最小内存 (MB)</label>
            <input
              type="number"
              value={minMemory}
              onChange={(e) => setMinMemory(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
            />
          </div>
          <div>
            <label className="text-sm text-text-tertiary">最大内存 (MB)</label>
            <input
              type="number"
              value={maxMemory}
              onChange={(e) => setMaxMemory(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
            />
          </div>
        </div>
      </section>
      
      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-text-secondary hover:text-text-primary"
        >
          重置
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-surface hover:bg-surface-hover rounded text-text-primary"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary hover:bg-primary-hover rounded text-text-primary"
        >
          保存
        </button>
      </div>
      
      {/* 对话框 */}
      <ConfirmPopup
        isOpen={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        iconType={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
        onClose={dialog.onClose}
      />
    </div>
  );
};

export default InstanceConfigPanel;
```

---

## 6. 配置文件结构

### 6.1 配置文件位置

```
{app_data_dir}/.smcl/
├── app_config.json           # 主配置文件
├── instance_configs/         # 实例配置目录（可选，用于分离大配置）
│   └── {instance_id}.json
└── logs/                     # 日志目录
```

### 6.2 配置文件示例

```json
{
  "version": 1,
  "base_path": "C:/Users/User/AppData/Local/s1yle/mc_launcher",
  "window_position": {
    "x": 100,
    "y": 100,
    "width": 1024,
    "height": 680,
    "maximized": false
  },
  "preferences": {
    "theme": "dark",
    "accent_color": "indigo",
    "language": "zh-CN",
    "enable_animation": true
  },
  "download": {
    "download_path": "C:/Users/User/AppData/Local/s1yle/mc_launcher/download",
    "concurrent_limit": 16,
    "auto_verify": true
  },
  "instance_configs": {
    "uuid-1": {
      "id": "uuid-1",
      "name": "生存服务器",
      "version": "1.20.4",
      "loader_type": "Fabric",
      "loader_version": "0.15.7",
      "java": {
        "java_path": "C:/Program Files/Java/jdk-17/bin/java.exe",
        "java_args": ["-XX:+UseG1GC"],
        "use_bundled": false
      },
      "memory": {
        "min_memory": 1024,
        "max_memory": 4096
      },
      "graphics": {
        "width": 1920,
        "height": 1080,
        "fullscreen": false
      },
      "custom_args": [],
      "icon_path": null,
      "last_played": 1714377600,
      "created_at": 1714291200,
      "enabled": true
    }
  }
}
```

---

## 7. 实现路线图

### Phase 1: 后端基础 (Week 1-2)

#### **任务清单**

- [ ] **7.1.1** 更新 `models.rs`
  - [ ] 添加 `InstanceConfig` 结构体
  - [ ] 添加 `JavaConfig`, `MemoryConfig`, `GraphicsConfig`
  - [ ] 更新 `AppConfig` 包含实例配置映射
  - [ ] 实现 `Default` trait

- [ ] **7.1.2** 增强 `manager.rs`
  - [ ] 实现 `get_instance_config()`
  - [ ] 实现 `update_instance_config()`
  - [ ] 实现 `remove_instance_config()`
  - [ ] 实现配置迁移逻辑

- [ ] **7.1.3** 创建 `commands.rs`
  - [ ] 实现所有配置相关 Tauri 命令
  - [ ] 在 `lib.rs` 中注册命令

- [ ] **7.1.4** 单元测试
  - [ ] 配置读写测试
  - [ ] 实例配置 CRUD 测试
  - [ ] 配置迁移测试

### Phase 2: 前端基础 (Week 3)

#### **任务清单**

- [ ] **7.2.1** 创建类型定义
  - [ ] `src/types/config.ts`
  - [ ] 导出所有配置类型

- [ ] **7.2.2** API 封装
  - [ ] `src/helper/configApi.ts`
  - [ ] 封装所有配置 API 调用

- [ ] **7.2.3** Zustand Store
  - [ ] `src/stores/configStore.ts`
  - [ ] 实现配置状态管理
  - [ ] 添加订阅通知机制

- [ ] **7.2.4** 自定义 Hooks
  - [ ] `src/hooks/useConfig.ts`
  - [ ] `usePreferences`
  - [ ] `useInstanceConfig`
  - [ ] `useDownloadConfig`

### Phase 3: UI 组件 (Week 4)

#### **任务清单**

- [ ] **7.3.1** 实例配置面板
  - [ ] `src/components/InstanceConfigPanel.tsx`
  - [ ] Java 配置表单
  - [ ] 内存配置表单

- [ ] **7.3.2** 全局设置页面
  - [ ] 更新 `GameSettingsGeneral.tsx`
  - [ ] 下载配置表单
  - [ ] 用户偏好设置

- [ ] **7.3.3** 配置导入导出
  - [ ] 配置文件选择器
  - [ ] 导入导出对话框

### Phase 4: 集成测试 (Week 5)

#### **任务清单**

- [ ] **7.4.1** 端到端测试
  - [ ] 配置创建流程
  - [ ] 配置更新流程
  - [ ] 配置导入导出流程

- [ ] **7.4.2** 性能测试
  - [ ] 大配置文件加载性能
  - [ ] 配置更新响应时间

- [ ] **7.4.3** 兼容性测试
  - [ ] 配置文件版本迁移
  - [ ] 跨平台测试（Windows/Linux/macOS）

### Phase 5: 文档与优化 (Week 6)

#### **任务清单**

- [ ] **7.5.1** 文档编写
  - [ ] API 文档
  - [ ] 用户使用指南
  - [ ] 开发者指南

- [ ] **7.5.2** 性能优化
  - [ ] 配置缓存机制
  - [ ] 懒加载配置

- [ ] **7.5.3** 错误处理
  - [ ] 完善错误消息
  - [ ] 添加回滚机制

---

## 8. 最佳实践

### 8.1 配置命名规范

```typescript
// ✅ 好的命名
preferences.theme
download.concurrent_limit
instance_configs.{id}.java.java_path

// ❌ 避免的命名
config.data.settings
instance.javaPath  // 缺少层级
```

### 8.2 配置更新模式

```typescript
// ✅ 推荐：使用 Hook 封装
const { setPreference } = usePreferences();
await setPreference('theme', 'dark');

// ✅ 推荐：使用 Store 方法
await useConfigStore.getState().updateGlobalConfig({
  preferences: { theme: 'dark' }
});

// ❌ 避免：直接调用 invoke
await invoke('update_config', { ... });
```

### 8.3 错误处理

```typescript
// ✅ 推荐：完整的错误处理
try {
  await updateInstanceConfig(instanceId, config);
  success('配置已保存');
} catch (e) {
  const msg = e instanceof Error ? e.message : '保存失败';
  notifyError('保存失败', msg);
  logger.error('保存实例配置失败', e);
}

// ❌ 避免：忽略错误
updateInstanceConfig(instanceId, config);
```

### 8.4 配置迁移

```rust
// ✅ 推荐：版本迁移逻辑
fn migrate_config(&self, mut config: AppConfig) -> Result<AppConfig, String> {
    match config.version {
        0 => {
            // v0 -> v1
            config.new_field = default_value();
            config.version = 1;
        }
        v if v < CONFIG_VERSION => {
            return Err(format!("不支持的配置版本：{}", v));
        }
        _ => {}
    }
    Ok(config)
}
```

### 8.5 性能优化

```typescript
// ✅ 推荐：配置缓存
const useCachedConfig = () => {
  const config = useConfigStore(s => s.config);
  const memoized = useMemo(() => computeExpensive(config), [config]);
  return memoized;
};

// ✅ 推荐：防抖更新
const debouncedUpdate = useMemo(
  () => debounce((value) => updateConfig(value), 300),
  []
);
```

---

## 附录

### A. 配置文件版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1 | 2026-04-29 | 初始版本，包含全局配置和实例配置 |

### B. 相关文档

- [Tauri 配置管理文档](https://tauri.app/v1/guides/features/config/)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [Serde 文档](https://serde.rs/)

### C. 联系方式

- **开发者**: S1yle
- **Email**: [联系邮箱]
- **GitHub**: [s1yle/s1yle-launcher](https://github.com/s1yle/s1yle-launcher)

---

**文档状态**: ✅ 完成  
**最后更新**: 2026-04-29
