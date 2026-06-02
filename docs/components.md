# WeCraft! Launcher - 组件文档

> **版本**: 0.1.0-alpha.2  
> **最后更新**: 2026-06-02

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 架构设计：[`architecture.md`](architecture.md) - 技术架构、目录结构
- API 文档：[`api.md`](api.md) - 后端 API 调用指南

---

## 1. 通用组件 {#common-components}

**位置**: `src/components/common/`

### 进度条 {#progress-bar}

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
}
```

**使用示例**:
```tsx
<ProgressBar progress={75} status="active" showPercentage size="md" />
```

### 圆形进度指示器 {#circular-progress}

```typescript
interface CircularProgressProps {
  progress: number;                    // 进度值 (0-100)
  size?: number;                       // 圆形大小 (默认 48)
  strokeWidth?: number;                // 描边宽度 (默认 4)
  status?: 'idle' | 'active' | 'completed' | 'error';
  showPercentage?: boolean;            // 显示百分比
}
```

### 下载项 {#download-item}

```typescript
interface DownloadItemProps {
  filename: string;                    // 文件名
  downloaded: number;                  // 已下载字节数
  total: number;                       // 总字节数
  status: 'downloading' | 'paused' | 'completed' | 'error';
  onCancel?: () => void;               // 取消回调
  showCancel?: boolean;                // 显示取消按钮
}
```

### 状态徽章 {#status-badge}

```typescript
interface StatusBadgeProps {
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | string;
  label?: string;                      // 自定义标签
  size?: 'sm' | 'md' | 'lg';           // 徽章大小
  showDot?: boolean;                   // 显示圆点
}
```

### 开关 {#toggle}

```typescript
interface ToggleProps {
  checked: boolean;                    // 开关状态
  onChange: (checked: boolean) => void; // 状态变化回调
  disabled?: boolean;                  // 禁用状态
}
```

### 空状态 {#empty-state}

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;              // 图标
  title: string;                       // 标题
  description?: string;                // 描述
  action?: React.ReactNode;            // 操作按钮
}
```

### 覆盖层 {#overlay}

```typescript
interface OverlayProps {
  active: boolean;                     // 是否激活
  children: React.ReactNode;           // 子组件
  className?: string;                  // 自定义类名
  overLayClassName?: string;           // 覆盖层类名
  disabled?: boolean;                  // 禁用状态
  zIndex?: number;                     // Z 轴层级
  fixed?: boolean;                     // 固定定位
}
```

**使用示例**:
```tsx
<Overlay active={true} zIndex={50}>
  <div>内容区域</div>
</Overlay>
```

### 转圈加载动画 {#spinner}

```typescript
interface SpinnerProps {
  visible: boolean;                    // 是否可见
  loading?: boolean;                   // 加载中状态
  children?: ReactNode;                // 子组件
  message?: string;                    // 加载提示
  progress?: number;                   // 进度值
  showProgress?: boolean;              // 显示进度条
  onCancel?: () => void;               // 取消回调
  cancelText?: string;                 // 取消按钮文字
  className?: string;                  // 自定义类名
}
```

**使用示例**:
```tsx
<Spinner 
  visible={isLoading} 
  message="加载中..."
  showProgress 
  progress={75}
/>
```

### 列表项 {#list-item}

```typescript
interface ListItemProps {
  title: string;                       // 标题
  subtitle?: string;                   // 副标题
  icon?: React.ReactNode;              // 图标
  selected?: boolean;                  // 是否选中
  onClick?: () => void;                // 点击回调
}
```

### 版本卡片 {#version-card}

```typescript
interface VersionCardProps {
  version: VersionInfo;                // 版本信息
  selected?: boolean;                  // 是否选中
  onSelect?: () => void;               // 选择回调
  onInstall?: () => void;              // 安装回调
}
```

### 实例卡片 {#instance-card}

