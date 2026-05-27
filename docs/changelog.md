# WeCraft! Launcher - 更新日志

> **项目版本**: 0.1.0-alpha.1  
> **更新日志**: 记录所有重大重构和功能更新

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 架构设计：[`architecture.md`](architecture.md) - 技术架构、目录结构
- 组件文档：[`components.md`](components.md) - 所有组件的详细说明
- API 文档：[`api.md`](api.md) - 后端 API 调用指南

---

## 2026-05-27 - 文档维护更新

### 文档与代码同步

**更新概述**:
对项目文档进行全面审查和维护，修正文档与实际代码之间的差异，确保文档准确性。

**核心变更**:

1. **版本号修正**
   - 所有文档版本号从 `0.2.0` 修正为 `0.1.0-alpha.1`（与 `package.json` 和 `tauri.conf.json` 一致）

2. **路由表更新**（AGENTS.md §4 + architecture.md §5）
   - 新增 `/account/thirdparty` 第三方账号路由
   - 新增 6 个实例管理子路由（game-settings、auto-install、mods、resource-packs、worlds）
   - 新增 `/download/game/:versionId` 版本安装路由
   - 新增 `/download/modpack` 整合包下载路由
   - 新增 `/settings/appearance` 外观设置路由
   - 修正 `/game-settings` 为实例管理子路由（非已移除页面）

3. **Store 表格补全**（AGENTS.md §5 + architecture.md §4）
   - 新增 `layoutStore`（布局状态）
   - 新增 `appStore`（应用全局状态）
   - 新增 `configStore`（配置状态）
   - 更新各 Store 用途描述

4. **API 命令表扩充**（AGENTS.md §7 + api.md）
   - 从 5 个命令扩充至 40+ 个命令（按分类组织）
   - 新增分类：路径配置、实例设置、模组加载器、启动管理、窗口管理
   - 修正配置 API 封装名称（`config.get()` → `config.getConfig()`）

5. **组件列表补全**（AGENTS.md §8 + components.md）
   - 新增 `NotificationProvider`、`StartGameButton` 等组件
   - 新增通用组件子目录文档（Badge、BottomBar、ContextStack 等）
   - 新增设置组件和根级组件文档

6. **目录结构更新**（AGENTS.md §3 + architecture.md §2）
   - 前端目录：新增 common 子目录、pages 子目录、hooks/utils/styles/types 目录
   - 后端目录：修正 `commands/` 顶层目录为模块子目录组织方式
   - 新增 `routes.tsx` 路由定义文件

**影响文档**:
- `AGENTS.md` - 更新 §1-§12 多个章节
- `docs/architecture.md` - 更新 §2、§3、§4、§5、§7
- `docs/components.md` - 更新 §1、新增 §7-§8
- `docs/api.md` - 全面重写，从 5 类 API 扩充至 10 类
- `docs/changelog.md` - 新增本次记录

**变更类型**:
- [x] 修正错误（版本号、API 名称、目录结构）
- [x] 新增内容（路由、Store、组件、API）
- [ ] 修改内容（无功能性修改）
- [ ] 删除内容（无）

---

## 2026-05-18 - UI 全面重构

### 灵动岛导航与双角色系统重构

**重构概述**:
对启动器 UI 进行了全面升级，实现了灵动岛导航系统、双角色身份切换、现代化 UI 设计以及服主后台页面。

**核心特性**:

1. **灵动岛导航系统** (Dynamic Island Navigation)
   - 悬浮式胶囊导航，顶部居中显示
   - 毛玻璃背景 + 圆角设计 (`backdrop-blur-2xl`, `rounded-full`)
   - 支持 hover 展开文字（CSS transition）
   - 响应式布局（自动适配窗口大小）
   - 支持窗口拖曳（`data-tauri-drag-region`）
   - 动画优化：
     - 图标 180° 弹簧旋转（400ms, stiffness: 300）
     - 背景渐变平滑过渡（700ms）
     - 菜单项交错进入（每个延迟 80ms）
     - 无黑屏切换（移除 opacity 降低逻辑）

2. **双角色身份系统**
   - 角色类型：`player` | `admin` | `creator` (未来扩展)
   - 智能切换逻辑：
     - ≤2 角色：直接点击切换
     - >2 角色：下拉菜单选择
   - 自动导航：从 admin 页面切回时自动跳转到主页
   - 无页面刷新：使用 React Router `navigate()`
   - 状态持久化：`zustand/middleware/persist`

3. **主页全面改造**
   - MC 方块人头像：
     - SVG 绘制像素风格头像
     - 基于用户名哈希生成不同肤色/衣服
     - 瞳孔动画（3 秒周期）
     - 扫描线效果（CSS 动画）
   - 账户名称显示：从 accountStore 获取真实账户名（默认："Steve"）
   - 游戏实例选择器：集成到主页，智能显示/隐藏
   - 移除内容：启动游戏按钮旁的状态文本

4. **启动游戏按钮 UI 优化**
   - 渐变光效扫过动画（700ms）
   - Hover 上浮效果（`scale: 1.03`, `y: -2`）
   - 点击反馈（`scale: 0.97`）
   - 阴影增强（`shadow-2xl` → `shadow-3xl`）
   - 图标放大动画（`group-hover:scale-110`）

