# WeCraft! Launcher - 架构设计

> **版本**: 0.1.0-alpha.2
> **最后更新**: 2026-06-25

---

## 1. 技术架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React + TypeScript)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   组件层    │  │   状态层    │  │   路由层    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         ↓                ↓                ↓            │
│  ┌─────────────────────────────────────────────────┐   │
│  │             API 层 (src/api/)                    │   │
│  │   client.ts (IPC 中间件链) → Rust 命令          │   │
│  │   auth.ts (JWT) → 服务端 SDK (server/)          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓ invoke()
┌─────────────────────────────────────────────────────────┐
│               后端 (Rust + Tauri 2)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  命令处理   │  │  配置管理   │  │  文件操作   │     │
│  │  (70+ cmd)  │  │  (Config)   │  │ (FS/Network)│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### API 调用链

```
前端组件 → src/api/*.ts (封装函数 + 日志)
         → src/api/client.ts (invokeRust, 中间件链)
         → @tauri-apps/api/core.invoke()
         → src-tauri/src/lib.rs (Tauri 命令)
```

### 目录结构

见 [`AGENTS.md §3`](AGENTS.md#3-目录结构)（前端 + Rust 后端）。

### Rust 后端模块

```
src-tauri/src/
├── lib.rs           # ~70+ 命令注册入口，Tauri Builder 配置
├── account.rs       # 账户管理（微软/离线/第三方）
├── admin_account.rs # 管理员账号（注册/登录/JWT）
├── background.rs    # 背景图片选择
├── font.rs          # 系统字体枚举与获取
├── java.rs          # Java 安装扫描
├── launch.rs        # 游戏启动/停止/状态
├── logging.rs       # 日志初始化
├── modloader.rs     # Fabric/Forge 模组加载器
├── render.rs        # 皮肤渲染（头像/斜二测/披风）
├── window.rs        # 窗口管理（位置/创建/关闭）
├── config/          # 配置模块（manager/models/commands）
├── download/        # 下载模块（downloader/deploy/versions）
└── instance/        # 实例模块（manager/settings/validator）
```

---

## 2. 配置系统

### 三层存储

| 层级 | 存储方式 | 内容 | 同步策略 |
|------|----------|------|----------|
| L1 | localStorage | UI 配置（侧边栏宽度、主题模式等） | 立即同步 |
| L2 | 配置文件 | 业务配置（{base_dir}/.smcl/app_config.json） | 防抖异步保存 |
| L3 | 加密存储 | 敏感数据（账户 tokens） | 立即异步保存 |

### 统一入口

```typescript
import { config } from '@/config';

// 读取
await config.getConfig('theme.mode');

// 写入（增量更新，禁止全量覆盖）
await config.setConfigValue('theme.accentColor', 'blue');

// 订阅变更
config.on('theme.mode', (newValue) => { ... });
```

**关键约定**: 更新配置必须用 `setConfigValue()` 增量更新，禁止 `update_config()` 完整覆盖。

---

## 3. 路由系统

**核心文件**: `src/router/routes.tsx` — 路由定义（22 条路由）

自动生成路由表 → [`docs/generated/routes.md`](generated/routes.md)

**路由类型**（定义在 `src/router/models.ts`）:
- `route` — 页面跳转
- `action` — 功能执行（支持右键菜单）
- `external` — 外部链接
- `divider` / `header` — 视觉分隔

**关键逻辑**:
- `autoNavigateToFirstChild` — 自动跳转到子路由第一条（用于 `/settings`、`/download`）
- `lastVisitedStore` — 记忆子路由最后访问，下次优先跳转
- `RoutePosition` — 控制侧边栏中路由的位置

**权限守卫**: 服主页面通过 `userRoleStore` 判断角色，非 admin 自动重定向到 `/`

---

## 4. 状态管理

19 个 Zustand Store，详见 `src/stores/`。Store 列表见 [`AGENTS.md §5`](AGENTS.md#5-状态管理)。

原则:
- UI 状态（主题、侧边栏宽度）→ localStorage（persist 中间件）
- 业务状态（实例、下载、账户）→ Store + 后端配置同步
- 全局/临时状态（加载、登录）→ 纯内存 Store

---

## 5. UI 架构

### 布局模式

| 模式 | 组件 | 说明 |
|------|------|------|
| `IslandLayout` | `src/AppLayouts/IslandLayout.tsx` | 灵动岛导航 + 主内容（默认） |
| `ClassicLayout` | `src/AppLayouts/ClassicLayout.tsx` | 侧边栏 + 主内容 |
| `FULLSCREEN` | — | `/download/game/:versionId` 全屏 |

### 双角色系统

```typescript
type UserRole = 'player' | 'admin' | 'creator';
```

- 切换: ≤2 角色直接点击，>2 角色下拉菜单
- 从 admin 页面切回时自动 `navigate('/')`
- 角色状态持久化（zustand persist）

### 灵动岛导航

- 悬浮胶囊（顶部居中）
- 毛玻璃 (`backdrop-blur-2xl`)
- 支持窗口拖曳 (`data-tauri-drag-region`)
- 角色切换 180° 旋转弹簧动画

---

## 6. 性能优化

### 前端
- **GPU 加速**: `will-change: transform, opacity`
- **代码分割**: React.lazy() + Suspense
- **防抖节流**: 配置更新、窗口调整
- **虚拟列表**: VirtualList 组件处理长列表
- **Memoization**: useMemo, useCallback

### 后端
- **异步 IO**: Tokio 异步运行时
- **流式下载**: reqwest stream
- **缓存机制**: 配置缓存、资源缓存

---

## 7. 安全机制

- **L3 加密**: 账户 tokens AES-256-GCM 加密存储
- **角色权限**: 玩家/服主数据隔离
- **窗口安全**: 无边框窗口，禁用 Webview 右键菜单
- **外部链接**: 全部通过 Tauri `openUrl` API，禁止直接 `window.open`

---

## 8. 自动生成文档

| 文档 | 命令 | 覆盖范围 |
|------|------|----------|
| API 文档 | `pnpm docs:gen:api` | `api/` + `components/common/` + `stores/` + `hooks/` + `utils/` + `AppLayouts/` + `pages/` + `config/` + `helper/` |
| Rust 文档 | `pnpm docs:gen:rust` | `src-tauri/src/` |
| 路由表 | `pnpm docs:gen:routes` | `src/router/routes.tsx` |
| 全部 | `pnpm docs:gen` | 以上全部 |

详细文件索引见 [`AGENTS.md §13`](AGENTS.md#13-文档维护)。

---

## 9. 设计原则

- **单一职责**: 每个组件一个功能，文件名表达职责
- **组合优于继承**: 使用组合构建复杂 UI
- **类型安全**: 所有函数和组件必须有明确的类型定义
- **依赖倒置**: 依赖抽象（interface），不依赖具体实现
