# WeCraft! Launcher - 组件文档

> **版本**: 0.1.0-alpha.1  
> **最后更新**: 2026-05-27

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 架构设计：[`architecture.md`](architecture.md) - 技术架构、目录结构
- API 文档：[`api.md`](api.md) - 后端 API 调用指南

---

## 1. 通用组件

**位置**: `src/components/common/`

### 1.1 进度条 (ProgressBar)

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

### 1.2 圆形进度指示器 (CircularProgress)

```typescript
interface CircularProgressProps {
  progress: number;                    // 进度值 (0-100)
  size?: number;                       // 圆形大小 (默认 48)
  strokeWidth?: number;                // 描边宽度 (默认 4)
  status?: 'idle' | 'active' | 'completed' | 'error';
  showPercentage?: boolean;            // 显示百分比
}
```

### 1.3 下载项 (DownloadItem)

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

### 1.4 状态徽章 (StatusBadge)

```typescript
interface StatusBadgeProps {
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | string;
  label?: string;                      // 自定义标签
  size?: 'sm' | 'md' | 'lg';           // 徽章大小
  showDot?: boolean;                   // 显示圆点
}
```

### 1.5 开关 (Toggle)

```typescript
interface ToggleProps {
  checked: boolean;                    // 开关状态
  onChange: (checked: boolean) => void; // 状态变化回调
  disabled?: boolean;                  // 禁用状态
}
```

