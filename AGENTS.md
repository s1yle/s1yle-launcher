# S1yle Launcher - AI Agent 开发指南

## 0. Agent 操作规范

> **重要提醒：在执行任何命令或操作前，请先询问用户的意见。禁止使用任何 git 操作（如 commit、push、pull 等）。**

- 执行任何 Shell 命令前需征得用户同意
- 禁止使用 git 操作，除非用户明确要求
- 修改代码前先展示方案，征得用户确认后再执行
- 对于复杂的重构，需要先输出详细方案

***

## 1. 项目概述

S1yle Launcher 是一个 Minecraft 启动器，采用 Tauri 2 + React 19 技术栈构建。

**核心特性**：

- Minecraft 版本管理（下载、安装、启动）
- 多账户支持（微软账号、离线账号）
- 模组加载器支持（Fabric、Forge、NeoForge）
- 文件完整性校验（SHA1）
- 跨平台支持（Windows、Linux、macOS）
- 国际化支持（中文、英文）
- 主题系统（暗色/亮色预设 + 7 种强调色 + 噪点纹理背景）
- 实例管理（daemon 目录结构，无元数据文件，自动发现）
- 统一配置管理系统（增量更新，避免配置覆盖）

***

## 2. 技术栈

### 前端

- **框架**: React 19.1.0 + React Router DOM 7.3.0
- **构建工具**: Vite 7.0.4
- **样式**: TailwindCSS 4.1.18 + PostCSS
- **动画**: Framer Motion 12.34.3
- **状态管理**: Zustand 5.0
- **国际化**: i18next 26.0 + react-i18next 17.0
- **图标**: lucide-react 1.7
- **工具**: clsx 2.1 + tailwind-merge 3.5
- **语言**: TypeScript \~5.8.3

### 后端 (Rust)

- **框架**: Tauri 2
- **异步运行时**: Tokio 1 (full features)
- **HTTP客户端**: reqwest 0.12 (json, stream)
- **下载**: async-fetcher 0.12
- **序列化**: serde 1 + serde\_json 1
- **日志**: tracing 0.1.44 + tracing-subscriber 0.3.22 + tracing-appender 0.2.4
- **校验**: sha1 0.10, hex 0.4
- **工具库**:
  - once\_cell 1.21.3
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
| `ListItem`              | 列表项组件    | 两行布局（标题+副标题），图标槽位，选中态                   |
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

### 3.7 主题系统

- CSS 变量定义在 `src/styles/themes/dark.css` 和 `src/styles/themes/light.css`
- 强调色定义在 `src/styles/themes/accents.css`（7 种：indigo/blue/green/purple/red/orange/pink）
- 背景纹理定义在 `src/styles/themes/background.css`（SVG 噪点 + 径向渐变）
- 通过 `themeStore` 管理主题切换
- 支持两种预设：暗夜（dark）、晨曦（light）
- 7 种强调色可独立切换，通过 `--color-primary` 等变量映射
- 主题类名通过 `document.documentElement.classList` 切换

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

**列表项背景规范**：

```css
/* 未选中状态 */
background: var(--color-surface-solid);

/* 悬浮状态 */
background: var(--color-primary-10);

/* 选中状态 */
background: var(--color-primary-15);
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

/* 已安装状态 */
background: var(--color-success-8);
```

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
未选中: bg-surface-hover
悬浮: hover:bg-surface-active
选中: bg-primary/25

// 边框
未选中: 无边框或左侧透明边框
选中: 左侧主色边框（border-l-4 border-l-primary）

// 阴影
未选中: 无阴影
悬浮: hover:shadow-lg
选中: shadow-lg shadow-primary/25

// 动画
入场: 从左侧滑入 + 淡入
悬浮: 放大 1.02 倍 + 图标旋转
点击: 缩小 0.98 倍
```

**卡片（VersionCard, InstanceCard）**：

```tsx
// 背景
未选中: bg-surface
悬浮: hover:bg-surface-hover

// 边框
未选中: border border-border
悬浮: hover:border-primary/50
选中: border-primary

// 阴影
未选中: 无阴影
悬浮: hover:shadow-lg hover:shadow-primary/10
选中: shadow-lg shadow-primary/10

// 动画
悬浮: 上浮 4px + 放大 1.02 倍
点击: 缩小 0.98 倍
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
// 统一右键菜单组件: src/components/common/ContextMenu.tsx
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
普通项: backgroundColor = var(--color-primary-10)
危险项: backgroundColor = var(--color-error-10)
位移: whileHover={{ x: 2 }}

// 动画
入场: 淡入 + 缩放 0.95 → 1
鼠标指针: cursor-pointer

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
- 图标浮动动画（上下 10px，3秒循环）
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
│   │   └── actionHandler.tsx       # 侧边栏动作处理
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
│   │   └── themeStore.ts           # 主题状态（含强调色）
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
│   │   └── versionFilter.ts        # 版本过滤工具
│   ├── helper/
│   │   ├── rustInvoke.ts           # Rust 调用封装
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

### 6.4 侧边栏菜单项

