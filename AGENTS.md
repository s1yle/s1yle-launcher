# S1yle Launcher - AI Agent 开发指南

> **最后更新**: 2026-05-07  
> **项目版本**: 0.1.3  
> **架构状态**: 生产就绪 ✅

## 0. Agent 操作规范

> **重要提醒：在执行任何命令或操作前，请先询问用户的意见。禁止使用任何 git 操作（如 commit、push、pull 等）。**

- 执行任何 Shell 命令前需征得用户同意
- 禁止使用 git 操作，除非用户明确要求
- 修改代码前先展示方案，征得用户确认后再执行
- 对于复杂的重构，需要先输出详细方案
- **代码风格**：遵循现有代码约定，不添加注释（除非明确要求）

***

## 1. 项目概述

S1yle Launcher 是一个现代化的 Minecraft 启动器，采用 Tauri 2 + React 19 技术栈构建。

**核心特性**：

- Minecraft 版本管理（下载、安装、启动）
- 多账户支持（微软账号、离线账号）
- 模组加载器支持（Fabric、Forge、NeoForge）
- 文件完整性校验（SHA1）
- 跨平台支持（Windows、Linux、macOS）
- 国际化支持（中文、英文）
- 主题系统（暗色/亮色预设 + 7 种强调色 + SVG 噪点纹理背景）
- 实例管理（daemon 目录结构，无元数据文件，自动发现）
- 分层配置管理系统（L1 localStorage + L2 配置文件 + L3 加密存储）
- 智能侧边栏导航系统（路由感知、右键菜单、动态内容）

**项目定位**：打造一个有特色的、现代化的、高性能的 Minecraft 启动器

***

## 2. 技术栈

### 前端

- **框架**: React 19.1.0 + React Router DOM 7.3.0
- **构建工具**: Vite 7.0.4
- **样式**: TailwindCSS 4.1.18 + PostCSS
- **动画**: Framer Motion 12.34.3
- **状态管理**: Zustand 5.0 (带 persist 中间件)
- **国际化**: i18next 26.0 + react-i18next 17.0
- **图标**: lucide-react 1.7
- **工具库**: clsx 2.1 + tailwind-merge 3.5
- **语言**: TypeScript ~5.8.3

### 后端 (Rust)

- **框架**: Tauri 2
- **异步运行时**: Tokio 1 (full features)
- **HTTP 客户端**: reqwest 0.12 (json, stream)
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

***

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

| 组件                      | 说明       | 设计目标                                    |
| ----------------------- | -------- | --------------------------------------- |
| `ProgressBar`           | 线性进度条    | 可配置大小、颜色、状态、图标                          |
| `CircularProgress`      | 圆形进度指示器  | 支持百分比显示                                 |
| `DownloadItem`          | 下载项组件    | 显示文件名、进度、状态                             |
| `StatusBadge`           | 状态徽章     | 版本类型标签（正式版/快照版等）                        |
| `EmptyState`            | 空状态组件    | 无数据时显示提示                                |
| `IconButton`            | 图标按钮     | 可配置变体和大小的图标按钮                           |
| `NotificationProvider`  | 全局通知组件   | Toast 弹出、自动消失、手动关闭，AnimatePresence 进出动画 |
| `TabBar`                | Tab 导航组件 | 水平/垂直模式，懒加载内容，滑动指示器，exit 动画             |
| `SpinnerOverlay`        | 覆盖加载组件   | 覆盖任意内容的加载指示器，支持进度条和取消                   |
| `ListItem`              | 列表项组件    | 两行布局（标题 + 副标题），图标槽位，选中态                   |
| `VersionCard`           | 版本卡片     | 游戏版本信息、安装状态、下载/部署操作                     |
| `InstanceCard`          | 实例卡片     | 网格/列表视图，右键菜单，状态徽章                       |
| `ThemePreview`          | 主题预览组件   | 预设模板预览卡片，强调色选择器                         |
| `InstallCard`           | 安装卡片     | 版本安装状态和操作入口                             |
| `InstanceListItem`      | 实例列表行    | 列表视图中的实例行（与 InstanceCard 共用数据）          |
| `LoaderIcon`            | 加载器图标    | Fabric/Forge/NeoForge 小图标组件             |
| `VersionFilterDropdown` | 版本过滤下拉   | 版本类型过滤下拉选择器                             |
| `VersionListItem`       | 版本列表行    | 版本列表中的单行项目                              |
| `VirtualList`           | 虚拟列表     | 高性能长列表虚拟滚动                              |

**弹窗组件** (位于 `src/components/popup/`)：

| 组件               | 说明                                                 |
| ---------------- | -------------------------------------------------- |
| `Popup`          | 通用模态对话框基座，AnimatePresence 进出动画，支持 fade/slide/scale |
| `ConfirmPopup`   | 确认对话框（支持警告/错误/信息/成功/问题图标）                          |
| `AlertPopup`     | 提示对话框（支持自动关闭）                                      |
| `LoadingPopup`   | 加载等待对话框                                            |
| `InputDialog`    | 表单验证输入对话框                                          |
| `ProgressDialog` | 进度对话框（支持自动完成关闭）                                    |

**通用工具函数** (位于 `src/utils/format.ts`)：

| 函数                    | 说明                      |
| --------------------- | ----------------------- |
| `formatFileSize`      | 格式化文件大小 (B, KB, MB, GB) |
| `formatDate`          | 格式化日期                   |
| `getVersionTypeLabel` | 获取版本类型标签                |
| `getVersionTypeColor` | 获取版本类型颜色                |

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
2. **共享状态**：使用 Context API（如 NotificationProvider）
3. **全局状态**：使用 Zustand stores（`src/stores/`）
   - `appStore` - 全局应用状态（系统信息、初始化）
   - `navStore` - 导航状态（当前路径、导航锁）
   - `downloadStore` - 下载状态（版本列表、下载任务、进度）
   - `instanceStore` - 实例状态（实例列表、搜索、视图、已知文件夹、选中文件夹持久化）
   - `themeStore` - 主题状态（暗色/亮色预设、7 种强调色、localStorage 持久化）
   - `configStore` - 配置状态（配置文件读写、延迟保存）
4. **跨组件通信**：使用 `eventBus`（`src/utils/eventBus.ts`）

### 3.5 国际化 (i18n)

- 使用 `i18next` + `react-i18next`
- 翻译文件位于 `src/locales/{zh-CN,en-US}/translation.json`
- 组件中使用 `useTranslation()` hook 获取 `t` 函数
- 所有用户可见文本必须使用 `t('key', 'fallback')` 格式
- 初始化文件：`src/helper/i18n.ts`

### 3.6 图标系统

- 使用 `lucide-react` 图标库
- 所有图标统一从 `src/icons/index.ts` 导出
- 禁止使用内联 SVG 或 emoji 作为 UI 图标
- 图标组件支持 `className`、`size`、`strokeWidth` 等 props

**重要：图标渲染统一规范**：

1. **使用统一的图标渲染工具** (`src/utils/iconRenderer.ts`)：
   - `renderIcon(icon, className, size)` - 图标渲染函数（推荐）
   - `Icon` - React 组件版本
   - `isValidIcon(icon)` - 图标验证函数

2. **正确的使用方式**：
   ```typescript
   import { renderIcon } from '@/utils/iconRenderer';
   import { Settings } from 'lucide-react';
   
   // ✅ 推荐：使用 renderIcon 函数
   {renderIcon(icon, 'text-primary', 'md')}
   
   // ✅ 推荐：直接使用 Lucide 组件
   <Settings className="w-4 h-4 text-primary" />
   
   // ✅ 推荐：使用 Icon 组件
   <Icon icon={Settings} className="text-primary" size="md" />
   ```

3. **错误的使用方式**：
   ```typescript
   // ❌ 错误：直接渲染图标对象
   {icon}  // 会导致 "Objects are not valid as a React child" 错误
   
   // ❌ 错误：使用 React.isValidElement 判断 Lucide 图标
   if (React.isValidElement(icon)) { ... }  // 对函数类型返回 false
   
   // ❌ 错误：图标调用时加括号
   icon={Settings()}  // 会立即执行函数而不是传递组件
   ```

4. **类型定义**：
   ```typescript
   import { type LucideIcon } from 'lucide-react';
   
   interface MyProps {
     icon?: LucideIcon | React.ReactNode;
   }
   ```

5. **核心原理**：
   - Lucide 图标是函数类型组件：`type LucideIcon = (props: LucideProps) => JSX.Element`
   - 判断顺序：**先检查 `typeof icon === 'function'`，再检查 `React.isValidElement`**
   - `renderIcon` 函数自动处理 className 和 size

6. **ContextMenu 中的图标使用**：
   ```typescript
   import { Settings, Trash2 } from 'lucide-react';
   import { ContextMenuItemData } from '@/components/common/ContextMenu';
   
   // ✅ 正确：直接传递图标组件
   const items: ContextMenuItemData[] = [
     { id: 'settings', label: '设置', icon: Settings },
     { id: 'delete', label: '删除', icon: Trash2, danger: true },
   ];
   
   // ContextMenu 组件内部会自动使用 renderIcon 渲染
   ```

**详细文档**：参考 `docs/Lucide 图标使用最佳实践.md`

### 3.7 主题系统

- CSS 变量定义在 `src/styles/themes/dark.css` 和 `src/styles/themes/light.css`
- 强调色定义在 `src/styles/themes/accents.css`（7 种：indigo/blue/green/purple/red/orange/pink）
- 背景纹理定义在 `src/styles/themes/background.css`（SVG 噪点 + 径向渐变）
- 通过 `themeStore` 管理主题切换
- 支持两种预设：暗夜（dark）、晨曦（light）
- 7 种强调色可独立切换，通过 `--color-primary` 等变量映射
- 主题类名通过 `document.documentElement.classList` 切换
- **持久化**：使用 Zustand `persist` 中间件自动保存到 localStorage

### 3.8 UI 设计风格统一规范

#### 3.8.1 设计理念

**核心原则**：简洁、现代、和谐、流畅

- **简洁**：去除冗余装饰，专注核心功能
- **现代**：采用现代设计语言，圆角、阴影、渐变
- **和谐**：色彩搭配协调，视觉层次分明
- **流畅**：动画过渡自然，交互反馈及时

#### 3.8.2 色彩系统

**背景色层级**：

| 层级 | CSS 变量 | 用途 | 示例 |
|------|---------|------|------|
| 主背景 | `--bg-base` | 页面主背景 | `#0f0f12` (暗色) |
| 表面层 | `--bg-surface` | 卡片、列表项背景 | `#1a1a1f` |
| 悬浮层 | `--bg-surface-hover` | 悬浮状态背景 | `#242429` |
| 激活层 | `--bg-surface-active` | 激活/选中状态 | `#2a2a30` |

**强调色系统**：

- 主色（Primary）：`--color-primary` - 主要操作、选中状态
- 成功（Success）：`--color-success` - 成功状态、已安装
- 警告（Warning）：`--color-warning` - 警告提示
- 错误（Error）：`--color-error` - 错误状态、危险操作

**透明度变体系统**：

所有语义色和强调色都支持透明度变体，用于悬浮、选中、背景等场景：

| 变体 | 用途 | 示例 |
|------|------|------|
| `-5` | 极淡背景 | `--color-primary-5` |
| `-8` | 淡背景（成功色专用） | `--color-success-8` |
| `-10` | 悬浮背景 | `--color-primary-10` |
| `-15` | 选中背景 | `--color-primary-15` |
| `-20` | 强调背景、阴影 | `--color-primary-20` |

**使用规范**：
- 列表项悬浮：`var(--color-primary-10)`
- 列表项选中：`var(--color-primary-15)`
- 已安装状态背景：`var(--color-success-8)`
- 右键菜单悬浮：`var(--color-primary-10)` / `var(--color-error-10)`（危险项）

#### 3.8.3 边框与圆角

**边框规范**：

- **无边框设计**：列表项、卡片采用无边框或极淡边框
- **选中指示**：使用左侧彩色边框（`border-left: 4px solid`）而非四周边框
- **分隔线**：使用 `border-top/bottom` 而非 `border`，颜色为 `--border-color`

**圆角规范**：

| 元素类型 | 圆角大小 | Tailwind 类 |
|---------|---------|------------|
| 小按钮、标签 | 4px | `rounded` |
| 按钮、输入框 | 8px | `rounded-lg` |
| 卡片、列表项 | 8px | `rounded-lg` |
| 弹窗、面板 | 12px | `rounded-xl` |
| 大型容器 | 16px | `rounded-2xl` |

#### 3.8.4 阴影系统

**阴影层级**：

```css
/* 轻微阴影 - 悬浮状态 */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* 中等阴影 - 卡片、列表项 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

/* 强调阴影 - 选中状态 */
box-shadow: 0 10px 30px rgba(var(--color-primary-rgb), 0.25);

/* 弹窗阴影 */
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
```

#### 3.8.5 动画系统

**动画配置文件**：`src/utils/animations.ts`

**过渡时间**：

| 类型 | 时长 | 使用场景 |
|------|------|---------|
| fast | 0.15s | 快速反馈（按钮悬浮） |
| normal | 0.25s | 常规过渡（列表项展开） |
| slow | 0.4s | 慢速过渡（页面切换） |
| spring | 弹性 | 弹跳效果（按钮点击） |

**动画类型**：

1. **淡入淡出**：`fadeIn`, `fadeInUp`, `fadeInScale`
2. **滑动**：`slideInLeft`, `slideInRight`
3. **缩放**：`scaleIn`, `cardHover`
4. **交错**：`staggerContainer`, `staggerItem`

**列表项动画规范**：

```typescript
// 入场动画
variants={listItem}
initial="initial"
animate="animate"
exit="exit"

// 交互动画
whileHover="hover"  // 悬浮放大 1.02 倍
whileTap="tap"      // 点击缩小 0.98 倍

// 交错延迟
transition={{ delay: index * 0.02 }}
```

#### 3.8.6 组件设计规范

**列表项（InstanceListItem, VersionListItem）**：

```tsx
// 背景色
未选中：bg-surface-hover
悬浮：hover:bg-surface-active
选中：bg-primary-15

// 边框
未选中：无边框或左侧透明边框
选中：左侧主色边框（border-l-4 border-l-primary）

// 阴影
未选中：无阴影
悬浮：hover:shadow-lg
选中：shadow-lg shadow-primary/25

// 动画
入场：从左侧滑入 + 淡入
悬浮：放大 1.02 倍 + 图标旋转
点击：缩小 0.98 倍
```

**卡片（VersionCard, InstanceCard）**：

