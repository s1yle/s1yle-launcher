# S1yle Launcher - AI Agent 开发指南

## 0. Agent 操作规范

> **重要提醒：在执行任何命令或操作前，请先询问用户的意见。禁止使用任何 git 操作（如 commit、push、pull 等）。**

- 执行任何 Shell 命令前需征得用户同意
- 禁止使用 git 操作，除非用户明确要求
- 修改代码前先展示方案，征得用户确认后再执行
- 对于复杂的重构，需要先输出详细方案

---

## 1. 项目概述

S1yle Launcher 是一个 Minecraft 启动器，采用 Tauri 2 + React 19 技术栈构建。

**核心特性**：
- Minecraft 版本管理（下载、安装、启动）
- 多账户支持（微软账号、离线账号）
- 模组加载器支持（Fabric、Forge、NeoForge）
- 文件完整性校验（SHA1）
- 跨平台支持（Windows、Linux、macOS）

---

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
- **下载**: async-fetcher 0.12
- **序列化**: serde 1 + serde_json 1
- **日志**: tracing 0.1.44 + tracing-subscriber 0.3.22 + tracing-appender 0.2.4
- **校验**: sha1 0.10, hex 0.4
- **工具库**: 
  - once_cell 1.21.3
  - chrono 0.4.44
  - uuid 1.21.0 (v8, v4, v3)
  - directories 6.0.0
  - dirs-next 2.0
  - md5 0.7
  - zip 2 (解压原生库)

---

## 3. 设计原则

### 3.1 组件设计原则

1. **单一职责原则 (SRP)**
   - 每个组件只负责一个功能
   - 组件名应清晰表达其职责

2. **开闭原则 (OCP)**
   - 对扩展开放，对修改关闭
   - 使用 props 扩展功能，避免修改组件内部

3. **依赖倒置原则 (DIP)**
   - 依赖抽象，不依赖具体实现
   - 使用接口（TypeScript interface）定义契约

4. **组合优于继承**
   - 使用组合模式构建复杂 UI
   - 提取可复用的子组件

### 3.2 通用组件设计

**核心通用组件** (位于 `src/components/common/`)：

| 组件 | 说明 | 设计目标 |
|------|------|----------|
| `ProgressBar` | 线性进度条 | 可配置大小、颜色、状态、图标 |
| `CircularProgress` | 圆形进度指示器 | 支持百分比显示 |
| `DownloadItem` | 下载项组件 | 显示文件名、进度、状态 |
| `StatusBadge` | 状态徽章 | 版本类型标签（正式版/快照版等） |
| `EmptyState` | 空状态组件 | 无数据时显示提示 |
| `IconButton` | 图标按钮 | 可配置变体和大小的图标按钮 |
| `NotificationProvider` | 全局通知组件 | Toast 弹出、自动消失、手动关闭 |

**通用工具函数** (位于 `src/utils/format.ts`)：

| 函数 | 说明 |
|------|------|
| `formatFileSize` | 格式化文件大小 (B, KB, MB, GB) |
| `formatDate` | 格式化日期 |
| `getVersionTypeLabel` | 获取版本类型标签 |
| `getVersionTypeColor` | 获取版本类型颜色 |

### 3.3 Hook 设计

**自定义 Hook 规范**：
- 命名以 `use` 开头
- 返回对象包含数据和操作方法
- 使用 `useCallback` 优化回调函数
- 统一日志输出

**推荐模式**：
```typescript
export const useFeature = () => {
  const [data, setData] = useState<Type>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};
```

### 3.4 状态管理策略

1. **局部状态**：使用 `useState`
2. **共享状态**：使用 Context API
3. **全局状态**：如需要可引入 Zustand/Redux
4. **服务端状态**：如需要可引入 TanStack Query

---

## 4. 目录结构

```
s1yle-launcher/
├── src/                              # 前端源代码
│   ├── components/                   # React 组件
│   │   ├── common/                  # 通用组件
│   │   │   ├── index.ts            # 统一导出
│   │   │   ├── ProgressBar.tsx      # 线性进度条
│   │   │   ├── CircularProgress.tsx # 圆形进度
│   │   │   ├── DownloadItem.tsx     # 下载项组件
│   │   │   ├── StatusBadge.tsx     # 状态徽章
│   │   │   ├── EmptyState.tsx      # 空状态组件
│   │   │   ├── IconButton.tsx      # 图标按钮
│   │   │   └── NotificationProvider.tsx # 全局通知
│   │   ├── sidebar/                # 侧边栏组件
│   │   │   ├── content/            # 侧边栏内容
│   │   │   ├── layouts/            # 侧边栏布局
│   │   │   ├── SmartSidebar.tsx
│   │   │   └── PageWithSidebar.tsx
│   │   ├── popup/                  # 弹窗组件
│   │   │   ├── AlertPopup.tsx
│   │   │   ├── ConfirmPopup.tsx
│   │   │   └── LoadingPopup.tsx
│   │   ├── Header.tsx
│   │   ├── ActionButton.tsx
│   │   ├── Popup.tsx
│   │   └── RouterRenderer.tsx
│   ├── pages/                      # 页面组件
│   │   ├── Home.tsx
│   │   ├── DownloadGame.tsx        # 游戏下载页面
│   │   └── ...
│   ├── router/
│   │   └── config.ts               # 路由配置
│   ├── hooks/
│   │   └── useDownload.ts          # 下载相关 Hook
│   ├── utils/
│   │   ├── index.ts             # 工具函数导出
│   │   └── format.ts            # 格式化工具函数
│   ├── helper/
│   │   ├── rustInvoke.ts          # Rust 调用封装
│   │   ├── popupUtils.ts
│   │   └── logger.ts
│   ├── assets/
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                      # Tauri 后端
│   ├── src/
│   │   ├── lib.rs                 # 库入口
│   │   ├── main.rs                # 程序入口
│   │   ├── account.rs            # 账户管理
│   │   ├── config.rs             # 配置管理
│   │   ├── download.rs            # 下载管理
│   │   ├── launch.rs             # 游戏启动
│   │   ├── modloader.rs          # 模组加载器
│   │   ├── window.rs             # 窗口管理
│   │   └── json.rs
│   ├── Cargo.toml
│   └── ...
├── package.json
├── tsconfig.json
└── AGENTS.md                      # 本文件
```

