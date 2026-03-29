# S1yle Launcher - AI Agent 开发指南

## 1. 项目概述

S1yle Launcher 是一个 Minecraft 启动器，采用 Tauri 2 + React 19 技术栈构建。

## 2. 技术栈

### 前端
- **框架**: React 19.1.0 + React Router DOM 7.3.0
- **构建工具**: Vite 7.0.4
- **样式**: TailwindCSS 4.1.18 + PostCSS
- **动画**: Framer Motion 12.34.3
- **语言**: TypeScript ~5.8.3

### 后端 (Rust)
- **框架**: Tauri 2
- **异步运行时**: Tokio 1 (full features)
- **HTTP客户端**: reqwest 0.12 (json, stream)
- **序列化**: serde 1 + serde_json 1
- **日志**: tracing 0.1.44 + tracing-subscriber 0.3.22 + tracing-appender 0.2.4
- **工具库**: 
  - once_cell 1.21.3
  - chrono 0.4.44
  - uuid 1.21.0 (v8, v4, v3)
  - directories 6.0.0
  - dirs-next 2.0
  - md5 0.7
  - utc 0.2.0

## 3. 目录结构

```
s1yle-launcher/
├── src/                          # 前端源代码
│   ├── components/               # React 组件
│   │   ├── sidebar/              # 侧边栏组件
│   │   │   ├── content/         # 侧边栏内容组件
│   │   │   │   ├── AccountSidebarContent.tsx
│   │   │   │   ├── BaseSidebarContent.tsx
│   │   │   │   ├── CommonSidebarContent.tsx
│   │   │   │   └── GameSidebarContent.tsx
│   │   │   ├── layouts/         # 侧边栏布局
│   │   │   │   └── BaseSidebarLayout.tsx
│   │   │   ├── SmartSidebar.tsx
│   │   │   └── PageWithSidebar.tsx
│   │   ├── popup/               # 弹窗组件
│   │   │   ├── AlertPopup.tsx
│   │   │   ├── ConfirmPopup.tsx
│   │   │   └── LoadingPopup.tsx
│   │   ├── Header.tsx
│   │   ├── ActionButton.tsx
│   │   ├── Popup.tsx
│   │   └── RouterRenderer.tsx
│   ├── pages/                   # 页面组件
│   │   ├── Home.tsx
│   │   ├── AccountList.tsx
│   │   ├── AccountListWithSidebar.tsx
│   │   ├── MicrosoftAccount.tsx
│   │   ├── OfflineAccount.tsx
│   │   ├── Download.tsx
│   │   ├── DownloadGame.tsx
│   │   ├── DownloadWithSidebar.tsx
│   │   ├── DownloadModpack.tsx
│   │   ├── InstanceManage.tsx
│   │   ├── InstanceList.tsx
│   │   ├── Settings.tsx
│   │   ├── Multiplayer.tsx
│   │   ├── Feedback.tsx
│   │   └── Hint.tsx
│   ├── router/
│   │   └── config.ts            # 路由配置
│   ├── hooks/
│   │   └── useDownload.ts
│   ├── helper/
│   │   ├── rustInvoke.ts        # Rust 调用封装
│   │   ├── popupUtils.ts
│   │   └── logger.ts
│   ├── assets/                  # 静态资源
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                   # Tauri 后端
│   ├── src/
│   │   ├── lib.rs               # 库入口，导出所有命令
│   │   ├── main.rs              # 程序入口
│   │   ├── account.rs           # 账户管理
│   │   ├── config.rs            # 配置管理
│   │   ├── download.rs          # 下载管理
│   │   ├── launch.rs            # 游戏启动
│   │   ├── window.rs            # 窗口管理
│   │   └── json.rs
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # Tauri 配置
│   └── capabilities/
│       └── default.json         # 权限配置
├── package.json                 # 前端依赖
├── tsconfig.json                # TypeScript 配置
└── AGENTS.md                    # 本文件
```

## 4. 核心 API 定义

### 4.1 账户管理 (account.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `add_account` | `invokeAddAccount` | `name`, `account_type`, `access_token?`, `refresh_token?` | `string` (UUID) |
| `get_account_list` | `getAccountList` | - | `AccountInfo[]` |
| `get_current_account` | `getCurrentAccount` | - | `AccountInfo \| null` |
| `delete_account` | `deleteAccount` | `uuid` | `string` |
| `set_current_account` | `setCurrentAccount` | `uuid` | `string` |
| `save_accounts_to_disk` | `invokeSaveAccount` | - | - |
| `load_accounts_from_disk` | `invokeLoadAccount` | - | - |
| `initialize_account_system` | `invokeAccInit` | - | - |

**类型定义**:
```typescript
enum AccountType {
  Microsoft = "microsoft",
  Offline = "offline"
}

interface AccountInfo {
  name: string;
  account_type: AccountType;
  uuid: string;
  create_time: string;
  last_login_time: string | null;
}
```

### 4.2 游戏启动 (launch.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `tauri_launch_instance` | `launchInstance` | `config?: LaunchConfig` | `string` |
| `tauri_stop_instance` | `stopInstance` | - | `string` |
| `tauri_get_launch_status` | `getLaunchStatus` | - | `LaunchStatus` |
| `tauri_get_launch_config` | `getLaunchConfig` | - | `LaunchConfig` |
| `tauri_update_launch_config` | `updateLaunchConfig` | `config: LaunchConfig` | `string` |

