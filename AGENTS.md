# WeCraft! Launcher - 快速参考指南

> **最后更新**: 2026-05-27  
> **项目版本**: 0.1.0-alpha.1  
> **最新更新**: 文档维护更新（路由、Store、组件、API 同步）

---

## 0. Agent 操作规范

> **重要提醒**: 在执行任何命令或操作前，请先询问用户的意见。禁止使用任何 git 操作。

- 执行任何 Shell 命令前需征得用户同意
- 禁止使用 git 操作，除非用户明确要求
- 修改代码前先展示方案，征得用户确认后再执行
- 对于复杂的重构，需要先输出详细方案
- **代码风格**: 遵循现有代码约定，不添加注释（除非明确要求）

---

## 1. 项目概述

WeCraft! Launcher 是一个现代化的 Minecraft 启动器，采用 Tauri 2 + React 19 技术栈构建。

**核心特性**:
- Minecraft 版本管理（下载、安装、启动）
- 多账户支持（微软账号、离线账号）
- 模组加载器支持（Fabric、Forge、NeoForge）
- 文件完整性校验（SHA1）
- 跨平台支持（Windows、Linux、macOS）
- 国际化支持（中文、英文）
- 主题系统（暗色/亮色预设 + 7 种强调色 + 3 种终端主题）
- 实例管理（版本化目录结构，全局资源共享）
- **灵动岛导航系统**（悬浮式胶囊导航、毛玻璃效果）
- **双角色身份系统**（玩家 ↔ 服主无缝切换）
- **服主后台**（服务器管理、数据看板、配置上传）

**详细文档**:
- 架构设计：[`docs/architecture.md`](docs/architecture.md)
- 组件文档：[`docs/components.md`](docs/components.md)
- API 文档：[`docs/api.md`](docs/api.md)
- 更新日志：[`docs/changelog.md`](docs/changelog.md)

---

## 2. 技术栈

### 前端
- **框架**: React 19.1.0 + React Router DOM 7.3.0
- **构建工具**: Vite 7.0.4
- **样式**: TailwindCSS 4.1.18 + PostCSS
- **动画**: Framer Motion 12.34.3
- **状态管理**: Zustand 5.0 (带 persist 中间件)
- **国际化**: i18next 26.0 + react-i18next 17.0
- **图标**: lucide-react 1.7
- **语言**: TypeScript 5.8.3

### 后端 (Rust)
- **框架**: Tauri 2
- **异步运行时**: Tokio 1 (full features)
- **HTTP 客户端**: reqwest 0.12 (json, stream)
- **序列化**: serde 1 + serde_json 1
- **日志**: tracing 0.1.44 + tracing-subscriber 0.3.22
- **校验**: sha1 0.10, hex 0.4

---

## 3. 目录结构

```
src/
├── components/               # React 组件
│   ├── common/              # 通用组件
│   │   ├── Badge/           # 徽章组件
│   │   ├── BottomBar/       # 底部栏
│   │   ├── ContextStack/    # 上下文栈
│   │   ├── Instance/        # 实例相关组件
│   │   ├── Loading/         # 加载组件
│   │   ├── SettingsPanel/   # 设置面板
│   │   └── Version/         # 版本相关组件
│   ├── navigation/          # 导航组件（灵动岛）
│   ├── home/                # 主页组件
│   ├── header/              # 头部组件
│   ├── sidebar/             # 侧边栏组件
│   ├── popup/               # 弹窗组件
│   └── settings/            # 设置组件
├── pages/                    # 页面组件
│   ├── Home.tsx
│   ├── Settings.tsx
│   ├── AccountList/          # 账户页面
│   ├── Download/             # 下载页面
│   ├── Instance/             # 实例页面
│   │   └── InstanceSettings/ # 实例设置子页面
│   ├── Feedback/             # 反馈页面
│   └── admin/                # 服主后台
├── stores/                   # Zustand 状态管理
│   ├── userRoleStore.ts     # 角色状态
│   ├── uiModeStore.ts       # UI 模式
│   ├── layoutStore.ts       # 布局状态
│   ├── appStore.ts          # 应用全局状态
│   ├── configStore.ts       # 配置状态
│   └── ...
├── config/                   # 配置管理
│   ├── index.ts             # 统一配置入口
│   ├── types.ts             # 配置类型定义
│   └── navigationConfig.ts  # 导航配置
├── router/                   # 路由系统
│   ├── config.tsx           # 路由配置
│   └── routes.tsx           # 路由定义
├── helper/                   # 辅助工具
│   ├── rustInvoke.ts        # Rust API 调用
│   ├── logger.ts            # 日志工具
│   └── i18n.ts              # 国际化
├── hooks/                    # 自定义 Hooks
├── utils/                    # 工具函数
├── styles/                   # 样式文件
│   └── themes/              # 主题 CSS
├── types/                    # TypeScript 类型
├── main.tsx                  # 入口文件
└── App.tsx                   # 主应用组件
```