5. **服主后台页面实现**
   - **服务器管理** (`/admin/servers`):
     - 服务器卡片网格展示（响应式）
     - 实时状态指示（在线/离线）
     - 玩家数量进度条（动态填充）
     - 快速操作按钮（启动/停止/设置）
   - **数据看板** (`/admin/analytics`):
     - 4 个统计卡片（总玩家、今日活跃、平均时长、运行时间）
     - SVG 折线图（玩家趋势）
     - 服务器资源监控（CPU/内存）
     - 趋势指示器（↑↓箭头 + 百分比）
   - **配置上传** (`/admin/upload`):
     - 拖拽上传区域
     - 三种状态动画（默认/上传中/完成）
     - 最近上传记录列表

**新增文件**:
```
src/stores/
  ├── userRoleStore.ts          # 用户角色管理
  └── uiModeStore.ts            # UI 模式切换

src/config/
  └── navigationConfig.ts       # 导航配置系统

src/components/navigation/
  ├── DynamicIsland.tsx         # 灵动岛组件
  ── index.ts

src/components/home/
  ├── PlayerProfile.tsx         # 玩家资料卡片
  └── index.ts

src/components/header/
  ├── FloatingControls.tsx      # 悬浮窗口控制按钮
  └── index.ts

src/pages/admin/
  ├── AdminServers.tsx          # 服务器管理页面
  ├── AdminAnalytics.tsx        # 数据看板页面
  ├── AdminUpload.tsx           # 配置上传页面
  └── index.ts
```

**修改文件**:
```
src/App.tsx                     # 双模式布局 + 事件监听
src/pages/Home.tsx              # 个人中心改造
src/pages/Settings.tsx          # UI 模式设置面板
src/components/ActionButton.tsx # 按钮 UI 优化
src/components/RouterRenderer.tsx  # 注册服主页面
src/router/config.tsx           # 添加服主路由
```

**Bug 修复**:
1. **切换身份黑屏问题** - 移除 `isSwitching` 状态和 `opacity-40` 样式
2. **页面刷新问题** - 使用 `useNavigate()` 替代 `window.location.href`
3. **光标样式错误** - 仅按钮设置 `cursor-pointer`，外层容器保持默认

**UI 设计规范**:
- 圆角：卡片 `rounded-2xl` (16px)，按钮 `rounded-full`
- 阴影：普通 `shadow-lg`，悬浮 `shadow-xl shadow-black/20`
- 毛玻璃：`bg-[var(--color-surface)]/90 backdrop-blur-2xl`
- 间距：卡片 `p-6`，网格 `gap-6`
- 动画：快速 150-200ms，标准 300-400ms，缓慢 500-700ms

**性能优化**:
- GPU 加速：`will-change: transform, opacity`
- CSS Transition 替代 Framer Motion（减少 JS 计算）
- 动画延迟错开（避免同时触发）
- 代码分割：服主页面独立模块（可后续懒加载）

---

## 2026-05-10 - 目录结构与配置系统重构

### 版本化目录结构

**重构目标**：
1. 采用版本化目录结构，全局共享库文件和资源
2. 实例配置独立存储，支持持久化游戏设置
3. 移除旧版 daemon 目录依赖

**主要变更**：

| 变更项 | 旧版 | 新版 |
|--------|------|------|
| Minecraft 根目录 | `{base}/minecraft/` | `{base}/.minecraft/` |
| 版本目录 | `{instance}/versions/{name}/` | `.minecraft/versions/{version_id}/` |
| 库文件路径 | 每个实例独立存储 | `.minecraft/libraries/`（全局共享） |
| 资源文件路径 | 每个实例独立存储 | `.minecraft/assets/`（全局共享） |
| 实例配置 | 无（元数据文件） | `.smcl/instance_configs/{version_id}.json` |
| 版本标识字段 | `version` | `version_id` |

**新增 API**：
- `deploy_version_global` - 全局资源部署模式
- `migrate_directory_structure` - 旧版目录迁移工具

**修复问题**：
- 游戏设置页面进入后自动恢复默认值的问题
- 扫描实例时自动保存默认配置覆盖用户设置的问题

### 统一配置系统

**架构**: 三层存储 + 统一入口 + 类型安全

**配置分层**:
- **L1: localStorage** - UI 配置（立即同步）
- **L2: 配置文件** - 业务配置（防抖异步保存）
- **L3: 加密存储** - 敏感数据（立即异步保存）

**核心文件**:
- `src/config/index.ts` - 统一配置管理器
- `src/config/types.ts` - 配置类型定义
- `src/stores/configStore.ts` - Zustand store

---

## 2026-04-29 - 统一 API 层架构

**架构原则**：
1. **统一入口**：所有前端调用后端的 API 都集中在 `rustInvoke.ts` 中
2. **类型安全**：类型定义与 API 函数放在同一文件，便于维护
3. **单一文件**：所有配置相关的 API 和类型都在一个文件中

**一层架构（完全统一）**：
```
前端代码
    ↓
rustInvoke.ts (统一 API 层)
    ↓
Rust 后端命令
```

**详细文档**: 见 `docs/api.md`

---

## 更早的更新

详见 git 历史记录。