```typescript
interface InstanceCardProps {
  instance: InstanceInfo;              // 实例信息
  onSelect?: () => void;               // 选择回调
  onManage?: () => void;               // 管理回调
}
```

### 安装卡片 {#install-card}

```typescript
interface InstallCardProps {
  version: VersionInfo;                // 版本信息
  status: 'pending' | 'installing' | 'completed' | 'error';
  progress?: number;                   // 安装进度
  onInstall?: () => void;              // 安装回调
  onCancel?: () => void;               // 取消回调
}
```

### 上下文菜单 {#context-menu}

```typescript
interface ContextMenuProps {
  items: ContextMenuItemData[];        // 菜单项
  position: { x: number; y: number };  // 菜单位置
  onClose: () => void;                 // 关闭回调
}
```

### 确认弹窗 {#confirm-popup}

```typescript
interface ConfirmPopupProps {
  isOpen: boolean;                     // 是否打开
  title: string;                       // 标题
  message: string;                     // 消息
  iconType?: 'info' | 'warning' | 'error' | 'success';
  onConfirm: () => void;               // 确认回调
  onCancel: () => void;                // 取消回调
  onClose: () => void;                 // 关闭回调
}
```

### 虚拟列表 {#virtual-list}

```typescript
interface VirtualListProps<T> {
  data: T[];                           // 数据数组
  itemHeight: number;                  // 每项高度
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;            // 容器高度
}
```

### 图标按钮 {#icon-button}

```typescript
interface IconButtonProps {
  icon: React.ReactNode;               // 图标
  onClick?: () => void;                // 点击回调
  disabled?: boolean;                  // 禁用状态
  tooltip?: string;                    // 提示文字
  variant?: 'default' | 'ghost' | 'danger';
}
```

### 版本筛选下拉框 {#version-filter-dropdown}

```typescript
export interface VersionFilterOption {
  value: VersionCategory;
  label: string;
  count?: number;
}
```

```typescript
interface VersionFilterDropdownProps {
  value: VersionCategory;
  onChange: (value: VersionCategory) => void;
  versions: GameVersion[];
  className?: string;
}
```

### 加载图标 {#loader-icon}

```typescript
interface LoaderIconProps {
  size?: number;                       // 图标大小
  color?: string;                      // 颜色
}
```

### 主题预览 {#theme-preview}

```typescript
interface ThemePreviewProps {
  theme: ThemePreset;                  // 主题预设
  selected?: boolean;                  // 是否选中
  onSelect: () => void;                // 选择回调
}
```

### 终端主题预览 {#terminal-theme-preview}

```typescript
interface TerminalThemePreviewProps {
  theme: TerminalTheme;                // 终端主题
  selected?: boolean;                  // 是否选中
  onSelect: () => void;                // 选择回调
}
```

### 通知提供者 {#notification-provider}

```typescript
interface NotificationProviderProps {
  children: React.ReactNode;           // 子组件
}
```

**使用示例**:
```tsx
const { success, error, warning, info } = useNotification();
success('操作成功', '文件已保存');
error('操作失败', '请重试');
```

### 启动游戏按钮 {#start-game-button}

```typescript
interface StartGameButtonProps {
  // 启动游戏主按钮
}
```

**特性**:
- 渐变光效扫过动画
- Hover 上浮效果
- 点击反馈动画

### Portal {#portal}

**位置**: `src/components/common/Portal.tsx`

智能 Portal — DOM 传送 + 浮动定位统一入口。提供 5 种互斥渲染模式：

| 模式 | 触发条件 | 典型场景 |
|------|----------|----------|
| **anchor** | 传入 `anchorTo` ref | 下拉菜单、工具提示 |
| **origin** | 传入 `originX` + `originY` | 右键菜单 |
| **preset** | 传入 `preset` 字符串 | 弹窗、模态框、Toast |
| **draggable** | 传入 `draggable=true` | 可拖拽浮动按钮 |
| **simple**（兜底） | 以上均不匹配 | 仅需 DOM 传送，自管理定位 |

