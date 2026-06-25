# WeCraft! Launcher — 快速参考

> **最后更新**: 2026-06-25 | **项目版本**: 0.1.0-alpha.2

---

## 0. Agent 操作规范

- 执行 Shell 命令前先征得同意
- 禁止使用 git 操作（除非用户明确要求）
- 修改代码前先展示方案，确认后再执行
- 不添加注释（除非明确要求）

---

## 1. 项目概述

Minecraft 启动器，Tauri 2 + React 19。

**核心特性**: 版本管理 · 多账户 · 模组加载器 · SHA1 校验 · i18n · 主题系统 · 实例管理 · 灵动岛导航 · 双角色系统 · 服主后台

**代码代替文档**: API 层和路由表已支持自动生成，运行 `pnpm docs:gen` 更新：
- 自动生成 API 文档 → `docs/api/auto/`
- 自动生成路由表 → `docs/generated/routes.md`

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | React + React Router DOM | 19.1.0 / 7.3.0 |
| 构建 | Vite | 7.0.4 |
| 样式 | TailwindCSS + PostCSS | 4.1.18 |
| 动画 | Framer Motion | 12.34.3 |
| 状态管理 | Zustand (persist) | 5.0 |
| 国际化 | i18next + react-i18next | 26.0 / 17.0 |
| 后端 | Tauri 2 + Tokio | — |
| HTTP | reqwest (json, stream) | 0.12 |
| 校验 | sha1 + hex | 0.10 / 0.4 |

---

## 3. 目录结构

```
src/
├── api/              # 统一 API 层 → pnpm docs:gen:api
│   ├── client.ts     # IPC 中间件链（日志 + 错误转换）
│   ├── auth.ts       # JWT 令牌管理
│   └── *.ts          # 按功能模块拆分
├── components/
│   └── common/       # 通用组件（见 docs/api/auto）
├── pages/            # 页面组件
│   ├── Home.tsx, Login/, Settings/
│   ├── AccountList/, Instance/, Download/
│   └── admin/        # 服主后台
├── stores/           # Zustand 状态（19 个 store）
├── config/           # 统一配置管理器
├── router/           # 路由系统 → pnpm docs:gen:routes
│   ├── routes.tsx    # 路由定义
│   └── config.tsx    # 路由工具
├── hooks/            # 自定义 Hooks
├── utils/            # 工具函数
├── locales/          # i18n（en-US, zh-CN）
├── AppLayouts/       # 布局组件
└── server/           # 服务端 SDK（OpenAPI 生成）

src-tauri/src/
├── lib.rs            # ~70+ 命令注册
├── account.rs, launch.rs, window.rs, modloader.rs
├── admin_account.rs, background.rs, logging.rs
├── font.rs, java.rs, render.rs
├── config/           # 配置模块
├── download/         # 下载模块
└── instance/         # 实例模块
```

---

## 4. 路由

自动生成 → [`docs/generated/routes.md`](docs/generated/routes.md)（共 22 条路由）

| 分组 | 路径 |
|------|------|
| 主页 | `/` |
| 账户 | `/account` /microsoft /offline /thirdparty |
| 实例管理 | `/instance-manage/:id` /game-settings /auto-install /mods /resource-packs /worlds |
| 实例列表 | `/instance-list` /instance-list/game-folder:default |
| 下载 | `/download` /game /modpack /game/:versionId |
| 设置 | `/settings` /java /appearance |
| 服主后台 | `/admin/servers` /analytics /upload |
| 其它 | `/hint` |

---

## 5. 状态管理

**核心 Stores**（共 19 个，详见 `src/stores/`）：

| Store | 文件 | 用途 |
|-------|------|------|
| `userRoleStore` | `src/stores/userRoleStore.ts` | 用户角色（player/admin/creator） |
| `uiModeStore` | `src/stores/uiModeStore.ts` | UI 模式（灵动岛/经典） |
| `themeStore` | `src/stores/themeStore.ts` | 主题（预设/强调色） |
| `navStore` | `src/stores/navStore.ts` | 导航状态（路径、历史） |
| `layoutStore` | `src/stores/layoutStore.ts` | 布局（侧边栏宽度/折叠） |
| `appStore` | `src/stores/appStore.ts` | 全局状态（系统信息） |
| `configStore` | `src/stores/configStore.ts` | 配置状态 |
| `instanceStore` | `src/stores/instanceStore.ts` | 实例 CRUD |
| `downloadStore` | `src/stores/downloadStore.ts` | 下载管理 |
| `accountStore` | `src/stores/accountStore.ts` | 账户管理 |
| `adminStore` | `src/stores/adminStore.ts` | 管理员会话 |
| `refRegistryStore` | `src/stores/refRegistryStore.ts` | DOM 元素注册表 |
| `avatarStore` | `src/stores/avatarStore.ts` | 头像渲染模式 |
| `backgroundStore` | `src/stores/backgroundStore.ts` | 背景配置 |
| `fontStore` | `src/stores/fontStore.ts` | 字体管理 |
| `javaStore` | `src/stores/javaStore.ts` | Java 安装 |
| `lastVisitedStore` | `src/stores/lastVisitedStore.ts` | 子路由记忆 |
| `loadingStore` | `src/stores/loadingStore.ts` | 全局加载 |
| `loginStore` | `src/stores/loginStore.ts` | 登录状态 |