**详细目录结构**: 见 [`docs/architecture.md`](docs/architecture.md) §2

---

## 4. 核心路由

```
/                              # 主页（玩家/服主个人中心）
/account                       # 账户列表（含侧边栏）
/account/microsoft             # 微软账号
/account/offline               # 离线账号
/account/thirdparty            # 第三方账号
/instance-manage/:instanceId   # 实例管理（自动跳转子路由）
/instance-manage/:instanceId/game-settings    # 游戏设置
/instance-manage/:instanceId/auto-install     # 自动安装
/instance-manage/:instanceId/mods             # 模组管理
/instance-manage/:instanceId/resource-packs   # 材质包
/instance-manage/:instanceId/worlds           # 世界管理
/instance-list                 # 游戏列表
/download                      # 下载（自动跳转到 /download/game）
/download/game                 # 游戏下载
/download/game/:versionId      # 版本安装（全屏模式）
/download/modpack              # 整合包下载
/settings                      # 设置（自动跳转子路由）
/settings/appearance           # 外观设置
/hint                          # 启动器说明
/admin/servers                 # 服主后台 - 服务器管理
/admin/analytics               # 服主后台 - 数据看板
/admin/upload                  # 服主后台 - 配置上传
```

**已移除的页面**:
- ~~`/multiplayer`~~ - 多人联机
- ~~`/feedback`~~ - 反馈

**详细路由配置**: 见 [`src/router/config.tsx`](src/router/config.tsx)

---

## 5. 状态管理

**核心 Stores**:

| Store | 文件 | 用途 |
|-------|------|------|
| `userRoleStore` | `src/stores/userRoleStore.ts` | 用户角色（玩家/服主/创作者） |
| `uiModeStore` | `src/stores/uiModeStore.ts` | UI 模式（灵动岛/经典）、页面动画 |
| `layoutStore` | `src/stores/layoutStore.ts` | 布局状态（侧边栏宽度、折叠） |
| `themeStore` | `src/stores/themeStore.ts` | 主题管理（预设、强调色） |
| `navStore` | `src/stores/navStore.ts` | 导航状态（路径、历史） |
| `appStore` | `src/stores/appStore.ts` | 应用全局状态（系统信息、初始化） |
| `configStore` | `src/stores/configStore.ts` | 全局配置状态（AppConfig） |
| `instanceStore` | `src/stores/instanceStore.ts` | 实例管理（列表、文件夹、CRUD） |
| `downloadStore` | `src/stores/downloadStore.ts` | 下载管理（版本清单、任务、部署） |
| `accountStore` | `src/stores/accountStore.ts` | 账户管理 |

**使用示例**:
```typescript
import { useUserRoleStore } from '@/stores/userRoleStore';

const { currentRole, switchRole } = useUserRoleStore();
<button onClick={() => switchRole('admin')}>切换到服主</button>
```

**详细状态管理**: 见 [`docs/architecture.md`](docs/architecture.md) §4

---

## 6. 配置系统

### 6.1 分层架构

- **L1: localStorage** - UI 配置（立即同步）
- **L2: 配置文件** - 业务配置（防抖异步保存）
- **L3: 加密存储** - 敏感数据（立即异步保存）

### 6.2 统一配置入口

**核心文件**:
- `src/config/index.ts` - 统一配置管理器
- `src/config/types.ts` - 配置类型定义

**使用示例**:
```typescript
import { config } from '@/config';

// 读取配置
const theme = await config.getConfig('theme.mode');

// 更新配置
await config.setConfigValue('theme.accentColor', 'blue');
```

**详细配置系统**: 见 [`docs/architecture.md`](docs/architecture.md) §3