```typescript
type PresetPosition =
  | 'center'
  | 'top' | 'bottom'
  | 'top-left' | 'top-right'
  | 'bottom-left' | 'bottom-right';

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
  floatingRef?: React.RefObject<HTMLDivElement | null>;

  // anchor 模式
  anchorTo?: React.RefObject<HTMLElement | null>;
  placement?: FloatingPlacement;           // 默认 'bottom-start'
  offset?: number;                         // 默认 4

  // origin 模式
  originX?: number;
  originY?: number;

  // preset 模式
  preset?: PresetPosition;

  // draggable 模式
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;

  // 通用
  zIndex?: number;
  collisionBoundary?: CollisionBoundary;
  avoidRefs?: (React.RefObject<HTMLElement | null> | string)[];
}
```

**定位保障（anchor / origin 模式）**：
- **L1**: 视口碰撞自调整（anchor 翻转 placement，origin 夹紧坐标）
- **L2**: 元素避开，避免与 `avoidRefs` 重叠
- **L3**: Framer Motion 弹簧动画平滑过渡

**使用示例**:
```tsx
// anchor 模式 — 锚定触发元素
<Portal anchorTo={buttonRef} placement="bottom-start" offset={4}>
  <DropdownMenu />
</Portal>

// origin 模式 — 绝对坐标
<Portal originX={mouseX} originY={mouseY} collisionBoundary={{bottom:10,right:10}}>
  <ContextMenu />
</Portal>

// preset 模式 — 预设定位
<Portal preset="center" zIndex={Z_INDEX.MODAL}>
  <ModalContent />
</Portal>

// draggable 模式 — 可拖拽
<Portal draggable defaultPosition={{x:100,y:16}} zIndex={Z_INDEX.POPUP}>
  <FloatingButton />
</Portal>

// simple 模式 — 仅传送
<Portal>
  <CustomTooltip />
</Portal>
```

**注意事项**:
- `avoidRefs` 支持 `string` key，自动从 `refRegistryStore` 查找已注册元素
- `draggable` 模式使用 Pointer Events + `setPointerCapture`，非 Framer Motion drag
- `simple` 模式不上传 `zIndex` prop，需调用方自行通过 className 控制层级

### 通用组件子目录 {#common-components-subdirectories}

**位置**: `src/components/common/`

| 子目录 | 组件 | 说明 |
|--------|------|------|
| `Badge/` | `VersionBadge.tsx`, `YesOrNoBadge.tsx`, `models.ts` | 状态标签、版本类型标识 |
| `BottomBar/` | `BottomBar.tsx` | 页面底部操作栏 |
| `ContextStack/` | `ContextStack.tsx` | 上下文状态管理组件 |
| `Instance/` | `InstallCard.tsx`, `InstanceCard.tsx`, `InstanceListItem.tsx` | 实例相关组件 |
| `Loading/` | `CircularProgress.tsx`, `LoaderIcon.tsx`, `Overlay.tsx`, `ProgressBar.tsx`, `Spinner.tsx` | 加载组件 |
| `SettingsPanel/` | `SettingPanel.tsx`, `models.ts` | 通用设置面板布局 |
| `Version/` | `VersionCard.tsx`, `VersionFilterDropdown.tsx`, `VersionListItem.tsx` | 版本相关组件 |
| `header/` | `FloatingControls.tsx` | 窗口头部悬浮控件 |
| `home/` | `PlayerProfile.tsx` | 主页玩家资料组件 |
| `navigation/` | `DynamicIsland.tsx` | 灵动岛导航组件 |
| `popup/` | `AlertPopup.tsx`, `ConfirmPopup.tsx`, `InputDialog.tsx`, `LoadingPopup.tsx`, `ProgressDialog.tsx` | 弹窗组件 |
| `settings/` | `MemorySlider.tsx`, `SettingItem.tsx`, `SettingsSection.tsx` | 设置页面组件 |
| `sidebar/` | 侧边栏相关组件 | 智能侧边栏系统（详见第 5 节） |
| `Portal.tsx` | `Portal.tsx` | 智能 Portal，5 种浮动定位模式（详见 §1 Portal） |

