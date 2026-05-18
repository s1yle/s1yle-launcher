# S1yle Launcher - 架构设计文档

> **版本**: 0.2.0  
> **最后更新**: 2026-05-18

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 组件文档：[`components.md`](components.md) - 所有组件的详细说明
- API 文档：[`api.md`](api.md) - 后端 API 调用指南
- 更新日志：[`changelog.md`](changelog.md) - 所有重大重构记录

---

## 1. 技术架构

### 1.1 技术栈

**前端**:
- **框架**: React 19.1.0 + React Router DOM 7.3.0
- **构建工具**: Vite 7.0.4
- **样式**: TailwindCSS 4.1.18 + PostCSS
- **动画**: Framer Motion 12.34.3
- **状态管理**: Zustand 5.0 (带 persist 中间件)
- **国际化**: i18next 26.0 + react-i18next 17.0
- **图标**: lucide-react 1.7
- **语言**: TypeScript 5.8.3

**后端**:
- **框架**: Tauri 2
- **异步运行时**: Tokio 1 (full features)
- **HTTP 客户端**: reqwest 0.12 (json, stream)
- **序列化**: serde 1 + serde_json 1
- **日志**: tracing 0.1.44 + tracing-subscriber 0.3.22
- **校验**: sha1 0.10, hex 0.4

### 1.2 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React + TypeScript)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   组件层    │  │   状态层    │  │   路由层    │     │
│  │  (Pages/    │  │  (Zustand   │  │  (React     │     │
│  │ Components) │  │   Stores)   │  │   Router)   │     │
│  └─────────────  └─────────────┘  └─────────────┘     │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │         统一 API 层 (rustInvoke.ts)              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↓ invoke()
┌─────────────────────────────────────────────────────────┐
│              后端 (Rust + Tauri 2)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  命令处理   │  │  配置管理   │  │  文件操作   │     │
│  │  (Commands) │  │  (Config)   │  │  (FileSystem)│   │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │              系统 API                           │   │
│  │  - HTTP 请求 (reqwest)                          │   │
│  │  - 文件读写 (std::fs)                           │   │
│  │  - 进程管理 (std::process)                      │   │
│  └─────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 目录结构

### 2.1 项目根目录

```
s1yle-launcher/
├── src/                      # 前端源码
├── src-tauri/                # Rust 后端源码
├── docs/                     # 文档
├── public/                   # 静态资源
├── package.json              # 前端依赖
├── Cargo.toml                # Rust 依赖
└── AGENTS.md                 # 快速参考文档
```

### 2.2 前端源码结构

```
src/
├── components/               # React 组件
│   ├── common/              # 通用组件
│   ├── navigation/          # 导航组件（灵动岛）
│   ├── home/                # 主页组件
│   ├── header/              # 头部组件
│   ├── sidebar/             # 侧边栏组件
│   ├── popup/               # 弹窗组件
│   └── ...
├── pages/                    # 页面组件
│   ├── Home.tsx
│   ├── Settings.tsx
│   ├── admin/               # 服主后台页面
│   └── ...
├── stores/                   # Zustand 状态管理
│   ├── userRoleStore.ts     # 角色状态
│   ├── uiModeStore.ts       # UI 模式
│   ├── configStore.ts       # 配置状态
│   ── ...
├── config/                   # 配置管理
│   ├── index.ts             # 统一配置入口
│   ├── types.ts             # 配置类型
│   └── navigationConfig.ts  # 导航配置
├── router/                   # 路由系统
│   ├── config.tsx           # 路由配置
│   ── actionHandler.ts     # 路由动作处理
├── helper/                   # 辅助工具
│   ├── rustInvoke.ts        # Rust API 调用
│   ├── logger.ts            # 日志工具
│   ── i18n.ts              # 国际化
├── hooks/                    # 自定义 Hooks
├── utils/                    # 工具函数
├── styles/                   # 样式文件
│   └── themes/              # 主题 CSS
├── types/                    # TypeScript 类型
├── main.tsx                  # 入口文件
└── App.tsx                   # 主应用组件
```

### 2.3 后端源码结构