```tsx
// 背景
未选中：bg-surface
悬浮：hover:bg-surface-hover

// 边框
未选中：border border-border
悬浮：hover:border-primary/50
选中：border-primary

// 阴影
未选中：无阴影
悬浮：hover:shadow-lg hover:shadow-primary/10
选中：shadow-lg shadow-primary/10

// 动画
悬浮：上浮 4px + 放大 1.02 倍
点击：缩小 0.98 倍
```

**按钮**：

```tsx
// 主按钮
bg-primary hover:bg-primary-hover
shadow-md hover:shadow-lg
whileHover={{ scale: 1.05, y: -2 }}
whileTap={{ scale: 0.95 }}

// 图标按钮
hover:bg-surface-hover
whileHover={{ scale: 1.15, rotate: 5 }}
whileTap={{ scale: 0.9 }}
```

**右键菜单（ContextMenu）**：

```tsx
// 统一右键菜单组件：src/components/common/ContextMenu.tsx
// 使用 useContextMenu hook 管理状态

// 样式规范
backgroundColor: var(--color-surface-solid)
border: 1px solid var(--color-border)
borderRadius: 6px
boxShadow: 0 8px 32px rgba(0, 0, 0, 0.2)
minWidth: 140px
padding: 4px 0

// 菜单项样式
padding: 6px 12px (py-1.5 px-3)
fontSize: 14px (text-sm)
gap: 8px (gap-2)

// 悬浮效果
普通项：backgroundColor = var(--color-primary-10)
危险项：backgroundColor = var(--color-error-10)
位移：whileHover={{ x: 2 }}

// 动画
入场：淡入 + 缩放 0.95 → 1
鼠标指针：cursor-pointer

// 菜单项数据结构
interface ContextMenuItemData {
  id: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;      // 危险操作（删除）显示红色
  disabled?: boolean;    // 禁用状态
  divider?: boolean;     // 分隔线
}

// 使用示例
const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();

<ContextMenu
  items={[
    { id: 'settings', label: '实例管理', icon: Settings },
    { id: 'divider1', label: '', divider: true },
    { id: 'rename', label: '重命名', icon: Edit3 },
    { id: 'delete', label: '删除', icon: Trash2, danger: true },
    { id: 'divider2', label: '', divider: true },
    { id: 'openFolder', label: '打开所在文件夹', icon: FolderOpen },
  ]}
  position={contextMenuState.position}
  visible={contextMenuState.visible}
  onClose={hideContextMenu}
  onItemClick={handleContextMenuAction}
/>
```

**右键菜单统一使用场景**：
- 实例列表项（InstanceListItem）：实例管理、重命名、删除、打开所在文件夹
- 侧边栏游戏文件夹（BaseChildrenContent）：删除游戏文件夹、打开所在文件夹

**"打开所在文件夹"功能实现**：
- 侧边栏游戏文件夹：通过 `SmartSidebar.tsx` 中的 `handleOpenFolder` 函数实现
- 从 `knownFolders` 中查找文件夹路径，调用 `openFolder(path)` API
- 实例列表项：通过 `InstanceListItem.tsx` 中的 `handleContextMenuAction` 实现

#### 3.8.7 间距系统

**内边距（Padding）**：

| 元素类型 | 内边距 | Tailwind 类 |
|---------|--------|------------|
| 列表项 | 12px 16px | `px-4 py-3` |
| 卡片 | 16px | `p-4` |
| 按钮（小） | 6px 12px | `px-3 py-1.5` |
| 按钮（中） | 8px 16px | `px-4 py-2` |
| 按钮（大） | 12px 24px | `px-6 py-3` |

**外边距（Margin）**：

| 元素关系 | 间距 | Tailwind 类 |
|---------|------|------------|
| 列表项之间 | 0px（紧贴） | 无 |
| 卡片之间 | 16px | `gap-4` |
| 组件之间 | 24px | `gap-6` |
| 区块之间 | 32px | `gap-8` |

#### 3.8.8 图标规范

**图标大小**：

| 场景 | 大小 | Tailwind 类 |
|------|------|------------|
| 小图标（标签内） | 12px | `w-3 h-3` |
| 常规图标 | 16px | `w-4 h-4` |
| 中等图标 | 20px | `w-5 h-5` |
| 大图标 | 24px | `w-6 h-6` |
| 特大图标（空状态） | 64px | `w-16 h-16` |

**图标颜色**：

- 默认：`text-text-secondary`
- 悬浮：`hover:text-text-primary`
- 主色：`text-primary`
- 成功：`text-success`
- 错误：`text-error`

#### 3.8.9 文字规范

**字体大小**：

| 类型 | 大小 | Tailwind 类 | 用途 |
|------|------|------------|------|
| 特大标题 | 24px | `text-2xl` | 页面标题 |
| 大标题 | 20px | `text-xl` | 区块标题 |
| 中标题 | 18px | `text-lg` | 卡片标题 |
| 正文 | 14px | `text-base` | 常规文本 |
| 小字 | 12px | `text-sm` | 辅助文本 |
| 极小 | 10px | `text-xs` | 标签、时间 |

**字体颜色**：

- 主文本：`text-text-primary`
- 次要文本：`text-text-secondary`
- 辅助文本：`text-text-tertiary`
- 禁用文本：`text-text-disabled`

#### 3.8.10 状态反馈

**加载状态**：

- 使用 `Loader2` 图标 + `animate-spin`
- 配合文字提示："加载中..."、"正在扫描..."
- 使用 `SpinnerOverlay` 覆盖组件

**空状态**：

- 使用 `EmptyState` 组件
- 图标浮动动画（上下 10px，3 秒循环）
- 文字依次淡入
- 操作按钮弹出动画

**成功状态**：

- 绿色背景 `bg-success-bg`
- 绿色边框 `border-success`
- 绿色图标 `text-success`
- 弹出动画

**错误状态**：

- 红色背景 `bg-error-bg`
- 红色边框 `border-error`
- 红色图标 `text-error`
- 抖动动画

#### 3.8.11 响应式设计

**断点**：

- 移动端：< 640px (`sm:`)
- 平板：640px - 1024px (`md:`, `lg:`)
- 桌面：> 1024px (`xl:`)

**适配策略**：

- 列表项：移动端隐藏次要信息
- 卡片：移动端单列，桌面多列
- 侧边栏：移动端可折叠

#### 3.8.12 无障碍设计

- 所有按钮必须有 `title` 或 `aria-label`
- 图标按钮必须有文字说明
- 键盘导航支持（Tab、Enter、Escape）
- 焦点状态明显（`focus-visible:ring-2`）
- 颜色对比度符合 WCAG AA 标准

***

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
│   │   │   ├── NotificationProvider.tsx # 全局通知
│   │   │   ├── TabBar.tsx          # Tab 导航组件
│   │   │   ├── SpinnerOverlay.tsx  # 覆盖加载组件
│   │   │   ├── ListItem.tsx        # 列表项组件
│   │   │   ├── VersionCard.tsx     # 版本卡片
│   │   │   ├── InstanceCard.tsx    # 实例卡片
│   │   │   └── ThemePreview.tsx    # 主题预览
│   │   ├── sidebar/                # 侧边栏组件
│   │   │   ├── content/            # 侧边栏内容
│   │   │   │   ├── BaseSidebarContent.tsx
│   │   │   │   ├── BaseChildrenContent.tsx
│   │   │   │   ├── AccountSidebarContent.tsx
│   │   │   │   ├── GameSidebarContent.tsx
│   │   │   │   └── CommonSidebarContent.tsx
│   │   │   ├── layouts/            # 侧边栏布局
│   │   │   │   └── BaseSidebarLayout.tsx
│   │   │   └── SmartSidebar.tsx    # 智能侧边栏（动态路由感知）
│   │   ├── popup/                  # 弹窗组件
│   │   │   ├── AlertPopup.tsx
│   │   │   ├── ConfirmPopup.tsx
│   │   │   ├── LoadingPopup.tsx
│   │   │   ├── InputDialog.tsx     # 输入对话框
│   │   │   └── ProgressDialog.tsx  # 进度对话框
│   │   ├── Header.tsx
│   │   ├── ActionButton.tsx
│   │   ├── Popup.tsx
│   │   └── RouterRenderer.tsx
│   ├── pages/                      # 页面组件
│   │   ├── index.ts               # 统一导出
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   ├── Multiplayer.tsx
│   │   ├── VersionInstall.tsx
│   │   ├── AccountList/           # 账户页面
│   │   │   ├── AccountList.tsx
│   │   │   ├── AccountListWithSidebar.tsx
│   │   │   ├── MicrosoftAccount.tsx
│   │   │   └── OfflineAccount.tsx
│   │   ├── Download/              # 下载页面
│   │   │   ├── DownloadGame.tsx
│   │   │   ├── DownloadModpack.tsx
│   │   │   └── DownloadWithSidebar.tsx
│   │   ├── Feedback/              # 反馈页面
│   │   │   ├── Feedback.tsx
│   │   │   └── Hint.tsx
│   │   ├── GameSettings/          # 游戏设置页面
│   │   │   ├── GameSettingsJava.tsx
│   │   │   ├── GameSettingsGeneral.tsx
│   │   │   ├── GameSettingsAppearance.tsx
│   │   │   └── GameSettingsDownload.tsx
│   │   └── Instance/              # 实例页面
│   │       ├── Instance.tsx
│   │       ├── InstanceList.tsx
│   │       └── InstanceManage.tsx
│   ├── router/
│   │   ├── config.tsx              # 路由配置（含 lucide 图标）
│   │   ├── actionHandler.tsx       # 侧边栏动作处理
│   │   └── contextMenuConfigs.ts   # 右键菜单配置和处理逻辑
│   ├── hooks/
│   │   ├── useDownload.ts          # 下载相关 Hook
│   │   ├── useInstances.ts         # 实例 Hook
│   │   └── useWindowPosition.ts    # 窗口位置 Hook
│   ├── stores/                     # Zustand 全局状态
│   │   ├── appStore.ts             # 应用状态
│   │   ├── navStore.ts             # 导航状态
│   │   ├── downloadStore.ts        # 下载状态
│   │   ├── instanceStore.ts        # 实例状态（含 knownFolders）
│   │   ├── modloaderStore.ts       # 模组加载器状态
│   │   ├── themeStore.ts           # 主题状态（含强调色）
│   │   └── configStore.ts          # 配置状态
│   ├── icons/
│   │   └── index.ts                # lucide-react 图标集中导出
│   ├── locales/                    # 国际化翻译文件
│   │   ├── zh-CN/
│   │   │   └── translation.json    # 中文翻译
│   │   └── en-US/
│   │       └── translation.json    # 英文翻译
│   ├── utils/
│   │   ├── index.ts                # 工具函数导出
│   │   ├── format.ts               # 格式化工具函数
│   │   ├── eventBus.ts             # 事件总线
│   │   ├── modloaderCompat.ts      # 模组加载器兼容性
│   │   ├── versionFilter.ts        # 版本过滤工具
│   │   ├── iconRenderer.ts         # 图标渲染工具
│   │   └── configUtils.ts          # 配置工具函数（防抖、重试）
│   ├── helper/
│   │   ├── rustInvoke.ts           # Rust 调用封装（统一 API 层）
│   │   ├── popupUtils.ts
│   │   ├── logger.ts
│   │   └── i18n.ts                 # i18n 初始化
│   ├── styles/
│   │   └── themes/
│   │       ├── dark.css            # 暗色主题 CSS 变量
│   │       ├── light.css           # 亮色主题 CSS 变量
│   │       ├── accents.css         # 7 种强调色变量
│   │       └── background.css      # SVG 噪点纹理背景
│   ├── assets/
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                      # Tauri 后端
│   ├── src/
│   │   ├── lib.rs                 # 库入口（命令注册）
│   │   ├── main.rs                # 程序入口
│   │   ├── account.rs            # 账户管理
│   │   ├── launch.rs             # 游戏启动
│   │   ├── modloader.rs          # 模组加载器
│   │   ├── window.rs             # 窗口管理
│   │   ├── config/               # 配置管理模块
│   │   │   ├── mod.rs
│   │   │   ├── models.rs         # AppConfig, WindowPosition, ConfigManager
│   │   │   └── manager.rs        # 配置读写（动态 JSON 路径 + 序列化）
│   │   ├── download/             # 下载管理模块
│   │   │   ├── mod.rs
│   │   │   ├── models.rs         # 下载任务、版本清单类型
│   │   │   ├── manager.rs        # 下载任务管理（增删改查）
│   │   │   ├── downloader.rs     # 文件下载执行器
│   │   │   ├── deploy.rs         # 版本文件部署
│   │   │   ├── commands.rs       # Tauri 命令导出
│   │   │   ├── version.rs        # 版本清单获取
│   │   │   └── utils.rs          # 下载工具函数
│   │   └── instance/             # 实例管理模块
│   │       ├── mod.rs
│   │       ├── models.rs         # GameInstance, InstanceMeta, KnownPath
│   │       ├── manager.rs        # 实例 CRUD + 元数据 + 已知路径
│   │       ├── commands.rs       # Tauri 命令导出
│   │       └── utils.rs          # 目录复制等工具函数
│   ├── Cargo.toml
│   └── ...
├── package.json
├── tsconfig.json
└── AGENTS.md                      # 本文件
```

***

## 5. 核心 API 定义

### 5.1 账户管理 (account.rs)

| Rust 命令               | 前端函数                | 参数                                                        | 返回值                   |
| --------------------- | ------------------- | --------------------------------------------------------- | --------------------- |
| `add_account`         | `invokeAddAccount`  | `name`, `account_type`, `access_token?`, `refresh_token?` | `string` (UUID)       |
| `get_account_list`    | `getAccountList`    | -                                                         | `AccountInfo[]`       |
| `get_current_account` | `getCurrentAccount` | -                                                         | `AccountInfo \| null` |
| `delete_account`      | `deleteAccount`     | `uuid`                                                    | `string`              |
| `set_current_account` | `setCurrentAccount` | `uuid`                                                    | `string`              |

### 5.2 游戏启动 (launch.rs)

| Rust 命令                   | 前端函数              | 参数                      | 返回值            |
| ------------------------- | ----------------- | ----------------------- | -------------- |
| `tauri_launch_instance`   | `launchInstance`  | `config?: LaunchConfig` | `string`       |
| `tauri_stop_instance`     | `stopInstance`    | -                       | `string`       |
| `tauri_get_launch_status` | `getLaunchStatus` | -                       | `LaunchStatus` |

### 5.3 下载管理 (download.rs)

| Rust 命令                         | 前端函数                         | 参数                                        | 返回值                       |
| ------------------------------- | ---------------------------- | ----------------------------------------- | ------------------------- |
| `get_version_manifest`          | `getVersionManifest`         | -                                         | `VersionManifest`         |
| `get_version_detail`            | `getVersionDetail`           | `versionId`                               | `any`                     |
| `get_version_download_manifest` | `getVersionDownloadManifest` | `versionId`                               | `VersionDownloadManifest` |
| `download_file`                 | `downloadFile`               | `url`, `filename`, `sha1?`, `skipVerify?` | `DownloadProgress`        |
| `deploy_version_files`          | `deployVersionFiles`         | `versionId`                               | `string`                  |
| `is_version_deployed`           | `isVersionDeployed`          | `versionId`                               | `boolean`                 |
| `get_download_tasks`            | `getDownloadTasks`           | -                                         | `DownloadTask[]`          |
| `cancel_download`               | `cancelDownload`             | `taskId`                                  | `string`                  |
| `clear_completed_tasks`         | `clearCompletedTasks`        | -                                         | `string`                  |
| `get_game_versions`             | `getGameVersions`            | -                                         | `string[]`                |
| `get_download_base_path`        | `getDownloadBasePath`        | -                                         | `string`                  |
| `set_download_base_path`        | `setDownloadBasePath`        | `path`                                    | `string`                  |

**部署路径说明**：

- 下载完成后，通过 `deployVersionFiles` 部署到实例目录
- 部署路径格式：`{base}/minecraft/{instance_name}/versions/{version_name}/`
- 内部结构：`versions/{version_name}/{version_name}.jar`、`libraries/`、`assets/`、`natives/`

### 5.4 模组加载器 (modloader.rs)

| Rust 命令                      | 前端函数                      | 参数                                                                            | 返回值                    |
| ---------------------------- | ------------------------- | ----------------------------------------------------------------------------- | ---------------------- |
| `get_fabric_versions`        | `getFabricVersions`       | `mcVersion`                                                                   | `ModLoaderVersionList` |
| `get_fabric_version_detail`  | `getFabricVersionDetail`  | `mcVersion`, `loaderVersion`                                                  | `FabricVersionDetail`  |
| `build_fabric_launch_config` | `buildFabricLaunchConfig` | `mcVersion`, `loaderVersion`, `gameDir`, `assetsDir`, `username`, `uuid`, ... | `ModLoaderInfo`        |
| `get_forge_versions`         | `getForgeVersions`        | `mcVersion`                                                                   | `ModLoaderVersionList` |
| `build_forge_launch_config`  | `buildForgeLaunchConfig`  | `mcVersion`, `forgeVersion`, ...                                              | `ModLoaderInfo`        |
| `get_installed_mod_loaders`  | `getInstalledModLoaders`  | `versionId`                                                                   | `ModLoaderType[]`      |

### 5.5 实例管理 (instance.rs)

**实例存储结构**（无元数据文件，纯目录扫描）：

```
{base}/minecraft/
  └── {instance_name}/
      └── versions/
          └── {version_name}/
              ├── {version_name}.jar
              ├── {version_name}.json
              ├── libraries/
              ├── assets/
              │   ├── indexes/
              │   └── objects/
              └── natives/