---

## 2. 导航组件 {#navigation-components}

**位置**: `src/components/navigation/`

### 灵动岛 {#dynamic-island}

```typescript
interface DynamicIslandProps {
  onMenuClick?: (path: string) => void;  // 菜单点击回调
}
```

**特性**:
- 悬浮式胶囊导航
- 毛玻璃背景
- hover 展开文字
- 角色切换动画
- 支持窗口拖曳

**使用示例**:
```tsx
<DynamicIsland onMenuClick={(path) => navigate(path)} />
```

---

## 3. 主页组件 {#home-components}

**位置**: `src/components/home/`

### 玩家资料 {#player-profile}

```typescript
interface PlayerProfileProps {
  name: string;                        // 玩家名称
  role?: UserRole;                     // 角色类型
}
```

**特性**:
- MC 方块人头像（SVG 绘制）
- 基于用户名哈希生成不同外观
- 瞳孔动画
- 角色徽章

**使用示例**:
```tsx
<PlayerProfile 
  name={accountName} 
  role={currentRole} 
/>
```

---

## 4. 头部组件 {#header-components}

**位置**: `src/components/header/`

### 悬浮控件 {#floating-controls}

```typescript
interface FloatingControlsProps {
  // 无 props
}
```

**特性**:
- 窗口最小化/最大化/关闭按钮
- 悬浮在右上角
- 毛玻璃背景

---

## 5. 侧边栏组件 {#sidebar-components}

**位置**: `src/components/sidebar/`

### 智能侧边栏 {#smart-sidebar}

```typescript
interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;  // 菜单点击回调
  showAllGroups?: boolean;               // 显示所有分组
  footer?: React.ReactNode;              // 底部内容
}
```

**特性**:
- 支持多角色侧边栏分组
- 智能渲染侧边栏内容
- 支持自定义底部内容

### 实例管理按钮 {#instance-manage-button}

**位置**: `src/components/sidebar/renderer/InstanceManageButton.tsx`

```typescript
interface InstanceManageButtonProps {
  // 无 props
}
```

**功能**: 在侧边栏中显示实例管理快捷按钮

### 侧边栏内容渲染器 {#sidebar-content-renderers}

**位置**: `src/components/sidebar/content/`

| 文件 | 说明 |
|------|------|
| `BaseChildrenContent.tsx` | 基础子内容渲染器 |
| `BaseSidebarContent.tsx` | 基础侧边栏内容 |
| `SidebarItemRenderer.tsx` | 侧边栏项渲染器 |

### 侧边栏分组内容 {#sidebar-group-contents}

**位置**: `src/components/sidebar/content/group/`

| 文件 | 说明 |
|------|------|
| `AccountSidebarContent.tsx` | 账户侧边栏内容 |
| `CommonSidebarContent.tsx` | 通用侧边栏内容 |
| `GameSidebarContent.tsx` | 游戏侧边栏内容 |

### 侧边栏布局 {#sidebar-layouts}

**位置**: `src/components/sidebar/layouts/`

| 文件 | 说明 |
|------|------|
| `BaseSidebarLayout.tsx` | 基础侧边栏布局 |

---

## 6. 弹窗组件 {#popup-components}

**位置**: `src/components/popup/`

### 确认弹窗 {#confirm-popup-2}

已在通用组件中说明。

### 警告弹窗 {#alert-popup}

```typescript
interface AlertPopupProps {
  isOpen: boolean;                     // 是否打开
  title: string;                       // 标题
  message: string;                     // 消息
  iconType?: 'info' | 'warning' | 'error' | 'success';
  onConfirm: () => void;               // 确认回调
  onClose: () => void;                 // 关闭回调
}
```