**类型定义**:
```typescript
enum LaunchStatus {
  Idle = "Idle",
  Launching = "Launching",
  Running = "Running",
  Crashed = "Crashed",
  Stopped = "Stopped"
}

interface LaunchConfig {
  java_path: string;
  memory_mb: number;
  version: string;
  game_dir: string;
  assets_dir: string;
  username: string;
  uuid: string;
  access_token?: string;
}
```

### 4.3 下载管理 (download.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `get_version_manifest` | `getVersionManifest` | - | `VersionManifest` |
| `get_version_detail` | `getVersionDetail` | `versionId` | `any` |
| `download_file` | `downloadFile` | `url`, `filename` | `DownloadProgress` |
| `get_download_tasks` | `getDownloadTasks` | - | `DownloadTask[]` |
| `get_download_task` | `getDownloadTask` | `taskId` | `DownloadTask \| null` |
| `cancel_download` | `cancelDownload` | `taskId` | `string` |
| `clear_completed_tasks` | `clearCompletedTasks` | - | `string` |
| `get_game_versions` | `getGameVersions` | - | `string[]` |
| `get_download_base_path` | `getDownloadBasePath` | - | `string` |
| `set_download_base_path` | `setDownloadBasePath` | `path` | `string` |

### 4.4 窗口管理 (window.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `tauri_close_window` | `closeWindow` | - | `string` |

### 4.5 系统命令 (lib.rs)

| Rust 命令 | 参数 | 返回值 |
|-----------|------|--------|
| `greet` | `name: &str` | `string` |
| `get_system_info` | - | `{ os: string, arch: string }` |
| `log_frontend` | `level: string`, `message: string` | - |

## 5. 路由配置

路由定义在 `src/router/config.ts`:

```typescript
enum SidebarType {
  MAIN = 'main',
  SUB = 'sub',
  SECONDARY = 'secondary'
}

enum SidebarGroup {
  ACCOUNT = 'account',
  GAME = 'game',
  COMMON = 'common',
  NONE = 'none'
}
```

**页面路由**:
- `/` - Home (主页面)
- `/account` - 账户列表
- `/account/microsoft` - 微软账户
- `/account/offline` - 离线账户
- `/instance-manage` - 实例管理
- `/instance-list` - 实例列表
- `/download` - 下载
- `/download/game` - 游戏下载
- `/download/modpack` - 整合包下载
- `/settings` - 设置
- `/multiplayer` - 多人联机
- `/feedback` - 反馈与群组
- `/hint` - 启动器说明

## 6. 环境配置

### 6.1 数据目录

- **应用数据**: 使用 `directories` crate 跨平台获取
  - Linux: `~/.local/share/art/s1yle/mc_launcher/`
  - Windows: `%APPDATA%/art/s1yle/mc_launcher/`
  - macOS: `~/Library/Application Support/art.s1yle.mc_launcher/`

- **游戏下载目录**: 
  - 默认: `{data_local_dir}/art/s1yle/minecraft/`
  - 可通过 `set_download_base_path` 修改

### 6.2 日志配置

- **日志目录**: `{app_data_dir}/logs/`
- **日志格式**: `mc-launcher-{date}.log`
- **日志级别**: 默认 `info`，可通过环境变量 `RUST_LOG` 设置
- **保留天数**: 30天

### 6.3 窗口配置

- **默认尺寸**: 1280x800
- **最小尺寸**: 960x600
- **窗口类型**: 无边框 (`decorations: false`)、透明背景
- **主题**: 暗色 (`Dark`)

## 7. 编码规范

### 7.1 前端 (TypeScript/React)

- 使用 **TypeScript**，开启严格模式 (`strict: true`)
- 组件使用 **函数式组件** + **Hooks**
- 样式使用 **TailwindCSS**
- 动画使用 **Framer Motion**
- 路径别名: `@/*` 指向项目根目录

### 7.2 后端 (Rust)

- 使用 **Rust 2021 Edition**
- 命令使用 `#[tauri::command]` 宏导出
- 全局状态使用 `once_cell::sync::OnceCell` + `Mutex`
- 日志使用 `tracing` crate
- 错误处理返回 `Result<T, String>`

### 7.3 通用

- **无注释**: 代码本身应该是自解释的
- **类型安全**: 避免使用 `any`，优先使用具体类型
- **命名规范**: 
  - 前端: 驼峰命名 (camelCase)
  - 后端: 蛇形命名 (snake_case) 用于字段和命令参数

## 8. 常用命令

```bash
# 开发模式
pnpm dev

# 构建前端
pnpm build

# Tauri 开发
pnpm tauri dev

# Tauri 构建
pnpm tauri build
```

## 9. 注意事项

- 前端调用 Rust 使用 `@tauri-apps/api/core` 的 `invoke` 函数
- Rust 后端的所有命令都通过 `lib.rs` 的 `generate_handler!` 宏注册
- 窗口使用无边框模式，自定义标题栏需要实现拖动区域
- 游戏文件下载使用 `reqwest` 异步流式下载