---

## 5. 核心 API 定义

### 5.1 账户管理 (account.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `add_account` | `invokeAddAccount` | `name`, `account_type`, `access_token?`, `refresh_token?` | `string` (UUID) |
| `get_account_list` | `getAccountList` | - | `AccountInfo[]` |
| `get_current_account` | `getCurrentAccount` | - | `AccountInfo \| null` |
| `delete_account` | `deleteAccount` | `uuid` | `string` |
| `set_current_account` | `setCurrentAccount` | `uuid` | `string` |

### 5.2 游戏启动 (launch.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `tauri_launch_instance` | `launchInstance` | `config?: LaunchConfig` | `string` |
| `tauri_stop_instance` | `stopInstance` | - | `string` |
| `tauri_get_launch_status` | `getLaunchStatus` | - | `LaunchStatus` |

### 5.3 下载管理 (download.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `get_version_manifest` | `getVersionManifest` | - | `VersionManifest` |
| `get_version_detail` | `getVersionDetail` | `versionId` | `any` |
| `get_version_download_manifest` | `getVersionDownloadManifest` | `versionId` | `VersionDownloadManifest` |
| `download_file` | `downloadFile` | `url`, `filename`, `sha1?`, `skipVerify?` | `DownloadProgress` |
| `deploy_version_files` | `deployVersionFiles` | `versionId` | `string` |
| `is_version_deployed` | `isVersionDeployed` | `versionId` | `boolean` |
| `get_download_tasks` | `getDownloadTasks` | - | `DownloadTask[]` |
| `cancel_download` | `cancelDownload` | `taskId` | `string` |
| `clear_completed_tasks` | `clearCompletedTasks` | - | `string` |
| `get_game_versions` | `getGameVersions` | - | `string[]` |
| `get_download_base_path` | `getDownloadBasePath` | - | `string` |
| `set_download_base_path` | `setDownloadBasePath` | `path` | `string` |

### 5.4 模组加载器 (modloader.rs)

| Rust 命令 | 前端函数 | 参数 | 返回值 |
|-----------|----------|------|--------|
| `get_fabric_versions` | `getFabricVersions` | `mcVersion` | `ModLoaderVersionList` |
| `get_fabric_version_detail` | `getFabricVersionDetail` | `mcVersion`, `loaderVersion` | `FabricVersionDetail` |
| `build_fabric_launch_config` | `buildFabricLaunchConfig` | `mcVersion`, `loaderVersion`, ... | `ModLoaderInfo` |
| `get_forge_versions` | `getForgeVersions` | `mcVersion` | `ModLoaderVersionList` |
| `build_forge_launch_config` | `buildForgeLaunchConfig` | `mcVersion`, `forgeVersion`, ... | `ModLoaderInfo` |
| `get_installed_mod_loaders` | `getInstalledModLoaders` | `versionId` | `ModLoaderType[]` |

### 5.5 系统命令 (lib.rs)

| Rust 命令 | 参数 | 返回值 |
|-----------|------|--------|
| `greet` | `name: &str` | `string` |
| `get_system_info` | - | `{ os: string, arch: string }` |
| `log_frontend` | `level`, `message` | - |

---

## 6. 类型定义

### 6.1 下载相关

```typescript
interface DownloadTask {
  id: string;
  url: string;
  path: string;
  filename: string;
  total_size: number;
  downloaded_size: number;
  status: string;
}

interface FileDownload {
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}

interface VersionDownloadManifest {
  version_id: string;
  client_jar: FileDownload | null;
  libraries: FileDownload[];
  assets: FileDownload[];
  natives: FileDownload[];
  asset_index: FileDownload | null;
}
```

### 6.2 模组加载器相关