```
src-tauri/
├── src/
│   ├── main.rs              # 程序入口
│   ├── lib.rs               # 命令注册
│   ├── commands/            # Tauri 命令
│   │   ├── config.rs        # 配置管理
│   │   ├── instance.rs      # 实例管理
│   │   ├── download.rs      # 下载管理
│   │   └── ...
│   ├── core/                # 核心逻辑
│   │   ├── config_manager.rs  # 配置管理器
│   │   └── ...
│   ├── models/              # 数据模型
│   └── utils/               # 工具函数
├── Cargo.toml               # Rust 依赖
└── tauri.conf.json          # Tauri 配置
```

---

## 3. 配置系统

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│ L1: localStorage (UI 配置 - 立即同步)                    │
│ - 侧边栏宽度、折叠状态                                  │
│ - 主题模式、强调色（通过 zustand persist）              │
│ - 实例视图模式、下载面板状态                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ L2: 配置文件 (业务配置 - 防抖异步保存)                  │
│ - 位置：{base_dir}/.smcl/app_config.json                │
│ - 用户偏好：theme, language, enable_animation           │
│ - 下载配置：download_path, concurrent_limit             │
│ - 实例配置：instance_configs.<id>.*                     │
│ - 窗口位置：window_position                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ L3: 加密存储 (敏感数据 - 立即异步保存)                  │
│ - 账户 tokens（access_token, refresh_token）            │
│ - 其他敏感凭证                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 统一配置入口

**核心文件**:
- `src/config/index.ts` - 统一配置管理器（单例）
- `src/config/types.ts` - 配置类型定义
- `src/stores/configStore.ts` - Zustand store

**使用示例**:
```typescript
import { config } from '@/config';

// 读取配置
const theme = await config.get('theme.mode');
const sidebarWidth = await config.get('ui.sidebarWidth');

// 更新配置
await config.set('theme.accentColor', 'blue');
await config.set('ui.sidebarWidth', 280);

// 订阅配置变化
config.subscribe('theme.mode', (newValue) => {
  console.log('主题模式变更:', newValue);
});
```

---

## 4. 状态管理

### 4.1 Zustand Stores

**核心 Stores**:

| Store | 文件 | 用途 |
|-------|------|------|
| `userRoleStore` | `src/stores/userRoleStore.ts` | 用户角色（玩家/服主） |
| `uiModeStore` | `src/stores/uiModeStore.ts` | UI 模式（灵动岛/经典） |
| `configStore` | `src/stores/configStore.ts` | 配置状态 |
| `themeStore` | `src/stores/themeStore.ts` | 主题管理 |
| `navStore` | `src/stores/navStore.ts` | 导航状态 |
| `appStore` | `src/stores/appStore.ts` | 应用全局状态 |
| `instanceStore` | `src/stores/instanceStore.ts` | 实例管理 |
| `downloadStore` | `src/stores/downloadStore.ts` | 下载管理 |
| `accountStore` | `src/stores/accountStore.ts` | 账户管理 |

### 4.2 状态流转

```
用户操作
    ↓
Action (Store 方法)
    ↓
State 更新
    ↓
组件重新渲染
    ↓
UI 更新
```

**示例**:
```typescript
// Store 定义
export const useUserRoleStore = create<UserRoleState>()(
  persist(
    (set) => ({
      currentRole: 'player',
      switchRole: (role) => set({ currentRole: role }),
    }),
    { name: 'user-role-storage' }
  )
);

// 组件使用
const { currentRole, switchRole } = useUserRoleStore();
<button onClick={() => switchRole('admin')}>切换角色</button>
```

---

## 5. 路由系统

### 5.1 路由配置

**核心文件**: `src/router/config.tsx`

**路由类型**:
- `route` - 跳转页面
- `action` - 执行功能（支持右键菜单）
- `external` - 打开外部链接
- `divider` - 视觉分隔线
- `header` - 分组标题

### 5.2 主要路由

```
/                              # 主页（玩家/服主个人中心）
/account                       # 账户列表
/account/microsoft             # 微软账号
/account/offline               # 离线账号
/instance-manage/:instanceId   # 实例管理（需要参数）
/instance-manage/:instanceId/game-settings    # 游戏设置
/instance-manage/:instanceId/auto-install     # 自动安装
/instance-manage/:instanceId/mods             # 模组
/instance-list                 # 游戏列表
/download                      # 下载
/download/game                 # 游戏下载
/download/modpack              # 整合包下载
/settings                      # 设置
/hint                          # 启动器说明
/admin/servers                 # 服主后台 - 服务器管理
/admin/analytics               # 服主后台 - 数据看板
/admin/upload                  # 服主后台 - 配置上传
```

