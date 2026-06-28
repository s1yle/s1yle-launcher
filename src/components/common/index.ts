/** 进度条组件 */
export { default as ProgressBar } from './Loading/ProgressBar';
/** 进度条 Props / 状态类型 */
export type { ProgressBarProps, ProgressStatus } from './Loading/ProgressBar';

/** 下载项组件 */
export { default as DownloadItem } from './DownloadItem';
/** 下载项 Props */
export type { DownloadItemProps } from './DownloadItem';

/** 版本徽标组件 */
export { default as VersionBadge } from './Badge/VersionBadge';
/** 版本徽标 Props */
export type { VersionBadgeProps } from './Badge/VersionBadge';

/** 是/否 徽标组件 */
export { default as YesOrNoBadge } from './Badge/YesOrNoBadge';
/** 是/否 徽标 Props */
export type { YesOrNoBadgeProps } from './Badge/YesOrNoBadge';

/** 版本卡片组件 */
export { default as VersionCard } from './Version/VersionCard';
/** 版本卡片 Props */
export type { VersionCardProps } from './Version/VersionCard';

/** 实例卡片组件 */
export { default as InstanceCard } from './Instance/InstanceCard';
/** 实例卡片 Props */
export type { InstanceCardProps } from './Instance/InstanceCard';

/** 实例列表项组件 */
export { default as InstanceListItem } from './Instance/InstanceListItem';

/** 空状态占位组件 */
export { default as EmptyState } from './EmptyState';
/** 空状态 Props */
export type { EmptyStateProps } from './EmptyState';

/** 加载旋转器组件 */
export { default as Spinner } from './Loading/Spinner';
/** 加载旋转器 Props */
export type { SpinnerProps } from './Loading/Spinner';

/** 骨架屏组件（复合对象，包含 Box/Text/Circle 等子组件） */
export { default as Skeleton } from './Loading/Skeleton';

/** 遮罩层组件 */
export { default as Overlay } from './Loading/Overlay';
/** 遮罩层 Props */
export type { OverlayProps } from './Loading/Overlay';

/** 通知 Provider 及 useNotification Hook */
export {
  NotificationProvider,
  useNotification,
  getErrorMessage
} from './NotificationProvider';
/** 通知相关类型 */
export type {
  NotificationOptions,
  NotificationItem,
  NotificationType,
} from './NotificationProvider';

/** 版本筛选下拉组件 */
export { default as VersionFilterDropdown } from './Version/VersionFilterDropdown';
/** 版本筛选下拉 Props / 选项类型 */
export type { VersionFilterDropdownProps, VersionFilterOption } from './Version/VersionFilterDropdown';
/** 版本分类类型 */
export type { VersionCategory } from '../../utils/versionFilter';

/** 版本列表项组件 */
export { default as VersionListItem } from './Version/VersionListItem';
/** 版本列表项 Props */
export type { VersionListItemProps } from './Version/VersionListItem';

/** 安装卡片组件 */
export { default as InstallCard } from './Instance/InstallCard';
/** 安装卡片 Props / 状态类型 */
export type { InstallCardProps, InstallCardStatus } from './Instance/InstallCard';

/** 全局顶部进度条组件 */
export { default as GlobalLoadingBar } from './Loading/GlobalLoadingBar';
/** 加载表面组件（根据状态切换骨架屏 / 旋转器 / 进度条） */
export { default as LoadingSurface } from './Loading/LoadingSurface';
/** 加载表面 Props */
export type { LoadingSurfaceProps } from './Loading/LoadingSurface';

/** 加载器图标组件（Minecraft / Forge / Fabric 等图标） */
export { default as LoaderIcon } from './Loading/LoaderIcon';
/** 加载器图标 Props */
export type { LoaderIconProps } from './Loading/LoaderIcon';

/** 虚拟列表组件 */
export { default as VirtualList } from './VirtualList';
/** 虚拟列表 Props */
export type { VirtualListProps } from './VirtualList';

/** 图标按钮组件 */
export { default as IconButton } from './IconButton';
/** 图标按钮 Props */
export type { IconButtonProps } from './IconButton';

/** 右键菜单组件及 useContextMenu Hook */
export { default as ContextMenu, useContextMenu } from './ContextMenu';
/** 右键菜单 Props / 菜单项数据类型 */
export type { ContextMenuProps, ContextMenuItemData } from './ContextMenu';

/** 开关组件 */
export { default as Toggle } from './Toggle';
/** 开关 Props */
export type { ToggleProps } from './Toggle';

/** 终端主题预览组件 */
export { default as TerminalThemePreview } from './TerminalThemePreview';
/** 警告弹窗组件 */
export { default as AlertPopup } from './popup/AlertPopup';
/** 警告弹窗 Props */
export type { AlertPopupProps } from '@/components/common/popup/AlertPopup';

/** 确认弹窗组件 */
export { default as ConfirmPopup } from '@/components/common/popup/ConfirmPopup';
/** 确认弹窗 Props */
export type { ConfirmPopupProps } from '@/components/common/popup/ConfirmPopup';

/** 输入对话框组件 */
export { default as InputDialog } from '@/components/common/popup/InputDialog';
/** 输入对话框 Props */
export type { InputDialogProps } from '@/components/common/popup/InputDialog';