```

**注意**: 实例目录从 `{base}/daemon/{instance_name}/.minecraft/` 改为 `{base}/minecraft/{instance_name}/versions/{version_name}/`，所有版本文件都放在 `versions/{version_name}/` 目录下。

| Rust 命令               | 前端函数               | 参数                                                             | 返回值                    |
| --------------------- | ------------------ | -------------------------------------------------------------- | ---------------------- |
| `scan_instances`      | `scanInstances`    | -                                                              | `GameInstance[]`       |
| `get_instance`        | `getInstance`      | `id`                                                           | `GameInstance \| null` |
| `create_instance`     | `createInstance`   | `name`, `version`, `loaderType`, `loaderVersion?`, `iconPath?` | `GameInstance`         |
| `delete_instance`     | `deleteInstance`   | `id`, `deleteFiles?`                                           | `void`                 |
| `copy_instance`       | `copyInstance`     | `id`, `newName`                                                | `GameInstance`         |
| `rename_instance`     | `renameInstance`   | `id`, `newName`                                                | `GameInstance`         |
| `update_instance`     | `updateInstance`   | `id`, `name?`, `enabled?`                                      | `GameInstance`         |
| `get_instances_path`  | `getInstancesPath` | -                                                              | `string`               |
| `scan_known_mc_paths` | `scanKnownMcPaths` | -                                                              | `KnownPath[]`          |
| `add_known_path`      | `addKnownPath`     | `path`                                                         | `KnownPath`            |
| `remove_known_path`   | `removeKnownPath`  | `id`                                                           | `void`                 |
| `open_folder`         | `openFolder`       | `path`                                                         | `string`               |
| `open_url`            | `openUrl`          | `url`                                                          | `string`               |

> **注意**: `remove_known_path` 不限制任何目录的删除（包括系统内置的 `default`、`official`、`home-mc`），前端通过 `SYSTEM_FOLDER_IDS` 过滤来控制是否显示删除按钮。

### 5.6 配置管理 (config/)

**ConfigManager 核心方法**（Rust 后端）：

| 方法                              | 说明        | 使用场景        |
| ------------------------------- | --------- | ----------- |
| `load_or_create()`              | 加载或创建配置文件 | 初始化配置       |
| `get_config()`                  | 获取完整配置    | 读取全部配置      |
| `update_config(config)`         | 完整更新配置    | 覆盖式更新（谨慎使用） |
| `update_value(key_path, value)` | 增量更新指定字段  | 推荐使用，避免覆盖   |
| `update_window_pos(position)`   | 更新窗口位置    | 窗口拖动后保存位置   |

**ConfigManager 使用示例**：

```rust
// ✅ 推荐：增量更新
config_manager.update_value("known_folders", paths_value)?;

// ✅ 推荐：更新窗口位置
config_manager.update_window_pos(position)?;

// ❌ 避免：完整覆盖（会丢失其他配置）
// config_manager.update_config(new_config)?;
```

**Tauri 命令导出**：

| Rust 命令                | 前端函数                 | 参数                          | 返回值                      |
| ---------------------- | -------------------- | --------------------------- | ------------------------ |
| `get_app_config`       | `getAppConfig`       | -                           | `AppConfig`              |
| `save_window_position` | `saveWindowPosition` | `x`, `y`, `width`, `height` | `string`                 |
| `get_window_position`  | `getWindowPosition`  | -                           | `WindowPosition \| null` |
| `add_known_folder`     | `addKnownFolder`     | `path`                      | `KnownPath[]`            |
| `remove_known_folder`  | `removeKnownFolder`  | `id`                        | `KnownPath[]`            |
| `get_known_folders`    | `getKnownFolders`    | -                           | `KnownPath[]`            |

### 5.7 系统命令 (lib.rs)

| Rust 命令           | 参数                 | 返回值                            |
| ----------------- | ------------------ | ------------------------------ |
| `greet`           | `name: &str`       | `string`                       |
| `get_system_info` | -                  | `{ os: string, arch: string }` |
| `log_frontend`    | `level`, `message` | -                              |

***

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

### 6.3 实例相关

```typescript
interface GameInstance {
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  path: string;               // .minecraft/ 绝对路径
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}

interface KnownPath {
  id: string;
  name: string;               // 显示名称
  path: string;               // 绝对路径
  is_default: boolean;        // 是否为 daemon 默认目录
}
```

---

## 7. 核心概念与命名规范

> **⚠️ 重要：理解项目中的命名逻辑，避免混淆**

### 7.1 概念区分

| 概念 | 英文 | ID 字段 | 说明 | 示例 |
|------|------|--------|------|------|
| **游戏实例** | Game Instance | `instanceId` | 每个独立的游戏版本配置 | `id: "1b50c1a9-5fdc-41bb-b2fe-1af21450cb52"`<br>`name: "Minecraft 1.2.1"`<br>`version: "1.2.1"` |
| **游戏文件夹** | Game Folder / Known Folder | `folderId` | 实例所在的目录分组 | `id: "default"`<br>`name: "默认文件夹"`<br>`path: "C:/.../minecraft"` |
| **实例路径** | Instance Path | - | 游戏实例在文件系统中的路径 | `path: "C:/.../minecraft/1.2.1"` |

### 7.2 关键命名说明

#### **instanceId**
- **指的是游戏实例的 UUID**，不是文件夹 ID
- 每个游戏版本（如 1.21.1、1.2.1）都是一个独立的 GameInstance
- 即使两个实例版本相同（都是 1.2.1），它们的 `instanceId` 也不同
- 用于路由参数：`/instance-manage/:instanceId/game-settings`

#### **selectedFolderId**
- 指的是选中的游戏文件夹（KnownFolder）的 ID
- 用于过滤显示哪些游戏实例
- 一个文件夹可以包含多个游戏实例

#### **selectedInstanceId**
- 指的是当前选中的游戏实例的 UUID
- 存储在 localStorage 中持久化
- 用于确定启动哪个游戏、修改哪个实例的配置

### 7.3 路由参数规范

```typescript
// ✅ 正确：instanceId 是游戏实例的 UUID
/instance-manage/:instanceId/game-settings
// 实际路径：/instance-manage/1b50c1a9-5fdc-41bb-b2fe-1af21450cb52/game-settings

// ❌ 错误：instanceId 不是文件夹 ID
/instance-manage/default/game-settings  // 这是错误的！
```

### 7.4 组件使用示例

```typescript
// 获取当前游戏实例
const { instanceId } = useRouteParams();  // 从路由参数获取
const instance = getInstance(instanceId);  // 从 store 获取实例对象

// 获取选中的文件夹
const selectedFolderId = useInstanceStore(s => s.selectedFolderId);
const filteredInstances = useInstanceStore(s => s.getFilteredInstances());

// 获取选中的实例
const selectedInstanceId = useInstanceStore(s => s.selectedInstanceId);
const selectedInstance = useInstanceStore(s => s.getSelectedInstance());
```

### 7.5 常见错误

```typescript
// ❌ 错误：混淆 instanceId 和 folderId
const folder = getInstance(instanceId);  // 错误！getInstance 需要游戏实例 ID

// ❌ 错误：用文件夹 ID 替换路由参数
path.replace(':instanceId', folderId);  // 错误！应该用游戏实例 ID

// ✅ 正确：使用游戏实例的 UUID
const instance = useInstanceStore.getState().getSelectedInstance();
path.replace(':instanceId', instance.id);  // 正确！
```

---

## 8. 侧边栏组件

```typescript
type SidebarItemType = 'route' | 'action' | 'external' | 'divider' | 'header';

interface SidebarMenuItem {
  id: string;
  type: SidebarItemType;       // route=跳转，action=执行，external=外链，divider=分隔线，header=分组标题
  title: string;
  titleI18nKey: string;
  icon?: ReactNode;
  path?: string;               // route 类型使用
  url?: string;                // external 类型使用
  action?: () => void;         // action 类型使用
  group: SidebarGroup;
  children?: SidebarMenuItem[];
}
```

**BaseChildrenContent 组件 Props**（侧边栏子项渲染器）：

```typescript
interface BaseChildrenContentProps {
  items: SidebarMenuItem[];                    // 菜单项列表
  onMenuClick?: (item: SidebarMenuItem) => void;  // 点击回调
  isActive?: (path: string) => boolean;        // 当前路径匹配
  isItemActive?: (id: string) => boolean;      // 当前选中项 ID 匹配（用于高亮）
  isParentActive?: (path: string) => boolean;   // 父级激活状态
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;  // 是否有子项
  groupTitle?: string;                         // 分组标题
  groupTitleI18nKey?: string;                  // 分组标题 i18n key
  onItemDelete?: (itemId: string) => void;     // 删除回调（可选）
  deletableItemIds?: Set<string>;              // 可删除的 item ID 集合
}
```

> **删除功能说明**: `BaseChildrenContent` 支持两种删除交互方式：
> - **Hover 删除按钮**: 可删除项在 hover 时显示 `Trash2` 图标按钮，点击触发 `onItemDelete`
> - **右键上下文菜单**: 可删除项支持右键弹出菜单，包含"删除游戏目录"选项
> - 系统内置目录（`default`、`official`、`home-mc`）通过 `deletableItemIds` 排除，不显示删除入口

### 6.5 主题相关

```typescript
type ThemeMode = 'dark' | 'light' | 'system';
type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';

interface ThemePreset {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  mode: ThemeMode;
  accentColor: AccentColor;
  previewColors: { bg: string; surface: string; accent: string; text: string };
}
```

### 6.6 配置相关

```typescript
interface AppConfig {
  version: string;
  language: string;
  theme: {
    mode: ThemeMode;
    accent_color: AccentColor;
  };
  window: {
    width: number;
    height: number;
    x: number | null;
    y: number | null;
    maximized: boolean;
  };
  // 已知文件夹列表（新增）
  known_folders: KnownPath[];
  // 实例配置映射（新增）
  instance_configs: Record<string, InstanceConfig>;
  // 其他配置...
}

interface InstanceConfig {
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  java_path: string | null;
  jvm_args: string[];
  game_options: Record<string, any>;
}
```

### 6.7 窗口位置

```typescript
interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}
```

***

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

### 7.4 Tab 导航组件 (TabBar)

```typescript
import { TabBar } from '@/components/common';

<TabBar
  tabs={[
    { key: 'browse', label: '浏览', content: <BrowseContent /> },
    { key: 'downloading', label: '下载中', content: <DownloadContent /> },
    { key: 'installed', label: '已安装', content: <InstalledContent /> },
  ]}
  variant="horizontal"
  size="md"
/>
```

### 7.5 列表项组件 (ListItem)

```typescript
import { ListItem } from '@/components/common';
import { User } from 'lucide-react';

<ListItem
  title="账户名称"
  subtitle="Microsoft 账户"
  icon={<User className="w-5 h-5" />}
  selected={true}
  onClick={() => {}}
/>
```

### 7.6 覆盖加载组件 (SpinnerOverlay)

```typescript
import { SpinnerOverlay } from '@/components/common';

<SpinnerOverlay
  visible={loading}
  message="加载中..."
  progress={50}
  showProgress
  onCancel={() => {}}
>
  <YourContent />
</SpinnerOverlay>
```

### 7.7 对话框 Hook (useDialog)

```typescript
import { useDialog } from '@/hooks/useDialog';

const { dialog, showConfirm, showAlert, closeDialog } = useDialog();

// 确认对话框
const confirmed = await showConfirm({
  title: '确认删除',
  message: '确定要删除吗？',
  type: 'warning',
});

// 提示对话框
await showAlert({
  title: '成功',
  message: '操作已完成',
  type: 'success',
});

// 渲染对话框
<ConfirmPopup
  isOpen={dialog.visible}
  title={dialog.title}
  message={dialog.message}
  iconType={dialog.type}
  onConfirm={closeDialog}
  onCancel={closeDialog}
  onClose={closeDialog}