### 5.3 权限守卫

```typescript
// AdminRouteGuard.tsx
const AdminRouteGuard = ({ children }) => {
  const { currentRole } = useUserRoleStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentRole !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [currentRole, navigate]);

  if (currentRole !== 'admin') {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};
```

---

## 6. UI 架构

### 6.1 灵动岛导航系统

**核心组件**: `src/components/navigation/DynamicIsland.tsx`

**特性**:
- 悬浮式胶囊导航，顶部居中
- 毛玻璃背景 (`backdrop-blur-2xl`)
- 响应式布局
- 支持窗口拖曳
- 角色切换动画

**布局结构**:
```
┌─────────────────────────────────────────────┐
│  [最小化] [最大化] [关闭]   ← FloatingControls
│
│        ┌──────────────────┐
│        │  🏝️ 灵动岛导航    │  ← DynamicIsland
│        ──────────────────┘
│
│  ──────────┬──────────────────┐
│  │ 侧边栏   │   主内容区域      │  ← 可选（特定页面）
│  │ (可选)   │                   │
│  ──────────┴──────────────────┘
│
│  ┌──────────────────────────────┐
│  │     主内容区域（普通页面）    │
│  └──────────────────────────────┘
└─────────────────────────────────────────────┘
```

### 6.2 双角色系统

**角色类型**:
```typescript
type UserRole = 'player' | 'admin' | 'creator';
```

**角色切换流程**:
```
用户点击切换
    ↓
DynamicIsland.handleRoleSwitch()
    ↓
检查是否需要导航 (location.pathname.startsWith('/admin'))
    ↓
useUserRoleStore.switchRole(role)
    ↓
如果需要导航：navigate('/')
    ↓
更新 UI
```

---

## 7. 后端 API

### 7.1 命令注册

**核心文件**: `src-tauri/src/lib.rs`

**注册方式**:
```rust
#[tauri::command]
fn get_config(key: &str) -> Result<Value, String> {
    // 实现逻辑
}

tauri::generate_handler![
    get_config,
    update_config,
    // ... 其他命令
];
```

### 7.2 前端调用

**核心文件**: `src/helper/rustInvoke.ts`

**使用示例**:
```typescript
import { invoke } from '@tauri-apps/api/core';

// 获取配置
const config = await invoke('get_config', { key: 'theme.mode' });

// 更新配置
await invoke('update_config', {
  key: 'theme.accentColor',
  value: 'blue'
});
```

---

## 8. 性能优化

### 8.1 前端优化

- **GPU 加速**: `will-change: transform, opacity`
- **代码分割**: React.lazy() + Suspense
- **防抖节流**: 配置更新、窗口调整
- **虚拟列表**: 长列表渲染（VirtualList 组件）
- **Memoization**: useMemo, useCallback

### 8.2 后端优化

- **异步 IO**: Tokio 异步运行时
- **流式下载**: async-fetcher
- **缓存机制**: 配置缓存、资源缓存
- **延迟加载**: 按需加载模块

---

## 9. 安全机制

### 9.1 数据加密

- **L3 配置**: 账户 tokens 加密存储
- **加密算法**: AES-256-GCM
- **密钥管理**: 系统密钥链

### 9.2 权限控制

- **角色权限**: 玩家/服主数据隔离
- **API 校验**: 后端命令权限检查
- **文件访问**: 限制访问范围

---

## 10. 开发指南

### 10.1 新增页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/router/config.tsx` 添加路由配置
3. 根据需要添加权限守卫
4. 更新导航配置

### 10.2 新增 API

1. 在 `src-tauri/src/commands/` 创建命令
2. 在 `src-tauri/src/lib.rs` 注册命令
3. 在 `src/helper/rustInvoke.ts` 添加 TypeScript 封装
4. 添加类型定义

### 10.3 新增配置项

1. 在 `src/config/types.ts` 添加类型
2. 在 `src/config/index.ts` 添加访问方法
3. 在 Rust 后端添加对应的配置处理

---

**详细文档**:
- 更新日志：[`docs/changelog.md`](changelog.md)
- API 文档：[`docs/api.md`](api.md) (待创建)
- 组件文档：[`docs/components.md`](components.md) (待创建)