/** 加载弹窗组件 */
export { default as LoadingPopup } from '@/components/common/popup/LoadingPopup';
/** 加载弹窗 Props */
export type { LoadingPopupProps } from '@/components/common/popup/LoadingPopup';

/** 进度弹窗组件 */
export { default as ProgressDialog } from '@/components/common/popup/ProgressDialog';
/** 进度弹窗 Props */
export type { ProgressDialogProps } from '@/components/common/popup/ProgressDialog';

/** 底部状态栏组件 */
export { default as BottomBar } from '@/components/common/BottomBar/BottomBar';
/** 底部状态栏 Props */
export type { BottomBarProps } from '@/components/common/BottomBar/BottomBar';

/** 浮动窗口控制按钮组件（最小化 / 最大化 / 关闭） */
export { default as FloatingControls } from '@/components/common/header/FloatingControls'
/** 玩家资料卡片组件 */
export { default as PlayerProfile } from '@/components/common/home/PlayerProfile'

/** 灵动岛导航组件 */
export { default as DynamicIsland } from '@/components/common/navigation/DynamicIsland';
/** 灵动岛导航 Props */
export type { DynamicIslandProps } from '@/components/common/navigation/DynamicIsland';

/** 动态导航项组件 */
export { default as DynamicItem } from '@/components/common/navigation/DynamicIsland';
/** 动态导航项 Props */
export type { DynamicItemProps } from '@/components/common/navigation/DynamicIsland';

/** 内存滑块组件 */
export { default as MemorySlider } from '@/components/common/settings/MemorySlider';
/** 内存滑块 Props */
export type { MemorySliderProps } from '@/components/common/settings/MemorySlider';

/** 设置项组件 */
export { default as SettingItem } from '@/components/common/settings/SettingItem';
/** 设置项 Props */
export type { SettingItemProps } from '@/components/common/settings/SettingItem';

/** 设置区块组件 */
export { default as SettingsSection } from '@/components/common/settings/SettingsSection';
/** 设置区块 Props */
export type { SettingsSectionProps } from '@/components/common/settings/SettingsSection';

/** 列表项组件（复合组件，含 Left / Right / Title / Description / Tag） */
export { default as ListItem } from '@/components/common/settings/ListItem'
/** 列表项 Props */
export type { ListItemProps } from '@/components/common/settings/ListItem';

/** 设置面板复合组件（含 Item / Sub / Toggle / DropDown） */
export { SettingsPanel } from '@/components/common/SettingsPanel/SettingPanel';
/** 设置面板相关类型 */
export type {
  SettingsPanelProps,
  SettingsPanelItemContext,
  SettingsPanelItemProps,
  SubSettingsPanelItemProps
} from '@/components/common/SettingsPanel/models';

/** 智能侧边栏组件 */
export { default as SmartSidebar } from '@/components/common/sidebar/SmartSidebar'
/** 智能侧边栏 Props */
export type { SmartSidebarProps } from '@/components/common/sidebar/SmartSidebar';

/** 基础侧边栏内容组件 */
export { default as BaseSidebarContent } from '@/components/common/sidebar/content/BaseSidebarContent'
/** 基础侧边栏内容 Props */
export type { BaseSidebarContentProps } from '@/components/common/sidebar/content/BaseSidebarContent';

/** 基础侧边栏布局组件 */
export { default as BaseSidebarLayout } from '@/components/common/sidebar/layouts/BaseSidebarLayout'
/** 基础侧边栏布局 Props */
export type { BaseSidebarLayoutProps } from '@/components/common/sidebar/layouts/BaseSidebarLayout';

/** 账户侧边栏内容组件 */
export { default as AccountSidebarContent } from '@/components/common/sidebar/content/group/AccountSidebarContent'
/** 通用侧边栏内容组件 */
export { default as CommonSidebarContent } from '@/components/common/sidebar/content/group/CommonSidebarContent'
/** 游戏侧边栏内容组件 */
export { default as GameSidebarContent } from '@/components/common/sidebar/content/group/GameSidebarContent'

/** 启动游戏按钮组件 */
export { default as StartGameButton } from '@/components/common/StartGameButton'
/** 启动游戏按钮 Props */
export type { StartGameButtonProps } from '@/components/common/StartGameButton';

/** 智能 Portal 组件（DOM 传送 + 浮动定位） */
export { Portal } from './Portal';
/** 动画包装器组件（fade / slide / scale / accordion / stagger） */
export { Animated } from './Animated';
/** 动画包装器 Props */
export type { AnimatedProps } from './Animated';

/** 背景层组件 */
export { BackgroundLayer } from './BackgroundLayer';

/** 滑块组件 */
export { Slider } from './Slider';
/** 滑块 Props */
export type { SliderProps } from './Slider';

/** 皮肤头像组件 */
export { SkinAvatar } from './SkinAvatar';
/** 皮肤头像 Props */
export type { SkinAvatarProps } from './SkinAvatar';

/** 角色选择卡片组件 */
export { default as RoleSelectCard } from './RoleSelectCard';
/** 角色选择卡片 Props */
export type { RoleSelectCardProps } from './RoleSelectCard';

/** 滚动显现动画组件 */
export { Reveal } from './Reveal';
/** 滚动显现动画 Props */
export type { RevealProps } from './Reveal';

/** 页面容器 / 页面区块组件 */
export { Page, PageSection } from './Page';
/** 页面容器 / 页面区块 Props */
export type { PageProps, PageSectionProps } from './Page';