---

## 6. 配置系统

三层存储: localStorage(L1) → 配置文件(L2) → 加密存储(L3)

**统一入口**: `src/config/index.ts`

```typescript
import { config } from '@/config';
await config.getConfig('theme.mode');
await config.setConfigValue('theme.accentColor', 'blue');
```

---

## 7. API

自动生成 → [`docs/api/auto/`](docs/api/auto/)

调用链: 前端代码 → `src/api/*.ts` → `src/api/client.ts` (IPC) → Rust 命令

**封装函数**（`src/helper/rustInvoke.ts` 转发自 `src/api/`）:
```typescript
import { getConfig, updateConfig, launchInstance } from '@/helper/rustInvoke';
```

### 主要命令分类

| 分类 | 命令示例 | TypeScript 封装 |
|------|----------|----------------|
| **配置** | `get_config`, `set_config_value`, `reset_config`, `export_config` | `getConfig()`, `setConfigValue()` 等 |
| **路径** | `get_path_config`, `update_path_config`, `get_instance_path` 等 | `getPathConfig()`, `getInstancePath()` 等 |
| **实例** | `scan_instances`, `create_instance`, `delete_instance` 等 | `scanInstances()`, `createInstance()` 等 |
| **实例设置** | `get_instance_settings`, `update_instance_settings`, `get_system_memory` | `getInstanceSettings()` 等 |
| **下载** | `get_version_manifest`, `download_and_deploy`, `cancel_download` 等 | `getVersionManifest()`, `downloadAndDeploy()` 等 |
| **模组加载器** | `get_fabric_versions`, `get_forge_versions`, `install_with_loaders` 等 | `getFabricVersions()`, `installWithLoaders()` 等 |
| **账户** | `add_account`, `get_account_list`, `delete_account` 等 | `invokeAddAccount()`, `getAccountList()` 等 |
| **管理员** | `register_admin`, `login_admin`, `bind_player_to_admin` 等 | `apiRegisterAdmin()`, `apiLoginAdmin()` 等 |
| **启动** | `tauri_launch_instance`, `tauri_stop_instance`, `tauri_get_launch_status` | `launchInstance()`, `stopInstance()` 等 |
| **窗口** | `save_window_position`, `load_window_position`, `close_window` | `saveWindowPosition()` 等 |
| **系统** | `open_folder`, `open_url`, `get_system_info`, `log_frontend` | `openFolder()`, `openUrl()` 等 |
| **Java** | `scan_java_installations`, `select_java_path` | `scanJavaInstallations()` 等 |
| **字体** | `get_system_fonts`, `get_font` | `getSystemFonts()` 等 |
| **皮肤渲染** | `render_avatar`, `get_skin_head`, `get_skin_cape`, `get_uuid_by_username` | `invokeRenderAvatar()` 等 |
| **背景** | `select_background_image` | 直接 `invoke` |

**注意事项**:
- 更新配置必须用 `setConfigValue()` 增量更新，禁止用 `update_config()` 完整覆盖
- 外部链接使用 Tauri `openUrl` API
- Rust 后端命令通过 `lib.rs` 的 `generate_handler!` 注册（~70+ 命令）

---

## 8. 通用组件

自动生成组件 API → [`docs/api/auto/`](docs/api/auto/)

**位置**: `src/components/common/`

| 分类 | 组件 | 说明 |
|------|------|------|
| **加载** | `ProgressBar`, `CircularProgress`, `Spinner`, `Skeleton`, `Overlay`, `LoaderIcon`, `GlobalLoadingBar`, `LoadingSurface` | 进度条/加载动画 |
| **弹窗** | `ConfirmPopup`, `AlertPopup`, `InputDialog`, `LoadingPopup`, `ProgressDialog` | 各种弹窗 |
| **徽章** | `VersionBadge`, `YesOrNoBadge` | 状态标签 |
| **版本** | `VersionCard`, `VersionFilterDropdown`, `VersionListItem` | 版本选择 |
| **实例** | `InstanceCard`, `InstanceListItem`, `InstallCard` | 实例管理 |
| **设置** | `SettingItem`, `SettingsSection`, `MemorySlider`, `SettingPanel`, `ListItem` | 设置页面 |
| **导航** | `DynamicIsland`, `SmartSidebar`, `BottomBar`, `FloatingControls`, `DynamicItem` | 导航组件 |
| **侧边栏** | `BaseSidebarContent`, `BaseSidebarLayout`, `AccountSidebarContent`, `CommonSidebarContent`, `GameSidebarContent` | 侧边栏系统 |
| **通用** | `Toggle`, `EmptyState`, `IconButton`, `VirtualList`, `ContextMenu`, `DownloadItem`, `DropDown` | 通用 UI |
| **Portal** | `Portal` (5 种模式), `Animated`, `Reveal`, `Slider` | 浮动定位/动画 |
| **用户** | `PlayerProfile`, `SkinAvatar`, `RoleSelectCard`, `StartGameButton`, `NotificationProvider` | 用户相关 |
| **布局** | `Page`, `PageSection`, `BackgroundLayer` | 页面骨架 |