/>
```

***

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
- `/account/microsoft` - 微软账号
- `/account/offline` - 离线账号
- `/instance-manage` - 游戏管理（带独立二级侧边栏，自动导航到第一个子项）
- `/instance-manage/game-settings` - 游戏设置
- `/instance-manage/auto-install` - 自动安装
- `/instance-manage/mods` - 模组
- `/instance-manage/resource-packs` - 材质包
- `/instance-manage/worlds` - 世界
- `/instance-list` - 游戏列表（原"实例列表"，带独立二级侧边栏，展示游戏目录下的实例）
- `/download` - 下载
- `/download/game` - 游戏下载
- `/download/modpack` - 整合包下载
- `/hint` - 启动器说明

> **已移除的页面**：
> - ~~`/game-settings`~~ - 全局游戏设置（已移除）
> - ~~`/settings`~~ - 设置（已移除）
> - ~~`/multiplayer`~~ - 多人联机（已移除）
> - ~~`/feedback`~~ - 反馈（已移除）

> **术语对照表**:
>
> | 旧术语 | 新术语 | 说明 |
> |--------|--------|------|
> | 游戏文件夹 | **游戏目录** | 指不同的 `{base}` 路径 |
> | 实例列表 | **游戏实例** | 指 `{base}/minecraft/{daemon_name}` 中的实例 |
> | 实例管理 | **版本中心** | 管理具体的游戏版本，显示版本图标 |

**侧边栏菜单项** (`SidebarMenuItem`) 使用 lucide-react 图标组件（`ReactNode`），不再使用 emoji 字符串。每个菜单项包含 `titleI18nKey` 用于国际化。

**侧边栏类型系统**：

- `route` - 跳转页面（`path` 指定目标路由）
- `action` - 执行功能（`action` 回调函数），**支持 `children` 时显示右键菜单**
- `external` - 打开外部链接（`url` 指定链接，使用 Tauri `openUrl`）
- `divider` - 视觉分隔线
- `header` - 分组标题（可折叠）

**右键上下文菜单**：
- 当 `action` 类型的菜单项带有 `children` 属性时，点击会显示右键上下文菜单
- 配置位置：`router/contextMenuConfigs.ts`
- 使用位置：`BaseChildrenContent.tsx` 的 `getContextMenuItems` 函数
- 处理函数：`useContextMenuAction` 封装了所有菜单项的处理逻辑
- **重要**：`ContextMenuChildItem` 的 `icon` 属性必须使用 JSX 元素格式（如 `<FolderOpen className="w-4 h-4" />`），而不是组件本身

**游戏管理侧边栏结构**：
```typescript
{
  id: 'instance-manage',
  type: 'route',
  path: '/instance-manage',
  autoNavigateToFirstChild: true, // 自动导航到第一个子项
  children: [
    // route 类型：游戏设置、自动安装、模组、材质包、世界
    { id: 'gm-game-settings', type: 'route', path: '/instance-manage/game-settings' },
    { id: 'gm-auto-install', type: 'route', path: '/instance-manage/auto-install' },
    { id: 'gm-mods', type: 'route', path: '/instance-manage/mods' },
    { id: 'gm-resource-packs', type: 'route', path: '/instance-manage/resource-packs' },
    { id: 'gm-worlds', type: 'route', path: '/instance-manage/worlds' },
    
    // action 类型 + children：点击显示右键菜单
    { id: 'gm-browse', type: 'action', children: [...] }, // 浏览菜单
    { id: 'gm-manage', type: 'action', children: [...] }  // 管理菜单
  ]
}
```

**独立侧边栏页面**:

- `/account` - 显示子菜单（微软账户、离线账户）
- `/download` - 显示子菜单（游戏下载、整合包下载）
- `/instance-list` - 动态生成（已知文件夹 + 操作项）
- `/game-settings` - 显示子菜单（Java 管理、通用、外观、下载）

***

## 9. 环境配置

### 9.1 数据目录

- **应用数据**: `~/.local/share/art/s1yle/mc_launcher/`
- **游戏目录**: `{data_local_dir}/art/s1yle/minecraft/`
- **实例目录**: `{data_local_dir}/art/s1yle/mc_launcher/minecraft/`
- **日志目录**: `{app_data_dir}/logs/` (保留 30 天)

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

### 9.3 实例目录结构

```
{base}/minecraft/
  └── {instance_name}/
      └── versions/
          └── {version_name}/
              ├── {version_name}.jar
              ├── {version_name}.json
              ├── libraries/
              ├── assets/
              │   ├── indexes/
              │   └── objects/
              └── natives/