### 输入对话框 {#input-dialog}

```typescript
interface InputDialogProps {
  isOpen: boolean;                     // 是否打开
  title: string;                       // 标题
  value: string;                       // 输入值
  onChange: (value: string) => void;   // 输入变化回调
  onConfirm: () => void;               // 确认回调
  onCancel: () => void;                // 取消回调
  placeholder?: string;                // 占位符
}
```

### 加载弹窗 {#loading-popup}

```typescript
interface LoadingPopupProps {
  isOpen: boolean;                     // 是否打开
  message?: string;                    // 加载提示
  progress?: number;                   // 进度值
  showProgress?: boolean;              // 显示进度条
  onCancel?: () => void;               // 取消回调
}
```

### 进度对话框 {#progress-dialog}

```typescript
interface ProgressDialogProps {
  isOpen: boolean;                     // 是否打开
  title: string;                       // 标题
  message: string;                     // 消息
  progress: number;                    // 进度值 (0-100)
  canCancel?: boolean;                 // 是否可取消
  onCancel?: () => void;               // 取消回调
}
```

---

## 7. 设置组件 {#settings-components}

**位置**: `src/components/settings/`

设置页面专用组件，配合 `/settings/appearance` 路由使用。

### 内存滑块 {#memory-slider}

```typescript
interface MemorySliderProps {
  value: number;                       // 内存值 (MB)
  onChange: (value: number) => void;   // 变化回调
  min?: number;                        // 最小值
  max?: number;                        // 最大值
  step?: number;                       // 步长
  disabled?: boolean;                  // 禁用状态
}
```

### 设置项 {#setting-item}

```typescript
interface SettingItemProps {
  title: string;                       // 设置项标题
  description?: string;                // 设置项描述
  icon?: React.ReactNode;              // 图标
  children?: React.ReactNode;          // 子组件（如 Toggle、Select 等）
  onClick?: () => void;                // 点击回调
}
```

### 设置区域 {#settings-section}

```typescript
interface SettingsSectionProps {
  title: string;                       // 区域标题
  children: React.ReactNode;           // 子组件
  className?: string;                  // 自定义类名
}
```

---

## 8. 根级组件 {#root-components}

**位置**: `src/components/`

| 组件 | 文件 | 说明 |
|------|------|------|
| `FloatingDownloadButton` | `FloatingDownloadButton.tsx` | 悬浮下载按钮 |
| `Header` | `Header.tsx` | 全局头部组件 |
| `Popup` | `Popup.tsx` | 通用弹窗容器（使用 `isOpen` 属性） |
| `RouterRenderer` | `RouterRenderer.tsx` | 路由渲染器 |

**注意**: 根级组件是直接位于 `src/components/` 目录下的组件，其他组件按功能组织在子目录中。

---

## 9. 服主后台组件 {#admin-components}

**位置**: `src/pages/admin/`

### 服务器管理 {#admin-servers}

**路由**: `/admin/servers`

**功能**:
- 服务器卡片展示
- 实时状态指示
- 玩家数量进度条
- 快速操作按钮

### 数据看板 {#admin-analytics}

**路由**: `/admin/analytics`

**功能**:
- 统计卡片（总玩家、今日活跃等）
- SVG 折线图
- 服务器资源监控

### 配置上传 {#admin-upload}

**路由**: `/admin/upload`

**功能**:
- 拖拽上传区域
- 上传进度动画
- 最近上传记录

---

## 10. 组件设计原则 {#component-design-principles}

### 单一职责原则 {#single-responsibility-principle}

每个组件只负责一个功能，组件名应清晰表达其职责。

### 开闭原则 {#open-closed-principle}

对扩展开放，对修改关闭。使用 props 扩展功能，避免修改组件内部。

### 依赖倒置原则 {#dependency-inversion-principle}

依赖抽象，不依赖具体实现。使用 TypeScript interface 定义契约。