---

## 9. UI 架构

### 灵动岛导航
悬浮式胶囊导航（顶部居中），毛玻璃背景，支持窗口拖曳 + 角色切换 180° 旋转动画。

### 双角色系统
- 类型: `player` | `admin` | `creator`
- 切换: ≤2 角色直接点击，>2 角色下拉菜单
- 从 admin 页面切回时自动跳转到主页

### 布局模式
- `ClassicLayout` — 侧边栏 + 主内容
- `IslandLayout` — 灵动岛 + 主内容（默认）
- `FULLSCREEN` — `/download/game/:versionId` 全屏模式

---

## 10. 编码规范

- **TypeScript**: 严格模式，避免 `any`，用 `unknown`
- **React**: 函数组件 + Hooks，PascalCase 命名
- **样式**: Tailwind CSS 变量，禁止硬编码 `bg-white/XX`
- **文件命名**: 组件 PascalCase，工具 camelCase，常量 UPPER_SNAKE_CASE
- **z-index**: 使用 `Z_INDEX` 常量（`src/utils/zIndex.ts`）

---

## 11. 注意事项

- 前端调用 Rust 使用 `@tauri-apps/api/core` 的 `invoke`（经 `src/api/client.ts` 中间件）
- 窗口无边框，自定义标题栏需要 `data-tauri-drag-region`
- 最小化时不保存窗口位置（避免 -32000 坐标）
- Webview 右键菜单已禁用（`App.tsx` 中 `e.preventDefault()`）
- Portal 组件: `draggable` 模式尚未集成 `avoidRefs`/`collisionBoundary`；`simple` 模式忽略 `zIndex` prop
- Portal 锚定: 使用 `useRegisterRef(key)` 注册 DOM 元素，`avoidRefs` 支持 string key 自动查找
- i18n 初始化在 `src/helper/i18n.ts`，主题 CSS 在 `main.tsx` 中导入

---

## 12. 命令

```bash
pnpm dev              # 开发服务器
pnpm build            # 构建
pnpm tauri dev        # Tauri 开发
pnpm tauri build      # 构建生产
pnpm docs:gen         # 生成全部自动文档（新 clone 后必须跑一次）
pnpm docs:gen:api     # TypeDoc: src/api + components + stores + ... → docs/api/auto/
pnpm docs:gen:rust    # cargo doc: src-tauri/ → docs/rust/
pnpm docs:gen:routes  # 脚本: src/router/routes.tsx → docs/generated/routes.md
```

---

## 13. 文档维护

> ⚠️ 自动生成的文档已加入 `.gitignore`，新 clone 项目后必须先运行 `pnpm docs:gen`

### 体系总览

```
docs/
├── api/auto/              ← 自动生成 (pnpm docs:gen:api)
│   ├── api/               #   src/api/ (106 functions, 45 interfaces, 6 enums)
│   ├── components/common/ #   src/components/common/ (47 functions, 48 interfaces)
│   ├── stores/            #   src/stores/ (3 enums, 10 interfaces, 7 types)
│   ├── hooks/             #   src/hooks/ (11 functions, 2 interfaces)
│   ├── utils/             #   src/utils/ (6 functions)
│   ├── AppLayouts/        #   src/AppLayouts/ (5 functions, 5 interfaces)
│   ├── pages/             #   src/pages/ (10 functions)
│   ├── config/            #   src/config/ (7 types)
│   └── helper/            #   src/helper/ (re-exports from api/)
├── rust/                  ← 自动生成 (pnpm docs:gen:rust, cargo doc)
├── generated/routes.md    ← 自动生成 (pnpm docs:gen:routes, 22 条路由)
├── AGENTS.md              ← 人工维护 (本文件)
├── architecture.md        ← 人工维护
├── GUIDE.md               ← 人工维护
└── changelog.md           ← 人工维护
```

### 更新触发

| 修改范围 | 运行命令 |
|----------|----------|
| `src/api/*.ts` | `pnpm docs:gen:api` |
| `src/components/common/*` | `pnpm docs:gen:api` |
| `src/stores/*.ts` | `pnpm docs:gen:api` |
| `src/hooks/*.ts` | `pnpm docs:gen:api` |
| `src/utils/*.ts` | `pnpm docs:gen:api` |
| `src/AppLayouts/*.tsx` | `pnpm docs:gen:api` |
| `src/pages/*` | `pnpm docs:gen:api` |
| `src/config/*.ts` | `pnpm docs:gen:api` |
| `src/helper/*.ts` | `pnpm docs:gen:api` |
| `src-tauri/src/**/*.rs` | `pnpm docs:gen:rust` |
| `src/router/routes.tsx` | `pnpm docs:gen:routes` |
| 全部 | `pnpm docs:gen` |