```

**注意**: 实例目录从 `{base}/daemon/{instance_name}/.minecraft/` 改为 `{base}/minecraft/{instance_name}/versions/{version_name}/`，所有版本文件都放在 `versions/{version_name}/` 目录下。

***

## 10. 编码规范

### 10.1 前端 (TypeScript/React)

- 使用 **TypeScript**，开启严格模式
- 组件使用 **函数式组件** + **Hooks**
- 样式使用 **TailwindCSS**
- 动画使用 **Framer Motion**
- 路径别名：`@/*` 指向项目根目录
- 图标统一使用 `lucide-react`，从 `@/icons` 导出
- 所有用户可见文本使用 `t('key', 'fallback')` 国际化
- 配色使用 CSS 变量语义化类名（`bg-surface`、`text-text-primary` 等），禁止硬编码颜色

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
  - 前端：驼峰命名 (camelCase)
  - 后端：蛇形命名 (snake_case)
- **图标**: 禁止使用内联 SVG 或 emoji，统一使用 lucide-react
- **国际化**: 禁止硬编码用户可见文本，必须使用 i18n
- **配色**: 禁止硬编码 `bg-white/XX`、`text-white/XX`、`bg-indigo-600` 等，使用语义化 CSS 变量类名

***

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

***

## 12. 已完成的重构

### 12.1 已提取的通用组件

#### 基础组件

**ProgressBar** - 线性进度条  
📁 `src/components/common/ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  progress: number;                    // 进度值 (0-100)
  label?: string;                      // 进度标签
  sublabel?: string;                   // 副标签
  status?: 'idle' | 'active' | 'completed' | 'error';
  showPercentage?: boolean;            // 显示百分比
  size?: 'sm' | 'md' | 'lg';           // 进度条大小
  variant?: 'default' | 'success' | 'warning' | 'error';
  showIcon?: boolean;                  // 显示状态图标
  className?: string;
  barClassName?: string;
  formatValue?: (value: number) => string;  // 自定义格式化
}
```

**使用示例**：
```tsx
<ProgressBar progress={75} status="active" showPercentage size="md" />
<ProgressBar progress={100} status="completed" showIcon label="下载完成" />
<ProgressBar progress={error ? 0 : progress} status={error ? 'error' : 'active'} />
```

---

**CircularProgress** - 圆形进度指示器  
📁 `src/components/common/CircularProgress.tsx`

```typescript
interface CircularProgressProps {
  progress: number;                    // 进度值 (0-100)
  size?: number;                       // 圆形大小 (默认 48)
  strokeWidth?: number;                // 描边宽度 (默认 4)
  status?: 'idle' | 'active' | 'completed' | 'error';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;            // 显示百分比
  label?: string;                      // 中心标签
  className?: string;
}
```

**使用示例**：
```tsx
<CircularProgress progress={50} size={64} />
<CircularProgress progress={100} status="completed" variant="success" />
<CircularProgress progress={progress} label="加载中..." showPercentage={false} />
```

---

**StatusBadge** - 版本类型徽章  
📁 `src/components/common/StatusBadge.tsx`

```typescript
interface StatusBadgeProps {
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | string;
  label?: string;                      // 自定义标签
  size?: 'sm' | 'md' | 'lg';           // 徽章大小
  showDot?: boolean;                   // 显示圆点
  className?: string;
}
```

**使用示例**：
```tsx
<StatusBadge type={version.type_} />
<StatusBadge type="release" size="lg" showDot />
<StatusBadge type="snapshot" label="快照版" />
```

---

**Toggle** - 开关组件  
📁 `src/components/common/Toggle.tsx`

```typescript
interface ToggleProps {
  checked: boolean;                    // 开关状态
  onChange: (checked: boolean) => void; // 状态变化回调
  disabled?: boolean;                  // 禁用状态
  className?: string;
  id?: string;
  name?: string;
}
```

**使用示例**：
```tsx
const [enabled, setEnabled] = useState(false);
<Toggle checked={enabled} onChange={setEnabled} />
<Toggle checked={value} onChange={setValue} disabled={loading} />
```

---

**Mask** - 遮罩组件  
📁 `src/components/common/Mask.tsx`

```typescript
interface MaskProps {
  active: boolean;                     // 是否显示遮罩
  children: React.ReactNode;           // 被遮罩的内容
  label?: string;                      // 遮罩提示标题
  labelI18nKey?: string;               // 标题国际化 key
  description?: string;                // 遮罩提示描述
  descriptionI18nKey?: string;         // 描述国际化 key
  className?: string;
  overlayClassName?: string;
  disabled?: boolean;                  // 禁用遮罩
}
```

**使用示例**：
```tsx
<Mask active={!useInstanceSettings} label="使用全局设置" description="启用实例特定设置后可自定义">
  <SettingsSection title="Java 配置">...</SettingsSection>
</Mask>
```

---

#### 布局组件

**ListItem** - 列表项组件  
📁 `src/components/common/ListItem.tsx`

```typescript
interface ListItemProps {
  title: string;                       // 标题
  subtitle?: string;                   // 副标题
  icon?: React.ReactNode;              // 图标
  right?: React.ReactNode;             // 右侧内容
  selected?: boolean;                  // 选中状态
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  tag?: string;                        // 标签文字
  tagVariant?: 'default' | 'warning' | 'success' | 'error';
  showChevron?: boolean;               // 显示右箭头
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**使用示例**：
```tsx
<ListItem
  title="设置"
  subtitle="配置选项"
  icon={<Settings />}
  right={<Badge>新</Badge>}
  selected={active}
  onClick={handleClick}
  showChevron
/>
```

---

**EmptyState** - 空状态提示组件  
📁 `src/components/common/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon?: 'default' | 'download' | 'folder' | 'search' | 'error' | 'success';
  title: string;                       // 标题
  description?: string;                // 描述文字
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

**使用示例**：
```tsx
<EmptyState
  icon="search"
  title="未找到结果"
  description="尝试其他关键词搜索"
  action={{ label: '清除搜索', onClick: clearSearch }}
/>
```

---

**SpinnerOverlay** - 覆盖加载组件  
📁 `src/components/common/SpinnerOverlay.tsx`

```typescript
interface SpinnerOverlayProps {
  visible: boolean;                    // 是否显示遮罩
  loading?: boolean;                   // 显示加载图标
  children?: React.ReactNode;          // 被覆盖的内容
  message?: string;                    // 加载提示
  progress?: number;                   // 进度值
  showProgress?: boolean;              // 显示进度条
  onCancel?: () => void;               // 取消回调
  cancelText?: string;
  className?: string;
}
```

**使用示例**：
```tsx
<SpinnerOverlay
  visible={loading}
  message="正在加载..."
  progress={progress}
  showProgress
  onCancel={handleCancel}
>
  <PageContent />
</SpinnerOverlay>
```

---

#### 交互组件

**IconButton** - 图标按钮  
📁 `src/components/common/IconButton.tsx`

```typescript
interface IconButtonProps {
  icon: LucideIcon;                    // 图标组件
  iconSize?: number;                   // 图标大小
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';           // 按钮大小
  label?: string;                      // 提示文字
  iconClassName?: string;
  className?: string;
}
```

**使用示例**：
```tsx
<IconButton icon={Settings} onClick={openSettings} label="设置" />
<IconButton icon={Trash2} variant="danger" onClick={handleDelete} />
<IconButton icon={Edit2} size="sm" />
```

---

**ContextMenu** - 右键菜单  
📁 `src/components/common/ContextMenu.tsx`

```typescript
interface ContextMenuItemData {
  id: string;
  label: string;
  icon?: LucideIcon | React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItemData[];
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
  onItemClick: (id: string) => void;
  className?: string;
}

// Hook
const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();
```

**使用示例**：
```tsx
const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();

<div onContextMenu={showContextMenu}>
  <ContextMenu
    items={[
      { id: 'edit', label: '编辑', icon: Edit2 },
      { id: 'delete', label: '删除', icon: Trash2, danger: true },
    ]}
    position={contextMenuState.position}
    visible={contextMenuState.visible}
    onClose={hideContextMenu}
    onItemClick={handleAction}
  />
</div>
```

---

**VersionFilterDropdown** - 版本过滤下拉  
📁 `src/components/common/VersionFilterDropdown.tsx`

```typescript
interface VersionFilterDropdownProps {
  value: VersionCategory;              // 当前选中值
  onChange: (value: VersionCategory) => void;
  versions: GameVersion[];             // 版本列表（用于统计）
  className?: string;
}

type VersionCategory = 'all' | 'release' | 'snapshot' | 'april' | 'old';
```

**使用示例**：
```tsx
const [filter, setFilter] = useState<VersionCategory>('all');
<VersionFilterDropdown
  value={filter}
  onChange={setFilter}
  versions={versions}
/>
```

---

#### 卡片组件

**VersionCard** - 版本卡片  
📁 `src/components/common/VersionCard.tsx`

```typescript
interface VersionCardProps {
  version: GameVersion;
  installed: boolean;
  downloading: boolean;
  error?: string;
  selected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
  deployProgress: number;
  index?: number;
}
```

**使用示例**：
```tsx
<VersionCard
  version={version}
  installed={installedVersions.includes(version.id)}
  downloading={downloadingId === version.id}
  selected={selectedVersion === version.id}
  onSelect={() => setSelectedVersion(version.id)}
  onDownload={handleDownload}
  onDeploy={handleDeploy}
  isDeploying={deploying}
  deployProgress={deployProgress}
/>
```

---

**VersionListItem** - 版本列表行  
📁 `src/components/common/VersionListItem.tsx`

```typescript
interface VersionListItemProps {
  version: GameVersion;
  installed: boolean;
  wikiUrl?: string;
  onClick: () => void;
  onWikiClick: () => void;
  index?: number;
}
```

**使用示例**：
```tsx
<VersionListItem
  version={version}
  installed={installed}
  onClick={() => navigate(`/version/${version.id}`)}
  onWikiClick={() => openWiki(version.id)}
/>
```

---

**InstanceCard** - 实例卡片  
📁 `src/components/common/InstanceCard.tsx`

```typescript
interface InstanceCardProps {
  instance: GameInstance;
  selected?: boolean;
  onSelect?: () => void;
  onLaunch?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onExport?: () => void;
  onOpenConfigFolder?: () => void;
  onOpenConfig?: () => void;
  isRunning?: boolean;
  showPath?: boolean;
  viewMode?: 'grid' | 'list';
}
```

**使用示例**：
```tsx
<InstanceCard
  instance={instance}
  selected={selectedId === instance.id}
  onSelect={() => setSelectedId(instance.id)}
  onLaunch={() => launchGame(instance.id)}
  onEdit={() => navigate(`/instance/${instance.id}/settings`)}
  viewMode="grid"
/>
```

---

**InstanceListItem** - 实例列表行  
📁 `src/components/common/InstanceListItem.tsx`

```typescript
interface InstanceListItemProps {
  instance: GameInstance;
  selected?: boolean;
  onSelect?: () => void;
  onLaunch?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
  onSettings?: () => void;
  index?: number;
}
```

**使用示例**：
```tsx
<InstanceListItem
  instance={instance}
  selected={selectedId === instance.id}
  onSelect={() => setSelectedId(instance.id)}
  onSettings={() => navigate(`/instance/${instance.id}/settings`)}
  onDelete={handleDelete}
/>
```

---

**InstallCard** - 安装卡片  
📁 `src/components/common/InstallCard.tsx`

```typescript
interface InstallCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: 'not_installed' | 'installing' | 'installed' | 'incompatible';
  compatible: boolean;
  onClick: () => void;
}
```

**使用示例**：
```tsx
<InstallCard
  icon={<FabricIcon />}
  title="Fabric"
  subtitle="轻量级模组加载器"
  status={fabricInstalled ? 'installed' : 'not_installed'}
  compatible={isCompatible}
  onClick={handleInstall}
/>
```

---

**DownloadItem** - 下载项组件  
📁 `src/components/common/DownloadItem.tsx`

```typescript
interface DownloadItemProps {
  filename: string;
  url?: string;
  downloaded: number;                // 已下载字节数
  total: number;                     // 总字节数
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  sublabel?: string;
}
```

**使用示例**：
```tsx
<DownloadItem
  filename={download.filename}
  downloaded={download.downloaded}
  total={download.total}
  status={download.status}
  error={download.error}
  onCancel={() => cancelDownload(download.id)}
  onRetry={() => retryDownload(download.id)}
/>
```

---

#### 高级组件

**VirtualList** - 虚拟列表  
📁 `src/components/common/VirtualList.tsx`

```typescript
interface VirtualListProps<T> {
  items: T[];
  height?: number | string;          // 列表高度
  itemHeight: number;                // 单项高度
  overscan?: number;                 // 预渲染数量
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

**使用示例**：
```tsx
<VirtualList
  items={versions}
  height={600}
  itemHeight={80}
  overscan={5}
  renderItem={(version, index) => (
    <VersionListItem key={version.id} version={version} />
  )}
/>
```

---

**ThemePreview** - 主题预览组件  
📁 `src/components/common/ThemePreview.tsx`

```typescript
interface ThemePreviewProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

// 强调色选择器
interface AccentColorPickerProps {
  selected: AccentColor;
  onSelect: (color: AccentColor) => void;
}
```

**使用示例**：
```tsx
<ThemePreview
  preset={preset}
  selected={currentPreset === preset.id}
  onSelect={() => setPreset(preset.id)}
/>

<AccentColorPicker
  selected={currentAccent}
  onSelect={setAccent}
/>
```

---

**LoaderIcon** - 加载器图标  
📁 `src/components/common/LoaderIcon.tsx`

```typescript
interface LoaderIconProps {
  type: 'minecraft' | 'forge' | 'neoforge' | 'optifine' | 'fabric' | 'fabricApi' | 'quilt' | 'qsl';
  className?: string;
}
```

**使用示例**：
```tsx
<LoaderIcon type="fabric" className="w-6 h-6" />
<LoaderIcon type="forge" />
```

---

**VirtualList** - 虚拟列表  
📁 `src/components/common/VirtualList.tsx`

```typescript
interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

**使用示例**：
```tsx
<VirtualList
  items={versions}
  height={600}
  itemHeight={80}
  overscan={5}
  renderItem={(version, index) => (
    <VersionListItem key={version.id} version={version} index={index} />
  )}
/>
```

---

**VersionListItem** - 版本列表项  
📁 `src/components/common/VersionListItem.tsx`

```typescript
interface VersionListItemProps {
  version: GameVersion;
  installed: boolean;
  wikiUrl?: string;
  onClick: () => void;
  onWikiClick: () => void;
  index?: number;
}
```

**使用示例**：
```tsx
<VersionListItem
  version={version}
  installed={installedVersions.includes(version.id)}
  wikiUrl={`https://minecraft.wiki/w/${version.id}`}
  onClick={() => navigate(`/download/game/${version.id}`)}
  onWikiClick={() => openWiki(version.id)}
/>
```

---

**InstallCard** - 安装卡片  
📁 `src/components/common/InstallCard.tsx`

```typescript
type InstallCardStatus = 'not_installed' | 'installing' | 'installed' | 'incompatible';

interface InstallCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: InstallCardStatus;
  compatible: boolean;
  onClick: () => void;
}
```

**使用示例**：
```tsx
<InstallCard
  icon={<Gamepad2 className="w-6 h-6" />}
  title="版本安装"
  subtitle="安装 Minecraft 版本"
  status="not_installed"
  compatible={true}
  onClick={() => navigate('/download/game')}
/>
```

---

#### 通知组件

**NotificationProvider** - 全局通知组件  
📁 `src/components/common/NotificationProvider.tsx`

```typescript
interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;                 // 自动关闭时间 (ms)
  persistent?: boolean;              // 持久显示
  onClose?: () => void;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const { addNotification, success, error, warning, info } = useNotification();
```

**使用示例**：
```tsx
// 在 App 根组件
<NotificationProvider>
  <App />
</NotificationProvider>

// 在业务组件中使用
const { success, error } = useNotification();

success('保存成功', '配置已保存');
error('下载失败', '网络连接超时');
warning('注意', '此操作不可撤销');
```

---

### 设置组件 (位于 `src/components/settings/`)

**SettingItem** - 设置项  
📁 `src/components/settings/SettingItem.tsx`

```typescript
interface SettingItemProps {
  label: string;
  labelI18nKey?: string;
  description?: string;
  descriptionI18nKey?: string;
  children: React.ReactNode;
  className?: string;
}
```

**使用示例**：
```tsx
<SettingItem
  label={t('settings.java.path', 'Java 路径')}
  description={t('settings.java.pathDesc', '选择 Java 可执行文件')}
>
  <JavaPathSelector value={javaPath} onChange={setJavaPath} />
</SettingItem>
```

---

**SettingsSection** - 设置区块  
📁 `src/components/settings/SettingsSection.tsx`

```typescript
interface SettingsSectionProps {
  title: string;
  titleI18nKey?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

**使用示例**：
```tsx
<SettingsSection
  title="Java 配置"
  icon={<Coffee className="w-5 h-5" />}
>
  <SettingItem label="Java 路径" description="选择 Java 安装路径">
    <JavaPathSelector />
  </SettingItem>
  <SettingItem label="内存分配" description="设置最小和最大内存">
    <MemorySlider />
  </SettingItem>
</SettingsSection>
```

---

**MemorySlider** - 内存滑块  
📁 `src/components/settings/MemorySlider.tsx`

```typescript
interface MemorySliderProps {
  minMemory?: number;
  maxMemory?: number;
  autoMemory: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onAutoChange: (value: boolean) => void;
  disabled?: boolean;
}
```

**使用示例**：
```tsx
<MemorySlider
  autoMemory={autoMemory}
  minMemory={minMemory}
  maxMemory={maxMemory}
  onAutoChange={setAutoMemory}
  onMinChange={setMinMemory}
  onMaxChange={setMaxMemory}
  disabled={loading}
/>
```

---

**JavaPathSelector** - Java 路径选择器  
📁 `src/components/settings/JavaPathSelector.tsx`

```typescript
interface JavaPathSelectorProps {
  value?: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}
```

**使用示例**：
```tsx
<JavaPathSelector
  value={javaPath}
  onChange={(path) => updateSetting('java_path', path)}
  disabled={loading}
/>
```

---

### 侧边栏组件 (位于 `src/components/sidebar/`)

**SmartSidebar** - 智能侧边栏  
📁 `src/components/sidebar/SmartSidebar.tsx`

```typescript
interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
  footer?: React.ReactNode;
}
```

**功能特性**：
- 根据当前路由自动切换侧边栏内容
- 支持路由感知、右键菜单、动态内容
- 支持独立侧边栏页面（/account、/download、/instance-list、/instance-manage）
- 支持文件夹管理（添加、删除、验证）
- 支持右键上下文菜单和 Hover 删除按钮
- 支持删除确认弹框和系统目录保护

**使用示例**：
```tsx
<SmartSidebar
  onMenuClick={(path) => navigate(path)}
  showAllGroups={false}
  footer={<InstanceInfoHeader />}
/>
```

---

**InstanceManageButton** - 实例管理按钮  
📁 `src/components/sidebar/InstanceManageButton.tsx`

```typescript
interface InstanceManageButtonProps {
  item: SidebarMenuItem;
  isActive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: (path: string) => void;
}
```

**功能特性**：
- 显示当前选中实例的版本信息和加载器图标
- 支持下拉选择其他实例
- 支持 Fabric/Forge/NeoForge/Quilt 加载器图标
- 支持实例版本格式化显示

**使用示例**：
```tsx
<InstanceManageButton
  item={manageMenuItem}
  isActive={isActive}
  onNavigate={(path) => navigate(path)}
/>
```

---

**InstanceInfoHeader** - 实例信息头部  
📁 `src/components/sidebar/InstanceInfoHeader.tsx`

```typescript
interface InstanceInfoHeaderProps {
  onInstanceClick?: () => void;
  onIconClick?: () => void;
}
```

**功能特性**：
- 显示当前选中实例的图标、名称、版本信息
- 支持下拉选择其他实例
- 支持自定义实例图标
- 支持加载器图标显示（Fabric/Forge/NeoForge/Quilt）

**使用示例**：
```tsx
<InstanceInfoHeader
  onInstanceClick={() => setShowInstanceList(true)}
  onIconClick={() => openIconPicker()}
/>
```

---

**BaseSidebarLayout** - 侧边栏布局基座  
📁 `src/components/sidebar/layouts/BaseSidebarLayout.tsx`

**BaseChildrenContent** - 侧边栏子项渲染器  
📁 `src/components/sidebar/content/BaseChildrenContent.tsx`

```typescript
interface BaseChildrenContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (item: SidebarMenuItem) => void;
  isActive?: (path: string) => boolean;
  isItemActive?: (id: string) => boolean;
  isParentActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
  groupTitleI18nKey?: string;
  onItemDelete?: (itemId: string) => void;
  deletableItemIds?: Set<string>;
}
```

**功能特性**：
- 渲染侧边栏菜单项列表
- 支持路由跳转、动作执行、外部链接
- 支持右键上下文菜单和 Hover 删除按钮
- 支持系统目录保护（default/official/home-mc）
- 支持删除确认弹框

**使用示例**：
```tsx
<BaseChildrenContent
  items={menuItems}
  onMenuClick={handleItemClick}
  isActive={isActive}
  isItemActive={isItemActive}
  onItemDelete={handleDeleteFolder}
  deletableItemIds={deletableIds}
/>
```

---

**AccountSidebarContent** - 账户侧边栏内容  
📁 `src/components/sidebar/content/AccountSidebarContent.tsx`

**GameSidebarContent** - 游戏侧边栏内容  
📁 `src/components/sidebar/content/GameSidebarContent.tsx`

**CommonSidebarContent** - 通用侧边栏内容  
📁 `src/components/sidebar/content/CommonSidebarContent.tsx`

---

### 弹窗组件 (位于 `src/components/popup/`)

详细文档请查看：[docs/弹窗组件文档.md](docs/弹窗组件文档.md)

**Popup** - 通用弹窗基座  
📁 `src/components/Popup.tsx`

```typescript
interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  animationDuration?: number;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}
```

**功能特性**：
- 支持 AnimatePresence 进出动画
- 支持多种尺寸和位置
- 支持 ESC 关闭和点击遮罩关闭
- 支持防滚动
- 支持 ARIA 无障碍
- 支持自定义动画时长

**使用示例**：
```tsx
<Popup
  isOpen={visible}
  onClose={handleClose}
  title="标题"
  size="md"
  position="center"
  animation="scale"
>
  <div>内容</div>
</Popup>
```

---

**ConfirmPopup** - 确认对话框  
📁 `src/components/popup/ConfirmPopup.tsx`

```typescript
interface ConfirmPopupProps {
  isOpen: boolean;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger' | 'success' | 'warning';
  cancelType?: 'default' | 'outline';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showIcon?: boolean;
  iconType?: 'warning' | 'error' | 'info' | 'success' | 'question';
  disableConfirm?: boolean;
  disableCancel?: boolean;
  loading?: boolean;
  title?: string;
}
```

**功能特性**：
- 支持五种图标类型（warning/error/info/success/question）
- 支持确认按钮类型（primary/danger/success/warning）
- 支持异步确认操作
- 支持加载状态
- 支持禁用按钮

**使用示例**：
```tsx
const confirmed = await showConfirm({
  title: '确认删除',
  message: '确定要删除吗？此操作不可撤销',
  iconType: 'warning',
  confirmType: 'danger',
  confirmText: '删除',
});

if (confirmed) {
  // 执行删除
}
```

---

**AlertPopup** - 提示对话框  
📁 `src/components/popup/AlertPopup.tsx`

```typescript
interface AlertPopupProps {
  isOpen: boolean;
  message: React.ReactNode;
  confirmText?: string;
  confirmType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onConfirm?: () => void | Promise<void>;
  showIcon?: boolean;
  type?: 'success' | 'warning' | 'error' | 'info';
  disableConfirm?: boolean;
  loading?: boolean;
  autoClose?: number;
  onAutoClose?: () => void;
  title?: string;
}
```

**功能特性**：
- 支持四种类型（success/warning/error/info）
- 支持自动关闭
- 支持异步确认操作
- 支持加载状态

**使用示例**：
```tsx
// 成功提示
<AlertPopup
  isOpen={showSuccess}
  message="操作成功"
  type="success"
  autoClose={2000}
/>

// 错误提示
<AlertPopup
  isOpen={showError}
  message="操作失败"
  type="error"
/>
```

---

**LoadingPopup** - 加载对话框  
📁 `src/components/popup/LoadingPopup.tsx`

```typescript
interface LoadingPopupProps {
  isOpen: boolean;
  message?: React.ReactNode;
  loadingText?: string;
  showProgress?: boolean;
  progress?: number;
  progressText?: string;
  showCancelButton?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  customIcon?: React.ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
  disableCancel?: boolean;
  autoClose?: number;
  onAutoClose?: () => void;
}
```

**功能特性**：
- 支持进度条显示
- 支持自定义加载图标
- 支持取消按钮
- 支持自动关闭
- 支持副标题

**使用示例**：
```tsx
<LoadingPopup
  isOpen={loading}
  message="正在加载..."
  showProgress
  progress={progress}
  showCancelButton
  onCancel={handleCancel}
/>
```

---

**InputDialog** - 输入对话框  
📁 `src/components/popup/InputDialog.tsx`

```typescript
interface InputDialogProps {
  isOpen: boolean;
  title: string;
  value?: string;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  maxLength?: number;
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}
```

**功能特性**：
- 支持表单验证
- 支持错误提示
- 支持必填校验
- 支持自定义验证函数
- 自动聚焦输入框

**使用示例**：
```tsx
<InputDialog
  isOpen={showInputDialog}
  title="重命名"
  value={currentName}
  placeholder="请输入新名称"
  required
  validate={(v) => v.length < 2 ? '名称至少 2 个字符' : null}
  onConfirm={handleRename}
  onCancel={() => setShowInputDialog(false)}
/>
```

---

**ProgressDialog** - 进度对话框  
📁 `src/components/popup/ProgressDialog.tsx`

```typescript
interface ProgressDialogProps {
  isOpen: boolean;
  title: string;
  progress: number;
  status: 'idle' | 'active' | 'completed' | 'error';
  message?: string;
  detail?: string;
  showProgressBar?: boolean;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  autoCloseOnComplete?: boolean;
  autoCloseDelay?: number;
}
```

**功能特性**：
- 支持进度条显示
- 支持状态图标（idle/active/completed/error）
- 支持自动关闭
- 支持详情文本
- 支持取消和确认按钮

**使用示例**：
```tsx
<ProgressDialog
  isOpen={showProgressDialog}
  title="下载进度"
  progress={progress}
  status={status}
  message="正在下载文件..."
  detail={currentFile}
  autoCloseOnComplete
  autoCloseDelay={2000}
  onCancel={handleCancel}
  onConfirm={handleComplete}
/>
```

---

### 功能组件

**RouterRenderer** - 路由渲染器  
📁 `src/components/RouterRenderer.tsx`

**功能特性**：
- 根据当前路由动态渲染对应页面组件
- 支持页面切换动画（淡入 + 位移）
- 支持 AnimatePresence wait 模式
- 组件映射表管理

**使用示例**：
```tsx
// App.tsx 中
<RouterRenderer />
```

---

**Header** - 页面头部  
📁 `src/components/Header.tsx`

```typescript
interface HeaderProps {
  type: 'main' | 'sub';
  title: string;
}
```

**功能特性**：
- 支持主页面和子页面两种模式
- 主页面显示 Logo 和标题
- 子页面显示返回按钮和标题
- 支持窗口最小化和关闭按钮
- 支持拖拽区域（data-tauri-drag-region）

**使用示例**：
```tsx
<Header type="main" title="S1yle Launcher" />
<Header type="sub" title="账户管理" />
```

---

**ActionButton** - 操作按钮  
📁 `src/components/ActionButton.tsx`

```typescript
interface ActionButtonProps {
  onClick?: () => void;
}
```

**功能特性**：
- 启动实例按钮
- 显示启动状态（Idle/Launching/Running/Crashed）
- 支持加载动画和状态反馈
- 集成账户信息和实例选择

**使用示例**：
```tsx
<ActionButton onClick={handleLaunch} />
```

---

**BottomBar** - 底部栏  
📁 `src/components/BottomBar/BottomBar.tsx`

```typescript
interface BottomBarProps {
  dir: string;
  cmdOpen: string;
  title?: string;
  path: string;
  handleOpenDownloadFolder?: () => void;
}
```

**功能特性**：
- 显示当前目录路径
- 支持打开文件夹按钮
- 支持自定义打开回调

**使用示例**：
```tsx
<BottomBar
  dir="下载目录"
  cmdOpen="打开"
  path={downloadPath}
  handleOpenDownloadFolder={handleOpen}
/>
```

---

**InstanceConfigPanel** - 实例配置面板  
📁 `src/components/InstanceConfigPanel.tsx`

**功能特性**：
- 显示实例配置信息
- 支持 Java 配置、内存分配等设置
- 集成 SettingItem 和 SettingsSection 组件

**使用示例**：
```tsx
<InstanceConfigPanel instance={selectedInstance} />
```

---

**DownloadProgressPanel** - 下载进度面板  
📁 `src/components/DownloadProgressPanel.tsx`

```typescript
interface DownloadProgressPanelProps {
  visible?: boolean;
  onClose?: () => void;
}
```

**功能特性**：
- 显示下载任务列表
- 显示总进度和分类进度
- 支持取消下载和清除已完成任务
- 支持最小化到右下角

**使用示例**：
```tsx
<DownloadProgressPanel
  visible={showPanel}
  onClose={() => setShowPanel(false)}
/>
```

---

**FloatingDownloadButton** - 悬浮下载按钮  
📁 `src/components/FloatingDownloadButton.tsx`

**功能特性**：
- 悬浮在页面右下角的下载按钮
- 显示下载进度和任务数量
- 支持点击进入下载页面

**使用示例**：
```tsx
<FloatingDownloadButton />
```

---

**AddFolderDialog** - 添加文件夹对话框  
📁 `src/components/instance/AddFolderDialog.tsx`

```typescript
interface AddFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**功能特性**：
- 选择 Minecraft 实例文件夹
- 验证文件夹有效性
- 支持自定义文件夹名称
- 显示验证结果和实例数量

**使用示例**：
```tsx
<AddFolderDialog
  isOpen={showAddDialog}
  onClose={() => setShowAddDialog(false)}
/>
```

---

### 自定义 Hooks

**useInstances** - 实例管理 Hook  
📁 `src/hooks/useInstances.ts`

```typescript
interface UseInstancesReturn {
  instances: GameInstance[];
  selectedInstance: GameInstance | null;
  loading: boolean;
  error: string | null;
  instancesPath: string;
  selectInstance: (id: string) => void;
  createNewInstance: (name, version, loaderType, loaderVersion?) => Promise<GameInstance>;
  removeInstance: (id: string, deleteFiles?: boolean) => Promise<void>;
  duplicateInstance: (id: string, newName: string) => Promise<GameInstance>;
  renameInstanceById: (id: string, newName: string) => Promise<GameInstance>;
  toggleInstance: (id: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}
```

**使用示例**：
```tsx
const {
  instances,
  selectedInstance,
  loading,
  selectInstance,
  createNewInstance,
  removeInstance,
} = useInstances();
```

---

**useDownload** - 下载管理 Hook  
📁 `src/hooks/useDownload.ts`

```typescript
interface UseDownloadReturn {
  manifest: VersionManifest | null;
  installedVersions: string[];
  downloadTasks: DownloadTask[];
  downloadPath: string;
  loading: boolean;
  error: string | null;
  downloadQueue: DownloadItemState[];
  categoryProgress: CategoryProgress[];
  isDownloading: boolean;
  initCategoryMap: (files) => void;
  // ... 更多方法
}
```

**功能特性**：
- 获取版本列表和已安装版本
- 管理下载任务和进度
- 支持并发下载（16 个并发）
- 分类进度显示（客户端、依赖库、资源文件等）

**使用示例**：
```tsx
const {
  manifest,
  downloadQueue,
  categoryProgress,
  downloadVersion,
  cancelDownload,
} = useDownload();
```

---

**useConfig** - 配置管理 Hook  
📁 `src/hooks/useConfig.ts`

```typescript
// 全局配置
const { config, loading, error, init, refresh } = useConfig();

// 用户偏好
const { preferences, setTheme, setLanguage, toggleAnimation } = usePreferences();

// 实例配置
const { instanceConfig, updateJava, updateMemory, removeInstanceConfig } = useInstanceConfig(instanceId);

// 下载配置
const { downloadConfig, updateDownloadConfig } = useDownloadConfig();
```

**功能特性**：
- 全局配置读写
- 用户偏好设置（主题、语言、动画）
- 实例配置管理（Java、内存）
- 下载配置管理

---

**useWindowPosition** - 窗口位置管理 Hook  
📁 `src/hooks/useWindowPosition.ts`

**功能特性**：
- 监听窗口移动和调整事件
- 防抖保存窗口位置（500ms）
- 支持最小化保护（不保存最小化坐标）
- 支持坐标验证（过滤无效坐标）
- 恢复窗口位置

**使用示例**：
```tsx
// App.tsx 中
useWindowPosition();
```

---

### 工具函数

**iconRenderer** - 图标渲染工具  
📁 `src/utils/iconRenderer.ts`

```typescript
renderIcon(icon, className, size) - 图标渲染函数
Icon - React 组件版本
isValidIcon(icon) - 图标验证函数
```

**使用示例**：
```tsx
import { renderIcon } from '@/utils/iconRenderer';
import { Settings } from 'lucide-react';

{renderIcon(icon, 'text-primary', 'md')}
<Icon icon={Settings} className="text-primary" size="md" />
```

---

**format** - 格式化工具  
📁 `src/utils/format.ts`

```typescript
formatFileSize(bytes) - 格式化文件大小
formatDate(date) - 格式化日期
getVersionTypeLabel(type) - 版本类型标签
getVersionTypeColor(type) - 版本类型颜色
```

**使用示例**：
```tsx
formatFileSize(1024000) // "1 MB"
formatDate(new Date()) // "2024-01-01"
getVersionTypeLabel('release') // "正式版"
```

---

**animations** - 动画配置  
📁 `src/utils/animations.ts`

```typescript
// 过渡时间
transitions.fast - 0.15s
transitions.normal - 0.25s
transitions.slow - 0.4s
transitions.spring - 弹性动画

// 动画变体
listItem - 列表项动画
staggerContainer - 交错容器
staggerItem - 交错列表项
fadeIn - 淡入
fadeInUp - 淡入上移
fadeInScale - 淡入缩放
cardHover - 卡片悬浮
```

**使用示例**：
```tsx
<motion.div
  variants={listItem}
  initial="initial"
  animate="animate"
  transition={transitions.normal}
/>
```

---

**configUtils** - 配置工具  
📁 `src/utils/configUtils.ts`

```typescript
debounce(fn, delay) - 防抖函数
retry(fn, retries) - 重试函数
getNestedValue(obj, path) - 获取嵌套值
setNestedValue(obj, path, value) - 设置嵌套值
```

**使用示例**：
```tsx
const debouncedSave = debounce(saveConfig, 500);
await retry(fetchData, 3);
const value = getNestedValue(config, 'preferences.theme');
setNestedValue(config, 'preferences.language', 'zh-CN');
```

---

**versionFilter** - 版本过滤工具  
📁 `src/utils/versionFilter.ts`

**modLoaderCompat** - 模组加载器兼容性工具  
📁 `src/utils/modLoaderCompat.ts`

---

### Helper 工具

**rustInvoke** - Rust API 调用封装  
📁 `src/helper/rustInvoke.ts`

**核心函数**：
```typescript
invokeRustFunction(fnName, args?, options?) - 通用调用函数
invokeAddAccount(name, type, accessToken?, refreshToken?) - 添加账户
getAccountList() - 获取账户列表
getCurrentAccount() - 获取当前账户
deleteAccount(uuid) - 删除账户
setCurrentAccount(uuid) - 设为当前账户
getConfig() - 获取配置
updateConfig(config) - 更新配置
selectJavaPath() - 选择 Java 路径
getSystemMemory() - 获取系统内存
scanInstances() - 扫描实例
createInstance(name, version, loaderType, loaderVersion?) - 创建实例
deleteInstance(id, deleteFiles?) - 删除实例
renameInstance(id, newName) - 重命名实例
getVersionManifest() - 获取版本列表
getGameVersions() - 获取已安装版本
downloadFile(url, dest, sha1?) - 下载文件
saveWindowPosition(x, y, width, height, maximized) - 保存窗口位置
loadWindowPosition() - 加载窗口位置
```

**类型定义**：
```typescript
AccountType - 账户类型枚举（Microsoft/Offline）
AccountInfo - 账户信息接口
Account - 账户接口（含敏感信息）
LaunchStatus - 启动状态枚举
LaunchConfig - 启动配置接口
```

**使用示例**：
```tsx
import {
  getConfig,
  updateConfig,
  type AppConfig,
} from '@/helper/rustInvoke';

const config: AppConfig = await getConfig();
await updateConfig(config);
```

---

**popupUtils** - 弹窗配置工具  
📁 `src/helper/popupUtils.ts`

**配置接口**：
```typescript
ConfirmPopupConfig - 确认弹窗配置
AlertPopupConfig - 提示弹窗配置
LoadingPopupConfig - 加载弹窗配置
```

**配置生成器**：
```typescript
createConfirmConfig(message, options?) - 创建确认弹窗配置
createDangerConfirmConfig(message, options?) - 创建危险确认弹窗配置
createSuccessAlertConfig(message, options?) - 创建成功提示弹窗配置
createErrorAlertConfig(message, options?) - 创建错误提示弹窗配置
createWarningAlertConfig(message, options?) - 创建警告提示弹窗配置
createInfoAlertConfig(message, options?) - 创建信息提示弹窗配置
createLoadingConfig(message, options?) - 创建加载弹窗配置
```

**使用示例**：
```tsx
import { createDangerConfirmConfig } from '@/helper/popupUtils';

const config = createDangerConfirmConfig(
  '确定要删除吗？此操作不可撤销',
  { title: '危险操作' }
);

<ConfirmPopup
  isOpen={showConfirm}
  onClose={handleClose}
  onConfirm={handleConfirm}
  {...config}
/>
```

---

**logger** - 统一日志工具  
📁 `src/helper/logger.ts`

```typescript
logger.debug(message, ...args) - 调试日志
logger.info(message, ...args) - 普通信息
logger.warn(message, ...args) - 警告
logger.error(message, ...args) - 错误
```

**功能特性**：
- 所有日志转发到 Rust 端（tracing）
- 失败时降级到 console
- 支持多参数（自动 JSON 序列化）

**使用示例**：
```tsx
logger.info('实例加载成功', instances.length);
logger.error('下载失败', error);
```

---

**i18n** - 国际化初始化  
📁 `src/helper/i18n.ts`

**功能特性**：
- 初始化 i18next
- 配置中英文资源
- 设置默认语言为中文

**使用示例**：
```tsx
// main.tsx 中导入
import './helper/i18n';

// 组件中使用
const { t } = useTranslation();
<h1>{t('welcome', '欢迎')}</h1>
```

---

### Router 相关

**config** - 路由配置  
📁 `src/router/config.tsx`

**枚举类型**：
```typescript
SidebarType - 侧边栏类型（MAIN/SUB/SECONDARY）
SidebarGroup - 侧边栏分组（ACCOUNT/GAME/COMMON/NONE）
RoutePosition - 路由位置（TOP/BOTTOM/HIDDEN）
LayoutMode - 布局模式（STANDARD/FULLSCREEN）
SidebarItemType - 侧边栏项类型（route/action/external/divider/header）
```

**接口定义**：
```typescript
HeaderConfig - 头部配置
RouteConfig - 路由配置
SidebarMenuItem - 侧边栏菜单项
```

**路由配置**：
```typescript
routes - 路由配置数组
  - / - 主页
  - /account - 账户列表（带子菜单）
  - /instance-manage - 游戏管理（带子菜单，自动导航）
  - /instance-list - 游戏实例列表
  - /download - 下载（带子菜单）
  - /hint - 启动器说明

工具函数：
- getSidebarGroups() - 获取侧边栏分组
- findRouteByPath(path, routes) - 查找路由
- getParentPath(path) - 获取父级路由
```

**侧边栏菜单项配置**：
```typescript
sidebarMenuItems - 侧边栏菜单项数组
  - 主页
  - 账户列表（分组标题）
  - 游戏管理（分组标题）
  - 游戏列表
  - 下载
  - 启动器说明
```

**使用示例**：
```tsx
import { routes, findRouteByPath } from '@/router/config';

const route = findRouteByPath('/account', routes);
```

---

**actionHandler** - 路由动作处理器  
📁 `src/router/actionHandler.tsx`

**主要函数**：
```typescript
handleAddGameFolder() - 添加游戏目录
  - 打开文件夹选择对话框
  - 调用 addKnownFolder 添加到已知文件夹

handleRefreshInstances() - 刷新实例列表
  - 调用 refresh 刷新实例数据
```

**使用示例**：
```tsx
import { handleAddGameFolder, handleRefreshInstances } from '@/router/actionHandler';

// 在侧边栏菜单项中使用
{
  id: 'add-folder',
  type: 'action',
  action: handleAddGameFolder,
}
```

---

### Pages 页面组件

**主页面组件**：

| 页面 | 路由 | 说明 |
|------|------|------|
| Home | `/` | 主页 |
| AccountList | `/account` | 账户列表 |
| AccountListWithSidebar | `/account` (带侧边栏) | 账户列表（带子菜单） |
| MicrosoftAccount | `/account/microsoft` | 微软账号 |
| OfflineAccount | `/account/offline` | 离线账号 |
| InstanceList | `/instance-list` | 游戏实例列表 |
| InstanceManage | `/instance-manage` | 版本中心 |
| DownloadGame | `/download/game` | 游戏下载 |
| DownloadModpack | `/download/modpack` | 整合包下载 |
| VersionDetailWithInstall | `/download/game/:versionId` | 版本详情（全屏） |
| VersionInstall | `/version-install` | 版本安装 |
| InstanceGameSettings | `/instance-manage/game-settings` | 游戏设置 |
| InstanceAutoInstall | `/instance-manage/auto-install` | 自动安装 |
| InstanceMods | `/instance-manage/mods` | 模组 |
| InstanceResourcePacks | `/instance-manage/resource-packs` | 材质包 |
| InstanceWorlds | `/instance-manage/worlds` | 世界 |
| Hint | `/hint` | 启动器说明 |

**已移除的页面**：
- ~~Settings~~ - 设置（已移除）
- ~~Multiplayer~~ - 多人联机（已移除）
- ~~Feedback~~ - 反馈（已移除）

**页面组件特性**：
- 所有页面都通过 RouterRenderer 动态渲染
- 支持页面切换动画（淡入 + 位移，250ms）
- 支持 AnimatePresence wait 模式
- 页面头部通过 Header 组件统一管理
- 部分页面带独立侧边栏（/account、/download、/instance-list、/instance-manage）

| 函数/模块                 | 位置     | 说明        |
| --------------------- | ------ | --------- |
| `formatFileSize`      | utils/ | 格式化文件大小 ✅ |
| `formatDate`          | utils/ | 格式化日期 ✅   |
| `getVersionTypeLabel` | utils/ | 版本类型标签 ✅  |
| `getVersionTypeColor` | utils/ | 版本类型颜色 ✅  |
| `eventBus`            | utils/ | 事件总线 ✅    |
| `debounce`            | utils/ | 防抖函数 ✅    |
| `retry`               | utils/ | 重试函数 ✅    |
| `getNestedValue`      | utils/ | 获取嵌套值 ✅   |
| `setNestedValue`      | utils/ | 设置嵌套值 ✅   |

### 12.3 全局状态 (Zustand)

| Store               | 位置      | 说明                         |
| ------------------- | ------- | -------------------------- |
| `useAppStore`       | stores/ | 应用状态（系统信息、初始化） ✅           |
| `useNavStore`       | stores/ | 导航状态（路径、导航锁） ✅             |
| `useDownloadStore`  | stores/ | 下载状态（版本、任务、进度） ✅           |
| `useInstanceStore`  | stores/ | 实例状态（列表、搜索、视图、已知文件夹、持久化） ✅ |
| `useModloaderStore` | stores/ | 模组加载器状态 ✅                  |
| `useThemeStore`     | stores/ | 主题状态（预设、强调色、**localStorage 持久化**） ✅ |
| `useConfigStore`    | stores/ | 配置管理（配置文件读写、延迟保存） ✅      |
| `configManager`     | stores/ | **配置管理器（L1/L2/L3 分层存储）** ✅  |

### 12.4 国际化

| 语言         | 位置       | 状态 |
| ---------- | -------- | -- |
| 中文 (zh-CN) | locales/ | ✅  |
| 英文 (en-US) | locales/ | ✅  |

### 12.5 主题系统

| 文件                   | 说明                 | 状态 |
| -------------------- | ------------------ | -- |
| `dark.css`           | 暗色主题 CSS 变量        | ✅  |
| `light.css`          | 亮色主题 CSS 变量        | ✅  |
| `accents.css`        | 7 种强调色变量           | ✅  |
| `background.css`     | SVG 噪点纹理背景         | ✅  |
| `tailwind.config.js` | CSS 变量映射到 Tailwind | ✅  |

**预设模板**: 暗夜（dark）、晨曦（light）
**强调色**: indigo / blue / green / purple / red / orange / pink
**背景**: SVG feTurbulence 噪点 + radial-gradient 渐变叠加

### 12.6 图标系统

- 所有内联 SVG 和 emoji 已替换为 `lucide-react` 图标 ✅
- 图标集中管理在 `src/icons/index.ts` ✅

### 12.7 动画系统

| 组件           | 说明                                        | 状态 |
| ------------ | ----------------------------------------- | -- |
| Popup        | AnimatePresence 进出动画（fade/slide/scale）    | ✅  |
| Notification | Toast 弹簧进出动画 + 自动位移                       | ✅  |
| TabBar       | 内容切换 exit 动画 + layoutId 滑动指示器             | ✅  |
| 页面过渡         | opacity + x 位移 + 250ms 缓动，AnimatePresence mode="wait" | ✅  |
| Spinner      | 统一使用 Loader2 lucide 图标                    | ✅  |

### 12.8 侧边栏系统

- 智能侧边栏（SmartSidebar）根据路由自动切换内容 ✅
- 独立侧边栏页面：/account、/download、/instance-list、/game-settings ✅
- 侧边栏按钮类型系统：route / action / external / divider / header ✅
- 微交互：按压缩放、图标悬停弹簧、交错入场、Chevron 旋转 ✅
- 左侧激活色条 + focus-visible 键盘导航反馈 ✅
- 上下文切换模式（侧边栏随页面变化） ✅
- **右键菜单**: 可删除项支持 `onContextMenu` 弹出上下文菜单，ESC/点击外部自动关闭 ✅
- **右键菜单统一**: 使用 `ContextMenu` 组件 + `useContextMenu` hook，菜单项包括：实例管理、重命名、删除、打开所在文件夹 ✅
- **Hover 删除按钮**: 可删除项 hover 时显示 `Trash2` 图标按钮，`opacity` 过渡动画 ✅
- **删除确认弹框**: SmartSidebar 集成 `ConfirmPopup`，删除前弹出确认对话框 ✅
- **系统目录保护**: `default`/`official`/`home-mc` 不显示删除入口，通过 `deletableItemIds` Set 控制 ✅

### 12.9 实例系统

- 存储结构改为 daemon 目录，无元数据文件 ✅
- 已知文件夹扫描（daemon + 官方启动器 + 主目录） ✅
- 选中文件夹持久化到 localStorage ✅
- 实例列表根据选中文件夹过滤 ✅
- **自动设默认**: 点击游戏目录项时，`setSelectedFolder` 自动调用 `setDefaultFolder` 将该目录设为默认，无需手动操作 ⭐图标 ✅
- **侧边栏删除**: 游戏目录的删除按钮从 Instance 页面头部移至侧边栏每个目录项上，支持 hover 按钮和右键菜单两种方式 ✅
- **Instance.tsx 精简**: 移除了删除相关代码（Trash2 按钮、ConfirmPopup、showDeleteConfirm 状态），删除逻辑统一在 SmartSidebar 中处理 ✅
- **版本图标显示**: InstanceCard 和 InstanceListItem 集成 `LoaderIcon` 组件，根据 `loader_type` 显示 Fabric/Forge/NeoForge 图标 ✅

### 12.10 窗口位置管理

- **窗口位置保存**: 使用 `useWindowPosition` hook 监听窗口移动和调整事件 ✅
- **最小化保护**: 保存位置前检查 `isMinimized()` 状态，避免保存最小化时的错误坐标 (-32000, -32000) ✅
- **坐标验证**: 检查坐标是否小于 -10000，过滤无效坐标 ✅
- **持久化存储**: 窗口位置保存到 `app_config.json`，通过 `ConfigManager` 管理 ✅

### 12.11 游戏下载列表项

- **简化设计**: 移除下载按钮和部署按钮，点击列表项进入详情页进行操作 ✅
- **已安装状态**: 显示 `CheckCircle` 图标 + 绿色背景 ✅
- **Wiki 链接**: 保留 Wiki 按钮，可快速跳转到 Minecraft Wiki ✅

### 12.12 配色系统优化

- **透明度变体**: 所有语义色和强调色支持 5%/8%/10%/15%/20% 透明度变体 ✅
- **CSS 变量替换**: 所有硬编码颜色替换为 CSS 变量，支持主题切换 ✅
- **themeStore 增强**: `applyToDom` 函数应用透明度变体到 DOM ✅

### 12.13 页面切换动画优化

- **动画时间**: 从 350ms 减少到 250ms，提升响应速度 ✅
- **AnimatePresence mode**: 从 `sync` 改为 `wait`，避免新旧组件同时渲染 ✅
- **动画变体**: 提取到 `utils/animations.ts`，便于统一管理 ✅
- **移除缩放效果**: 移除 `scale: 0.98`，使动画更流畅 ✅
- **减少位移距离**: 从 30px/-20px 减少到 15px/-10px ✅

### 12.14 弹窗 UI 优化

- **背景**: 使用 `var(--color-surface-solid)` 替代硬编码类名 ✅
- **边框**: `1px solid var(--color-border)` ✅
- **圆角**: 统一为 `8px`（按钮 `6px`） ✅
- **阴影**: `0 12px 48px rgba(0, 0, 0, 0.25)` ✅
- **内边距**: `px-5 py-4` 替代 `p-6` ✅
- **按钮悬浮效果**: 添加 `translateY(-1px)` 上浮动画 ✅
- **关闭按钮**: 添加 `var(--color-primary-10)` 悬浮背景 ✅

### 12.15 窗口配置

- **最小窗口尺寸**: 800×600（从 960×600 调整） ✅

### 12.16 游戏管理重构（2026-05-06）

**新增页面**：
- `src/pages/Instance/InstanceSettings/` 目录下的 5 个新页面：
  - `InstanceGameSettings.tsx` - 游戏设置
  - `InstanceAutoInstall.tsx` - 自动安装
  - `InstanceMods.tsx` - 模组
  - `InstanceResourcePacks.tsx` - 材质包
  - `InstanceWorlds.tsx` - 世界

**配置文件**：
- `src/router/contextMenuConfigs.ts` - 右键菜单配置和处理逻辑
  - `browseMenuConfig` - 浏览菜单（版本目录、模组文件夹等 8 项）
  - `manageMenuConfig` - 管理菜单（生成脚本、重命名等 5 项）
  - `useContextMenuAction` - 统一处理函数

**移除页面**：
- `/game-settings` - 全局游戏设置
- `/settings` - 设置
- `/multiplayer` - 多人联机
- `/feedback` - 反馈

**侧边栏更新**：
- `/instance-manage` 设置 `autoNavigateToFirstChild: true`
- 游戏管理的 5 个一级菜单从 `action` 改为 `route` 类型
- 浏览和管理改为 `action` + `children`，点击显示右键菜单

**解耦设计**：
- 配置与逻辑分离：菜单结构定义在 `contextMenuConfigs.ts`
- 统一处理函数：`useContextMenuAction` 封装所有菜单项处理
- 可扩展：支持为每个菜单项自定义 `handler` 函数

**图标使用规范**：
- `ContextMenuChildItem` 的 `icon` 必须使用 JSX 元素格式
- 正确示例：`icon: <FolderOpen className="w-4 h-4" />`
- 错误示例：`icon: FolderOpen`（会导致 "Element type is invalid" 错误）

### 12.17 分层配置存储系统（2026-05-06）

**问题诊断**：
- **时序问题**：主题配置保存时配置文件未加载完成，导致保存失败
- **配置类型混杂**：UI 配置、业务配置、敏感配置都存储在同一个配置文件中
- **保存策略单一**：所有配置都采用相同的保存方式

**三层存储架构**：

| 层级 | 存储介质 | 用途 | 保存时机 | 示例 |
|------|---------|------|---------|------|
| **L1** | localStorage | UI 配置、用户偏好 | 立即同步保存 | 主题、语言、窗口布局 |
| **L2** | app_config.json | 业务配置、应用设置 | 异步防抖保存 | 实例配置、下载设置、路径配置 |
| **L3** | 加密存储（Tauri Secure Storage） | 敏感数据 | 立即异步保存 | 账号 Token、密码 |

**核心实现**：

1. **配置管理器** (`src/stores/configManager.ts`)：
   - L1/L2/L3 三层存储 API
   - 配置分类读写（`getPreference`, `setPreference`）
   - 防抖保存机制（500ms）
   - 实例配置管理
   - UI 配置管理

2. **Theme Store 改造** (`src/stores/themeStore.ts`)：
   - 添加 Zustand `persist` 中间件
   - 自动持久化到 localStorage（L1）
   - 异步备份到配置文件（L2）
   - `init` 方法从 localStorage 立即加载

3. **Config Store 改造** (`src/stores/configStore.ts`)：
   - 添加 `initialized` 状态
   - `setPreference` 支持延迟保存（配置未加载时 100ms 后重试）
   - 解决时序问题

4. **工具函数** (`src/utils/configUtils.ts`)：
   - `debounce` - 防抖函数
   - `retry` - 重试函数
   - `getNestedValue` / `setNestedValue` - 嵌套对象操作

**配置保存流程**：
```
用户切换主题
    ↓
ThemeStore.setMode('light')
    ↓
1. 立即更新状态和 DOM（<1ms）
2. 通过 persist 中间件自动保存到 localStorage（L1）
3. 调用 configManager.setPreference('theme', 'light')
    ↓
configManager.setPreference:
    - 立即保存到 localStorage
    - 异步保存到配置文件（500ms 防抖）
```

**配置加载流程**：
```
应用启动
    ↓
1. persist 中间件从 localStorage 读取配置（立即生效）
2. applyToDom 应用主题到 DOM
3. 异步从配置文件同步（可选，用于多端同步）
```

**核心优势**：
- ✅ **零延迟响应**：主题切换立即生效（<1ms）
- ✅ **可靠持久化**：localStorage 保证配置不丢失，配置文件作为备份
- ✅ **分层管理**：UI 配置（L1）、业务配置（L2）、敏感数据（L3）分离
- ✅ **防抖优化**：减少配置文件写入次数（减少约 80%）
- ✅ **时序问题解决**：配置未加载时的延迟保存机制

**配置项分类**：

**L1: localStorage 配置项**：
- `theme.mode` - 主题模式（dark/light/system）
- `theme.accentColor` - 强调色（indigo/blue/green/purple/red/orange/pink）
- `theme.activeTheme` - 实际应用的主题
- `preferences.language` - 界面语言
- `preferences.enableAnimation` - 动画开关
- `ui.sidebarWidth` - 侧边栏宽度
- `ui.sidebarCollapsed` - 侧边栏折叠状态
- `ui.instanceViewMode` - 实例视图模式（grid/list）

**L2: 配置文件项**：
- `window_position` - 窗口位置
- `preferences` - 用户偏好（L1 备份）
- `download` - 下载配置
- `path_config` - 路径配置
- `known_folders` - 已知文件夹列表
- `instance_configs` - 实例配置映射

**L3: 加密存储配置项**（待实现）：
- `microsoft_access_token:{uuid}` - 微软账号 Token
- `microsoft_refresh_token:{uuid}` - 刷新 Token

**详细文档**：
- 完整方案见 `docs/分层配置存储系统方案规划书.md`

***

## 13. 注意事项

- 前端调用 Rust 使用 `@tauri-apps/api/core` 的 `invoke` 函数
- Rust 后端的所有命令都通过 `lib.rs` 的 `generate_handler!` 宏注册
- 窗口使用无边框模式，自定义标题栏需要实现拖动区域
- 文件下载使用 `async-fetcher`，SHA1 校验使用 `sha1` crate
- 原生库解压使用 `zip` crate
- i18n 初始化在 `src/helper/i18n.ts`，已在 `App.tsx` 中导入
- 主题 CSS 变量在 `main.tsx` 中导入（dark.css + light.css + accents.css + background.css）
- `Popup` 组件使用 `isOpen` 属性（不是 `visible`）
- `router/config` 文件扩展名为 `.tsx`（需要 JSX 支持）
- 外部链接使用 Tauri `openUrl` API（`tauri_plugin_opener::open_url`）
- 实例目录位于 `{base}/minecraft/{name}/versions/{version}/`，无 instance.json 元数据文件
- 配色必须使用 CSS 变量语义化类名，禁止硬编码 `bg-white/XX`、`text-white/XX` 等
- **窗口位置保存**: 最小化时不保存位置，避免保存 -32000 坐标
- **Webview 右键菜单**: 已禁用，在 `App.tsx` 中通过 `e.preventDefault()` 实现
- **游戏下载列表项**: 点击进入详情页操作，无下载/部署按钮
- **配置管理**: 更新配置时必须使用 `ConfigManager.update_value()` 增量更新，**禁止**使用 `update_config()` 完整覆盖，否则会导致配置丢失
- **APP_HANDLE**: 可通过 `APP_HANDLE.get().state::<ConfigManager>()` 获取 ConfigManager 实例
- **BASE_PATH**: 使用 `std::env::current_exe().parent()` 获取可执行文件所在目录（非工作目录），确保安装后路径正确指向 SMCL 根目录
- **游戏目录术语**: 前端统一使用"游戏目录"（指 `{base}` 路径），"游戏实例"（指 `{base}/minecraft/{daemon_name}`），"版本中心"（管理具体游戏版本）
- **删除功能架构**: 游戏目录删除入口在侧边栏（SmartSidebar → BaseChildrenContent），确认弹框使用 ConfirmPopup，后端 remove_known_path 不做限制，前端通过 SYSTEM_FOLDER_IDS 控制可见性
- **setSelectedFolder 行为**: 选中游戏目录时自动调用 setDefaultFolder 设为默认，同时更新 knownFolders 的 is_default 字段

### 12.18 统一 API 层架构（2026-04-29）

**架构原则**：
1. **统一入口**：所有前端调用后端的 API 都集中在 `rustInvoke.ts` 中
2. **类型安全**：类型定义与 API 函数放在同一文件，便于维护
3. **单一文件**：所有配置相关的 API 和类型都在一个文件中

**一层架构（完全统一）**：
```
前端代码
    ↓
┌─────────────────────────────────────┐
│  rustInvoke.ts (统一 API 层)          │
│  - 所有 Rust API 调用函数              │
│  - 所有类型定义                       │
│  - 错误处理和日志                     │
└─────────────────────────────────────┘
```

**使用方式**：
```typescript
// 直接导入使用
import {
  getConfig,
  updateConfig,
  type AppConfig,
  type InstanceConfig,
} from '@/helper/rustInvoke';

const config: AppConfig = await getConfig();
await updateConfig(config);
```

**详细文档**：参考 `docs/API_ARCHITECTURE.md`

***

## 14. 相关文档

- `docs/` 目录包含详细的技术文档和实施方案
- `docs/API_ARCHITECTURE.md` - API 架构统一说明
- `docs/分层配置存储系统方案规划书.md` - 分层配置存储系统完整方案
- `docs/弹窗组件文档.md` - 弹窗组件使用指南
- `docs/Lucide 图标使用最佳实践.md` - 图标系统规范
- `src/components/popup/POPUP_COMPONENTS_README.md` - 弹窗组件 README

***

**文档状态**: ✅ 完成  
**最后更新**: 2026-05-08  
**维护者**: S1yle

***

## 15. 组件文档完整性

### 15.1 已文档化的组件

#### Common 目录 (21 个组件) ✅

| 组件 | 文档状态 | 位置 |
|------|---------|------|
| ProgressBar | ✅ | `src/components/common/ProgressBar.tsx` |
| CircularProgress | ✅ | `src/components/common/CircularProgress.tsx` |
| DownloadItem | ✅ | `src/components/common/DownloadItem.tsx` |
| StatusBadge | ✅ | `src/components/common/StatusBadge.tsx` |
| EmptyState | ✅ | `src/components/common/EmptyState.tsx` |
| IconButton | ✅ | `src/components/common/IconButton.tsx` |
| NotificationProvider | ✅ | `src/components/common/NotificationProvider.tsx` |
| TabBar | ✅ | `src/components/common/TabBar.tsx` |
| SpinnerOverlay | ✅ | `src/components/common/SpinnerOverlay.tsx` |
| ListItem | ✅ | `src/components/common/ListItem.tsx` |
| VersionCard | ✅ | `src/components/common/VersionCard.tsx` |
| InstanceCard | ✅ | `src/components/common/InstanceCard.tsx` |
| ThemePreview | ✅ | `src/components/common/ThemePreview.tsx` |
| InstallCard | ✅ | `src/components/common/InstallCard.tsx` |
| InstanceListItem | ✅ | `src/components/common/InstanceListItem.tsx` |
| LoaderIcon | ✅ | `src/components/common/LoaderIcon.tsx` |
| VersionFilterDropdown | ✅ | `src/components/common/VersionFilterDropdown.tsx` |
| VersionListItem | ✅ | `src/components/common/VersionListItem.tsx` |
| VirtualList | ✅ | `src/components/common/VirtualList.tsx` |
| Toggle | ✅ | `src/components/common/Toggle.tsx` |
| Mask | ✅ | `src/components/common/Mask.tsx` |
| ContextMenu | ✅ | `src/components/common/ContextMenu.tsx` |

#### Popup 目录 (6 个组件) ✅

| 组件 | 文档状态 | 位置 |
|------|---------|------|
| Popup | ✅ | `src/components/Popup.tsx` |
| ConfirmPopup | ✅ | `src/components/popup/ConfirmPopup.tsx` |
| AlertPopup | ✅ | `src/components/popup/AlertPopup.tsx` |
| LoadingPopup | ✅ | `src/components/popup/LoadingPopup.tsx` |
| InputDialog | ✅ | `src/components/popup/InputDialog.tsx` |
| ProgressDialog | ✅ | `src/components/popup/ProgressDialog.tsx` |

#### Settings 目录 (4 个组件) ✅

| 组件 | 文档状态 | 位置 |
|------|---------|------|
| SettingItem | ✅ | `src/components/settings/SettingItem.tsx` |
| SettingsSection | ✅ | `src/components/settings/SettingsSection.tsx` |
| MemorySlider | ✅ | `src/components/settings/MemorySlider.tsx` |
| JavaPathSelector | ✅ | `src/components/settings/JavaPathSelector.tsx` |

#### Sidebar 目录 (8 个组件) ✅

| 组件 | 文档状态 | 位置 |
|------|---------|------|
| SmartSidebar | ✅ | `src/components/sidebar/SmartSidebar.tsx` |
| InstanceManageButton | ✅ | `src/components/sidebar/InstanceManageButton.tsx` |
| InstanceInfoHeader | ✅ | `src/components/sidebar/InstanceInfoHeader.tsx` |
| BaseSidebarLayout | ✅ | `src/components/sidebar/layouts/BaseSidebarLayout.tsx` |
| BaseChildrenContent | ✅ | `src/components/sidebar/content/BaseChildrenContent.tsx` |
| AccountSidebarContent | ✅ | `src/components/sidebar/content/AccountSidebarContent.tsx` |
| GameSidebarContent | ✅ | `src/components/sidebar/content/GameSidebarContent.tsx` |
| CommonSidebarContent | ✅ | `src/components/sidebar/content/CommonSidebarContent.tsx` |

#### 功能组件 (8 个) ✅

| 组件 | 文档状态 | 位置 |
|------|---------|------|
| RouterRenderer | ✅ | `src/components/RouterRenderer.tsx` |
| Header | ✅ | `src/components/Header.tsx` |
| ActionButton | ✅ | `src/components/ActionButton.tsx` |
| BottomBar | ✅ | `src/components/BottomBar/BottomBar.tsx` |
| InstanceConfigPanel | ✅ | `src/components/InstanceConfigPanel.tsx` |
| DownloadProgressPanel | ✅ | `src/components/DownloadProgressPanel.tsx` |
| FloatingDownloadButton | ✅ | `src/components/FloatingDownloadButton.tsx` |
| AddFolderDialog | ✅ | `src/components/instance/AddFolderDialog.tsx` |

### 15.2 已文档化的 Hooks

| Hook | 文档状态 | 位置 |
|------|---------|------|
| useInstances | ✅ | `src/hooks/useInstances.ts` |
| useDownload | ✅ | `src/hooks/useDownload.ts` |
| useConfig | ✅ | `src/hooks/useConfig.ts` |
| useWindowPosition | ✅ | `src/hooks/useWindowPosition.ts` |

### 15.3 已文档化的工具函数

| 工具 | 文档状态 | 位置 |
|------|---------|------|
| iconRenderer | ✅ | `src/utils/iconRenderer.ts` |
| format | ✅ | `src/utils/format.ts` |
| animations | ✅ | `src/utils/animations.ts` |
| configUtils | ✅ | `src/utils/configUtils.ts` |
| versionFilter | ✅ | `src/utils/versionFilter.ts` |
| modLoaderCompat | ✅ | `src/utils/modLoaderCompat.ts` |

### 15.4 已文档化的 Stores

| Store | 文档状态 | 位置 |
|------|---------|------|
| useAppStore | ✅ | `src/stores/appStore.ts` |
| useNavStore | ✅ | `src/stores/navStore.ts` |
| useDownloadStore | ✅ | `src/stores/downloadStore.ts` |
| useInstanceStore | ✅ | `src/stores/instanceStore.ts` |
| useModloaderStore | ✅ | `src/stores/modloaderStore.ts` |
| useThemeStore | ✅ | `src/stores/themeStore.ts` |
| useConfigStore | ✅ | `src/stores/configStore.ts` |
| configManager | ✅ | `src/stores/configManager.ts` |

### 15.5 文档覆盖率统计

| 类别 | 总数 | 已文档化 | 覆盖率 |
|------|------|---------|--------|
| Common 组件 | 22 | 22 | 100% |
| Popup 组件 | 6 | 6 | 100% |
| Settings 组件 | 4 | 4 | 100% |
| Sidebar 组件 | 8 | 8 | 100% |
| 功能组件 | 8 | 8 | 100% |
| **组件总计** | **48** | **48** | **100%** |
| | | | |
| Hooks | 4 | 4 | 100% |
| 工具函数 | 6 | 6 | 100% |
| Stores | 8 | 8 | 100% |
| **总计** | **66** | **66** | **100%** |

### 15.6 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| 主题配色系统 | `docs/主题配色系统.md` | 主题架构、颜色系统、使用示例 |
| 弹窗组件文档 | `docs/弹窗组件文档.md` | 弹窗组件详细使用指南 |
| Lucide 图标使用最佳实践 | `docs/Lucide 图标使用最佳实践.md` | 图标系统规范 |
| 分层配置存储系统方案规划书 | `docs/分层配置存储系统方案规划书.md` | 配置存储架构设计 |
| API_ARCHITECTURE | `docs/API_ARCHITECTURE.md` | API 层架构说明 |