### 组合优于继承 {#composition-over-inheritance}

使用组合模式构建复杂 UI，提取可复用的子组件。

---

## 11. 组件使用最佳实践 {#component-best-practices}

### Props 命名 {#props-naming}

```typescript
// ✅ 推荐：清晰的命名
interface ButtonProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary';
}

// ❌ 不推荐：模糊的命名
interface ButtonProps {
  fn: () => void;
  bool: boolean;
  type: string;
}
```

### 默认值 {#default-values}

```typescript
// ✅ 推荐：在 interface 中提供默认值
interface Props {
  size?: 'sm' | 'md' | 'lg';  // 默认 'md'
  disabled?: boolean;          // 默认 false
}

// 在组件中
const Component = ({ size = 'md', disabled = false }: Props) => {
  // ...
};
```

### 事件处理 {#event-handling}

```typescript
// ✅ 推荐：提供完整的事件处理
interface ButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
}

// ❌ 不推荐：只有回调没有事件对象
interface ButtonProps {
  onClick?: () => void;
}
```

---

## 12. 核心 Hooks 与工具 {#core-hooks-and-utilities}

### useFloating {#use-floating}

**位置**: `src/hooks/useFloating.ts`

浮动定位引擎 hook，支持 anchor（相对元素）和 origin（绝对坐标）两种模式。

```typescript
type FloatingPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

interface CollisionBoundary {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface UseFloatingOptions {
  floatingRef: React.RefObject<HTMLElement | null>;
  anchorTo?: React.RefObject<HTMLElement | null>;
  placement?: FloatingPlacement;            // 默认 'bottom-start'
  offset?: number;                          // 默认 4
  originX?: number;
  originY?: number;
  collisionBoundary?: CollisionBoundary;
  avoidRefs?: React.RefObject<HTMLElement | null>[];
  autoFlip?: boolean;                       // 默认 true
  enabled?: boolean;                        // 默认 true
}

interface UseFloatingReturn {
  x: number;
  y: number;
  placement: FloatingPlacement;
  updatePosition: () => void;
}
```

**定位保障（按优先级）**：
1. **L1** 视口翻转（anchor 模式）：检测碰撞后自动翻转 placement
2. **L2** 元素避开：与 `avoidRefs` 重叠时沿最短位移推开
3. **L3** 弹簧动画：由调用方（Portal）驱动

**使用示例**:
```tsx
const { x, y } = useFloating({
  floatingRef,
  anchorTo: buttonRef,
  placement: 'bottom-start',
  offset: 4,
});
```

### refRegistryStore {#ref-registry-store}

**位置**: `src/stores/refRegistryStore.ts`

全局 DOM 元素注册表（Zustand），允许通过 string key 跨组件共享 DOM ref。

```typescript
// 注册元素
const register = useRegisterRef('my-key');
return <div ref={register} />;

// 读取元素
const element = useRegisteredRef('my-key');

// Portal 的 avoidRefs 支持 string key 自动查找
<Portal avoidRefs={['my-key']}>...<Portal>
```

| Hook | 用途 |
|------|------|
| `useRegisterRef(key)` | 返回 ref callback，挂载时注册、卸载时注销 |
| `useRegisteredRef(key)` | 返回已注册的 HTMLElement 或 null |

### zIndex 常量 {#z-index-constants}

**位置**: `src/utils/zIndex.ts`

统一的 z-index 层级常量表，所有浮层组件应通过此常量控制层级，禁止硬编码。

```typescript
export const Z_INDEX = {
  DROPDOWN: 100,   // 下拉菜单、工具提示
  STICKY: 200,     // 粘性定位元素
  POPUP: 500,      // 弹出面板、按钮浮层
  MODAL: 1000,     // 模态弹窗
  TOAST: 9999,     // 全局通知
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
```

---

**详细实现**: 见各组件源文件（`src/components/*/`）、Hooks（`src/hooks/*`）、工具（`src/utils/*`）