```typescript
type SidebarItemType = 'route' | 'action' | 'external' | 'divider' | 'header';

interface SidebarMenuItem {
  id: string;
  type: SidebarItemType;       // route=跳转, action=执行, external=外链, divider=分隔线, header=分组标题
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
- `/instance-manage` - 版本中心（原"实例管理"，管理具体游戏版本）
- `/instance-list` - 游戏实例（原"实例列表"，带独立二级侧边栏，展示游戏目录下的实例）
- `/download` - 下载
- `/download/game` - 游戏下载
- `/download/modpack` - 整合包下载
- `/game-settings` - 全局游戏设置（带独立二级侧边栏）
- `/game-settings/java` - Java 管理
- `/game-settings/general` - 通用设置
- `/game-settings/appearance` - 外观设置
- `/game-settings/download` - 下载设置
- `/settings` - 设置
- `/multiplayer` - 多人联机
- `/feedback` - 反馈
- `/hint` - 启动器说明

> **术语对照表**:
>
| 旧术语 | 新术语 | 说明 |
|--------|--------|------|
| 游戏文件夹 | **游戏目录** | 指不同的 `{base}` 路径 |
| 实例列表 | **游戏实例** | 指 `{base}/minecraft/{daemon_name}` 中的实例 |
| 实例管理 | **版本中心** | 管理具体的游戏版本，显示版本图标 |

**侧边栏菜单项** (`SidebarMenuItem`) 使用 lucide-react 图标组件（`ReactNode`），不再使用 emoji 字符串。每个菜单项包含 `titleI18nKey` 用于国际化。

**侧边栏类型系统**:

- `route` - 跳转页面（`path` 指定目标路由）
- `action` - 执行功能（`action` 回调函数）
- `external` - 打开外部链接（`url` 指定链接，使用 Tauri `openUrl`）
- `divider` - 视觉分隔线
- `header` - 分组标题（可折叠）

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

**注意**: 实例无元数据文件（instance.json），通过扫描目录自动发现。目录结构已从 `{base}/daemon/{instance_name}/.minecraft/` 改为 `{base}/minecraft/{instance_name}/versions/{version_name}/`。

***

## 10. 编码规范

### 10.1 前端 (TypeScript/React)

- 使用 **TypeScript**，开启严格模式
- 组件使用 **函数式组件** + **Hooks**
- 样式使用 **TailwindCSS**
- 动画使用 **Framer Motion**
- 路径别名: `@/*` 指向项目根目录
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
  - 前端: 驼峰命名 (camelCase)
  - 后端: 蛇形命名 (snake\_case)
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

| 组件                      | 位置      | 说明         |
| ----------------------- | ------- | ---------- |
| `ProgressBar`           | common/ | 线性进度条 ✅    |
| `CircularProgress`      | common/ | 圆形进度指示器 ✅  |
| `DownloadItem`          | common/ | 下载项组件 ✅    |
| `StatusBadge`           | common/ | 版本类型徽章 ✅   |
| `EmptyState`            | common/ | 空状态提示组件 ✅  |
| `IconButton`            | common/ | 图标按钮组件 ✅   |
| `NotificationProvider`  | common/ | 全局通知组件 ✅   |
| `TabBar`                | common/ | Tab 导航组件 ✅ |
| `SpinnerOverlay`        | common/ | 覆盖加载组件 ✅   |
| `ListItem`              | common/ | 列表项组件 ✅    |
| `VersionCard`           | common/ | 版本卡片 ✅     |
| `InstanceCard`          | common/ | 实例卡片 ✅     |
| `InstallCard`           | common/ | 安装卡片 ✅     |
| `InstanceListItem`      | common/ | 实例列表行 ✅    |
| `LoaderIcon`            | common/ | 加载器图标 ✅    |
| `VersionFilterDropdown` | common/ | 版本过滤下拉 ✅   |
| `VersionListItem`       | common/ | 版本列表行 ✅    |
| `VirtualList`           | common/ | 虚拟列表 ✅     |
| `ThemePreview`          | common/ | 主题预览组件 ✅   |

### 12.2 已提取的工具函数

| 函数/模块                 | 位置     | 说明        |
| --------------------- | ------ | --------- |
| `formatFileSize`      | utils/ | 格式化文件大小 ✅ |
| `formatDate`          | utils/ | 格式化日期 ✅   |
| `getVersionTypeLabel` | utils/ | 版本类型标签 ✅  |
| `getVersionTypeColor` | utils/ | 版本类型颜色 ✅  |
| `eventBus`            | utils/ | 事件总线 ✅    |

### 12.3 全局状态 (Zustand)

| Store               | 位置      | 说明                         |
| ------------------- | ------- | -------------------------- |
| `useAppStore`       | stores/ | 应用状态（系统信息、初始化） ✅           |
| `useNavStore`       | stores/ | 导航状态（路径、导航锁） ✅             |
| `useDownloadStore`  | stores/ | 下载状态（版本、任务、进度） ✅           |
| `useInstanceStore`  | stores/ | 实例状态（列表、搜索、视图、已知文件夹、持久化） ✅ |
| `useModloaderStore` | stores/ | 模组加载器状态 ✅                  |
| `useThemeStore`     | stores/ | 主题状态（预设、强调色、持久化） ✅         |

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
| 页面过渡         | opacity + x + scale 微变形 + cubic-bezier 缓动 | ✅  |
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