---

## 7. 后端 API

### 7.1 统一 API 层

**核心文件**: `src/helper/rustInvoke.ts`

**使用示例**:
```typescript
import { getConfig, updateConfig } from '@/helper/rustInvoke';

// 获取配置
const theme = await getConfig('theme.mode');

// 更新配置
await updateConfig('theme.accentColor', 'blue');
```

### 7.2 主要 API 命令

| 分类 | 命令 | TypeScript 封装 | 说明 |
|------|------|----------------|------|
| **配置** | `get_config` | `getConfig(key)` | 获取配置 |
| | `set_config_value` | `setConfigValue(path, value)` | 设置配置值 |
| | `get_config_value` | `getConfigValue(path)` | 获取配置值 |
| | `reset_config` | `resetConfig()` | 重置配置 |
| | `export_config` / `import_config` | `exportConfig()` / `importConfig()` | 导入导出配置 |
| **路径配置** | `get_path_config` | `getPathConfig()` | 获取路径配置 |
| | `update_path_config` | `updatePathConfig(config)` | 更新路径配置 |
| **实例** | `scan_instances` | `scanInstances()` | 扫描实例 |
| | `create_instance` | `createInstance(config)` | 创建实例 |
| | `delete_instance` | `deleteInstance(id)` | 删除实例 |
| | `copy_instance` | `copyInstance(id)` | 复制实例 |
| | `rename_instance` | `renameInstance(id, name)` | 重命名实例 |
| | `update_instance` | `updateInstance(id, data)` | 更新实例 |
| **实例设置** | `get_instance_settings` | `getInstanceSettings(id)` | 获取实例设置 |
| | `update_instance_settings` | `updateInstanceSettings(id, s)` | 更新实例设置 |
| | `get_system_memory` | `getSystemMemory()` | 获取系统内存 |
| | `select_java_path` | `selectJavaPath()` | 选择 Java 路径 |
| **下载** | `get_version_manifest` | `getVersionManifest()` | 获取版本清单 |
| | `download_and_deploy` | `downloadAndDeploy(config)` | 下载并部署 |
| | `cancel_download` | `cancelDownload(taskId)` | 取消下载 |
| | `deploy_version_to_instance` | `deployVersionToInstance(opts)` | 部署到实例 |
| | `is_version_deployed` | `isVersionDeployed(id)` | 检查版本是否已部署 |
| **模组加载器** | `get_fabric_versions` | `getFabricVersions()` | 获取 Fabric 版本 |
| | `get_forge_versions` | `getForgeVersions()` | 获取 Forge 版本 |
| | `install_with_loaders` | `installWithLoaders(config)` | 安装含加载器 |
| **账户** | `add_account` | `invokeAddAccount()` | 添加账户 |
| | `get_account_list` | `getAccountList()` | 获取账户列表 |
| | `get_current_account` | `getCurrentAccount()` | 获取当前账户 |
| | `delete_account` | `deleteAccount(uuid)` | 删除账户 |
| | `set_current_account` | `setCurrentAccount(uuid)` | 设置当前账户 |
| **启动** | `tauri_launch_instance` | `launchInstance(config)` | 启动实例 |
| | `tauri_stop_instance` | `stopInstance()` | 停止实例 |
| | `tauri_get_launch_status` | `getLaunchStatus()` | 获取启动状态 |
| **窗口** | `save_window_position` | `saveWindowPosition(pos)` | 保存窗口位置 |
| | `load_window_position` | `loadWindowPosition()` | 加载窗口位置 |
| **系统** | `open_folder` | `openFolder(path)` | 打开文件夹 |
| | `open_url` | `openUrl(url)` | 打开外部链接 |
| | `get_system_info` | — | 获取系统信息 |

**详细 API 文档**: 见 [`docs/api.md`](docs/api.md)

---

## 8. 通用组件

**核心组件**:
- `ProgressBar` - 线性进度条
- `CircularProgress` - 圆形进度指示器
- `DownloadItem` - 下载项组件
- `StatusBadge` - 版本类型徽章
- `Toggle` - 开关组件
- `EmptyState` - 空状态组件
- `Spinner` - 加载覆盖层
- `ListItem` - 列表项组件
- `ContextMenu` - 上下文菜单
- `ConfirmPopup` - 确认弹窗
- `VirtualList` - 虚拟列表
- `IconButton` - 图标按钮
- `NotificationProvider` - 通知提供者
- `StartGameButton` - 启动游戏按钮
- `VersionCard` / `VersionFilterDropdown` - 版本相关组件
- `InstanceCard` / `InstallCard` - 实例相关组件
- `TerminalThemePreview` - 主题预览组件
- `Overlay` - 遮罩组件
- `LoaderIcon` - 加载图标