```typescript
enum ModLoaderType {
  Vanilla = "Vanilla",
  Fabric = "Fabric",
  Forge = "Forge",
  NeoForge = "NeoForge",
}

interface ModLoaderInfo {
  version_id: string;
  mod_loader_type: ModLoaderType;
  minecraft_version: string;
  loader_version: string | null;
  main_class: string;
  libraries: LibraryInfo[];
  client_jar_required: boolean;
}

interface LibraryInfo {
  name: string;
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}
```

---

## 7. 通用组件使用

### 7.1 通知组件 (NotificationProvider)

```typescript
import { NotificationProvider, useNotification } from '@/components/common';

// App.tsx 中包裹
<NotificationProvider>
  <App />
</NotificationProvider>

// 组件中使用
const { success, error, warning, info } = useNotification();

success('操作成功', '文件已保存');
error('操作失败', '网络错误');
warning('警告', '磁盘空间不足');
info('提示', '新版本可用');
```

### 7.2 进度条组件 (ProgressBar)

```typescript
import { ProgressBar } from '@/components/common';

<ProgressBar
  progress={75}
  status="active"
  label="下载中"
  size="md"
  showIcon
/>
```

### 7.3 下载项组件 (DownloadItem)

```typescript
import { DownloadItem } from '@/components/common';

<DownloadItem
  filename="libraries/net/fabricmc/loader/0.15.7/loader.jar"
  downloaded={1024000}
  total={4096000}
  status="downloading"
  onCancel={() => {}}
  showCancel
/>
```

---

## 8. 路由配置

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
- `/download` - 游戏下载
- `/settings` - 设置
- `/multiplayer` - 多人联机

---

## 9. 环境配置

### 9.1 数据目录

- **应用数据**: `~/.local/share/art/s1yle/mc_launcher/`
- **游戏目录**: `{data_local_dir}/art/s1yle/minecraft/`
- **日志目录**: `{app_data_dir}/logs/` (保留30天)

### 9.2 Minecraft 目录结构

```
minecraft/
├── versions/
│   └── {version}/
│       ├── {version}.jar
│       └── {version}.json
├── libraries/
│   └── {path}
├── natives/
│   └── {version}/
├── assets/
│   ├── indexes/
│   └── objects/
└── logs/
```

---

## 10. 编码规范

### 10.1 前端 (TypeScript/React)

- 使用 **TypeScript**，开启严格模式
- 组件使用 **函数式组件** + **Hooks**
- 样式使用 **TailwindCSS**
- 动画使用 **Framer Motion**
- 路径别名: `@/*` 指向项目根目录

### 10.2 后端 (Rust)

- 使用 **Rust 2021 Edition**
- 命令使用 `#[tauri::command]` 宏导出
- 全局状态使用 `once_cell::sync::OnceCell` + `Mutex`
- 日志使用 `tracing` crate
- 错误处理返回 `Result<T, String>`

### 10.3 通用规范

- **无注释**: 代码本身应该是自解释的
- **类型安全**: 避免使用 `any`，优先使用具体类型
- **命名规范**: 
  - 前端: 驼峰命名 (camelCase)
  - 后端: 蛇形命名 (snake_case)

---

## 11. 常用命令

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

---

## 12. 已完成的重构

### 12.1 已提取的通用组件

| 组件 | 位置 | 说明 |
|------|------|------|
| `ProgressBar` | common/ | 线性进度条 ✅ |
| `CircularProgress` | common/ | 圆形进度指示器 ✅ |
| `DownloadItem` | common/ | 下载项组件 ✅ |
| `StatusBadge` | common/ | 版本类型徽章 ✅ |
| `EmptyState` | common/ | 空状态提示组件 ✅ |
| `IconButton` | common/ | 图标按钮组件 ✅ |
| `NotificationProvider` | common/ | 全局通知组件 ✅ |

### 12.2 已提取的工具函数

| 函数 | 位置 | 说明 |
|------|------|------|
| `formatFileSize` | utils/ | 格式化文件大小 ✅ |
| `formatDate` | utils/ | 格式化日期 ✅ |
| `getVersionTypeLabel` | utils/ | 版本类型标签 ✅ |
| `getVersionTypeColor` | utils/ | 版本类型颜色 ✅ |

### 12.3 后续优化建议

1. **useDownload Hook 拆分**
   - 可拆分为 `useVersionManifest` 和 `useDownloadTasks`

2. **Context 整合**
   - 考虑将相关状态合并到 Context 中

3. **状态管理库**
   - 复杂状态可考虑引入 Zustand
| `getVersionTypeColor` | utils/ | 版本类型颜色 |

### 12.3 潜在优化

1. **useDownload Hook 拆分**
   - 可拆分为 `useVersionManifest` 和 `useDownloadTasks`

2. **Context 整合**
   - 考虑将相关状态合并到 Context 中

3. **状态管理库**
   - 复杂状态可考虑引入 Zustand

---

## 13. 注意事项

- 前端调用 Rust 使用 `@tauri-apps/api/core` 的 `invoke` 函数
- Rust 后端的所有命令都通过 `lib.rs` 的 `generate_handler!` 宏注册
- 窗口使用无边框模式，自定义标题栏需要实现拖动区域
- 文件下载使用 `async-fetcher`，SHA1 校验使用 `sha1` crate
- 原生库解压使用 `zip` crate