### 1.6 空状态 (EmptyState)

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;              // 图标
  title: string;                       // 标题
  description?: string;                // 描述
  action?: React.ReactNode;            // 操作按钮
}
```

### 1.7 加载覆盖层 (SpinnerOverlay)

```typescript
interface SpinnerOverlayProps {
  visible: boolean;                    // 是否显示
  message?: string;                    // 加载提示
  progress?: number;                   // 进度值
  showProgress?: boolean;              // 显示进度条
  onCancel?: () => void;               // 取消回调
}
```

### 1.8 列表项 (ListItem)

```typescript
interface ListItemProps {
  title: string;                       // 标题
  subtitle?: string;                   // 副标题
  icon?: React.ReactNode;              // 图标
  selected?: boolean;                  // 是否选中
  onClick?: () => void;                // 点击回调
}
```

### 1.9 版本卡片 (VersionCard)

```typescript
interface VersionCardProps {
  version: VersionInfo;                // 版本信息
  selected?: boolean;                  // 是否选中
  onSelect?: () => void;               // 选择回调
  onInstall?: () => void;              // 安装回调
}
```

### 1.10 实例卡片 (InstanceCard)

```typescript
interface InstanceCardProps {
  instance: InstanceInfo;              // 实例信息
  onSelect?: () => void;               // 选择回调
  onManage?: () => void;               // 管理回调
}
```

### 1.11 安装卡片 (InstallCard)

```typescript
interface InstallCardProps {
  version: VersionInfo;                // 版本信息
  status: 'pending' | 'installing' | 'completed' | 'error';
  progress?: number;                   // 安装进度
  onInstall?: () => void;              // 安装回调
  onCancel?: () => void;               // 取消回调
}
```

### 1.12 上下文菜单 (ContextMenu)

```typescript
interface ContextMenuProps {
  items: ContextMenuItemData[];        // 菜单项
  position: { x: number; y: number };  // 菜单位置
  onClose: () => void;                 // 关闭回调
}
```

### 1.13 确认弹窗 (ConfirmPopup)

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

### 1.14 虚拟列表 (VirtualList)

```typescript
interface VirtualListProps<T> {
  data: T[];                           // 数据数组
  itemHeight: number;                  // 每项高度
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;            // 容器高度
}
```

### 1.15 图标按钮 (IconButton)

```typescript
interface IconButtonProps {
  icon: React.ReactNode;               // 图标
  onClick?: () => void;                // 点击回调
  disabled?: boolean;                  // 禁用状态
  tooltip?: string;                    // 提示文字
  variant?: 'default' | 'ghost' | 'danger';
}
```

### 1.16 版本筛选下拉框 (VersionFilterDropdown)

```typescript
interface VersionFilterDropdownProps {
  onFilterChange: (category: VersionCategory) => void;
  selectedCategory?: VersionCategory;
}
```

### 1.17 加载图标 (LoaderIcon)

```typescript
interface LoaderIconProps {
  size?: number;                       // 图标大小
  color?: string;                      // 颜色
}
```

### 1.18 主题预览 (ThemePreview)

```typescript
interface ThemePreviewProps {
  theme: ThemePreset;                  // 主题预设
  selected?: boolean;                  // 是否选中
  onSelect: () => void;                // 选择回调
}
```

### 1.19 终端主题预览 (TerminalThemePreview)

```typescript
interface TerminalThemePreviewProps {
  theme: TerminalTheme;                // 终端主题
  selected?: boolean;                  // 是否选中
  onSelect: () => void;                // 选择回调
}
```

### 1.20 遮罩 (Mask)

```typescript
interface MaskProps {
  visible: boolean;                    // 是否显示
  onClick?: () => void;                // 点击回调
  blur?: boolean;                      // 模糊效果
}
```

### 1.21 通知提供者 (NotificationProvider)

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

### 1.22 启动游戏按钮 (StartGameButton)

```typescript
interface StartGameButtonProps {
  // 启动游戏主按钮
}
```

**特性**:
- 渐变光效扫过动画
- Hover 上浮效果
- 点击反馈动画

---

### 1.23 通用组件子目录

**位置**: `src/components/common/`

| 子目录 | 组件 | 说明 |
|--------|------|------|
| `Badge/` | 徽章组件 | 状态标签、版本类型标识 |
| `BottomBar/` | 底部栏 | 页面底部操作栏 |
| `ContextStack/` | 上下文栈 | 上下文状态管理组件 |
| `Instance/` | 实例相关组件 | InstanceCard、InstallCard 等 |
| `Loading/` | 加载组件 | SpinnerOverlay、LoaderIcon 等 |
| `SettingsPanel/` | 设置面板 | 通用设置面板布局 |
| `Version/` | 版本相关组件 | VersionCard、VersionFilterDropdown 等 |

---

## 2. 导航组件

**位置**: `src/components/navigation/`

### 2.1 灵动岛 (DynamicIsland)

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

## 3. 主页组件

**位置**: `src/components/home/`

### 3.1 玩家资料 (PlayerProfile)

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

## 4. 头部组件

**位置**: `src/components/header/`

### 4.1 悬浮控件 (FloatingControls)

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

## 5. 侧边栏组件

**位置**: `src/components/sidebar/`

### 5.1 智能侧边栏 (SmartSidebar)

```typescript
interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;  // 菜单点击回调
  showAllGroups?: boolean;               // 显示所有分组
  footer?: React.ReactNode;              // 底部内容
}
```

### 5.2 实例管理按钮 (InstanceManageButton)

```typescript
interface InstanceManageButtonProps {
  // 无 props
}
```

### 5.3 实例信息头部 (InstanceInfoHeader)

```typescript
interface InstanceInfoHeaderProps {
  // 无 props
}
```

---

## 6. 弹窗组件

**位置**: `src/components/popup/`

### 6.1 确认弹窗 (ConfirmPopup)

已在通用组件中说明。

---

## 7. 设置组件

**位置**: `src/components/settings/`

设置页面专用组件，配合 `/settings/appearance` 路由使用。

---

## 8. 根级组件

**位置**: `src/components/`

| 组件 | 文件 | 说明 |
|------|------|------|
| `FloatingDownloadButton` | `FloatingDownloadButton.tsx` | 悬浮下载按钮 |
| `Header` | `Header.tsx` | 全局头部组件 |
| `Popup` | `Popup.tsx` | 通用弹窗容器（使用 `isOpen` 属性） |
| `RouterRenderer` | `RouterRenderer.tsx` | 路由渲染器 |

---

## 9. 服主后台组件

**位置**: `src/pages/admin/`

### 7.1 服务器管理 (AdminServers)

**路由**: `/admin/servers`

**功能**:
- 服务器卡片展示
- 实时状态指示
- 玩家数量进度条
- 快速操作按钮

### 7.2 数据看板 (AdminAnalytics)

**路由**: `/admin/analytics`

**功能**:
- 统计卡片（总玩家、今日活跃等）
- SVG 折线图
- 服务器资源监控

### 7.3 配置上传 (AdminUpload)

**路由**: `/admin/upload`

**功能**:
- 拖拽上传区域
- 上传进度动画
- 最近上传记录

---

## 10. 组件设计原则

### 8.1 单一职责原则 (SRP)

每个组件只负责一个功能，组件名应清晰表达其职责。

### 8.2 开闭原则 (OCP)

对扩展开放，对修改关闭。使用 props 扩展功能，避免修改组件内部。

### 8.3 依赖倒置原则 (DIP)

依赖抽象，不依赖具体实现。使用 TypeScript interface 定义契约。

### 8.4 组合优于继承

使用组合模式构建复杂 UI，提取可复用的子组件。

---

## 11. 组件使用最佳实践

### 9.1 Props 命名

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

### 9.2 默认值

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

### 9.3 事件处理

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

**详细实现**: 见各组件源文件（`src/components/*/`）