**使用示例**:
```typescript
import { ProgressBar, useNotification } from '@/components/common';

// 进度条
<ProgressBar progress={75} status="active" showPercentage />

// 通知
const { success } = useNotification();
success('操作成功', '文件已保存');
```

**详细组件文档**: 见 [`docs/components.md`](docs/components.md)

---

## 9. UI 架构

### 9.1 灵动岛导航系统

**核心组件**: `src/components/navigation/DynamicIsland.tsx`

**特性**:
- 悬浮式胶囊导航，顶部居中
- 毛玻璃背景 (`backdrop-blur-2xl`)
- 响应式布局
- 支持窗口拖曳
- 角色切换动画（图标 180° 旋转）

**布局结构**:
```
┌─────────────────────────────────────────────┐
│  [最小化] [最大化] [关闭]   ← FloatingControls
│
│        ┌──────────────────┐
│        │  🏝️ 灵动岛导航    │
│        └──────────────────┘
│
│  ──────────┬──────────────────┐
│  │ 侧边栏   │   主内容区域      │  ← 可选（特定页面）
│  └─────────┴──────────────────┘
└─────────────────────────────────────────────┘
```

### 9.2 双角色系统

**角色类型**: `player` | `admin` | `creator` (未来扩展)

**切换逻辑**:
- ≤2 角色：直接点击切换
- >2 角色：下拉菜单选择
- 自动导航：从 admin 页面切回时跳转到主页

**详细 UI 架构**: 见 [`docs/architecture.md`](docs/architecture.md) §6

---

## 10. 编码规范

### 10.1 TypeScript

- 使用 TypeScript 严格模式
- 所有函数和组件必须有明确的类型定义
- 使用 interface 定义 props 和状态
- 避免使用 `any`，使用 `unknown` 代替

### 10.2 React

- 使用函数组件 + Hooks
- 组件名使用 PascalCase
- 使用解构 props
- 避免内联函数（使用 useCallback）

### 10.3 样式

- 使用 Tailwind CSS 语义化类名
- 使用 CSS 变量（`var(--color-*)`）
- 禁止硬编码颜色值（`bg-white/XX`）
- 响应式设计使用 Tailwind 断点

### 10.4 命名规范

```typescript
// 组件：PascalCase
const PlayerProfile = () => { ... };

// 函数/变量：camelCase
const handleRoleSwitch = () => { ... };
const currentRole = 'player';

// 类型：PascalCase
interface UserRole { ... };
type ThemeMode = 'dark' | 'light';

// 文件：PascalCase（组件）或 camelCase（工具）
PlayerProfile.tsx
rustInvoke.ts

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
```

---

## 11. 常用命令

```bash
# 前端开发
pnpm dev                  # 启动开发服务器
pnpm build                # 构建生产版本
pnpm preview              # 预览生产构建

# Tauri 开发
pnpm tauri dev            # 启动 Tauri 开发环境
pnpm tauri build          # 构建生产版本

# 代码质量
pnpm lint                 # ESLint 检查
pnpm typecheck            # TypeScript 类型检查
```

---

## 12. 注意事项

- 前端调用 Rust 使用 `@tauri-apps/api/core` 的 `invoke` 函数
- Rust 后端的所有命令通过 `lib.rs` 的 `generate_handler!` 宏注册（共 49 个命令）
- 后端命令按模块组织：`config/`、`download/`、`instance/` + 顶层文件（`account.rs`、`launch.rs`、`window.rs`、`modloader.rs`）
- 窗口使用无边框模式，自定义标题栏需要实现拖动区域
- 文件下载使用 `async-fetcher`，SHA1 校验使用 `sha1` crate
- i18n 初始化在 `src/helper/i18n.ts`，已在 `App.tsx` 中导入
- 主题 CSS 变量在 `main.tsx` 中导入
- `Popup` 组件使用 `isOpen` 属性（不是 `visible`）
- `router/config` 文件扩展名为 `.tsx`（需要 JSX 支持）
- 外部链接使用 Tauri `openUrl` API
- **窗口位置保存**: 最小化时不保存位置，避免保存 -32000 坐标
- **Webview 右键菜单**: 已禁用，在 `App.tsx` 中通过 `e.preventDefault()` 实现
- **配置管理**: 更新配置时必须使用 `ConfigManager.update_value()` 增量更新，**禁止**使用 `update_config()` 完整覆盖

---

## 13. 相关文档

- **架构设计**: [`docs/architecture.md`](docs/architecture.md) - 技术架构、目录结构、配置系统
- **组件文档**: [`docs/components.md`](docs/components.md) - 所有组件的详细说明
- **API 文档**: [`docs/api.md`](docs/api.md) - 后端 API 调用指南
- **更新日志**: [`docs/changelog.md`](docs/changelog.md) - 所有重大重构记录
- **文档维护规范**: [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) - 文档编写与更新指南
- **文档使用指南**: [`docs/GUIDE.md`](docs/GUIDE.md) - 如何查阅文档和询问 AI ⭐

---

**文档分层结构**:
```
Level 1: AGENTS.md (本文件) - 快速参考 (~800 行)
    ↓ 链接到
Level 2: docs/*.md - 详细文档
    ↓ 链接到
Level 3: 代码注释 - JSDoc/Rust doc comments
```

---

## 💡 快速帮助

### 如何询问 AI？

**推荐方式**:
```markdown
**背景**: 我是新开发者，想了解 [具体概念]
**已查阅文档**: [列出已阅读的文档章节]
**具体问题**: 
1. [问题 1]
2. [问题 2]
**期望答案**: [概念解释/代码示例/最佳实践]
```

**示例**:
- "我想了解状态管理架构，特别是用户角色切换时如何通知其他组件？
  已查阅 docs/architecture.md §4，请给出详细说明。"
  
- "我要添加玩家管理页面，需要新增哪些文件？
  参考 docs/architecture.md §2 目录结构和 docs/components.md"

### 让 AI 全权实现功能 ⭐

**适用场景**:
- ✅ 重复性高的功能（CRUD 页面、列表管理）
- ✅ 标准组件开发（基于现有组件库）
- ✅ 文档驱动的功能实现（需求明确）

**提问模板**:
```markdown
**目标**: 实现 [功能名称]

**需求描述**:
- 功能描述：[详细描述]
- 用户角色：[玩家/服主]
- UI 要求：[参考页面/组件]
- 数据流：[状态管理/API 调用]

**实现范围**:
- [ ] 前端页面和组件
- [ ] 状态管理（Store）
- [ ] 路由配置
- [ ] 后端 API（如需要）
- [ ] 文档更新

**参考文档**:
- docs/architecture.md §[章节]
- docs/components.md §[章节]

**期望输出**:
1. 完整的代码实现
2. 需要修改的文件列表
3. 文档更新建议
```

**示例**:
```markdown
**目标**: 实现玩家管理页面（服主后台）

**需求描述**:
- 功能描述：服主可以查看玩家列表、添加/删除玩家、设置权限
- 用户角色：服主（admin）
- UI 要求：参考 /admin/servers 页面，使用列表布局 + 弹窗
- 数据流：调用后端 API 获取数据，本地 Store 管理

**实现范围**:
- [x] 前端页面和组件（PlayerList, PlayerItem, PlayerPopup）
- [x] 状态管理（playerStore）
- [x] 路由配置（/admin/players）
- [x] 后端 API 调用（get_players, add_player, remove_player）
- [x] 文档更新

**参考文档**:
- docs/architecture.md §2 目录结构
- docs/architecture.md §5 路由配置
- docs/components.md ListItem, ConfirmPopup 组件

**期望输出**:
1. 完整的代码实现（遵循 AGENTS.md §10 编码规范）
2. 需要修改/新增的文件列表
3. 文档更新建议（需要更新哪些文档）
```

**AI 实现后**:
- AI 会输出文档更新建议清单
- 你需要：审查代码 → 测试功能 → 更新文档
- 遵循 [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) 中的更新流程

**详细指南**: 见 [`docs/GUIDE.md`](docs/GUIDE.md) - 包含完整提问模板和最佳实践
