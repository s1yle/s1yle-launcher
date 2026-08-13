import { type LucideIcon } from "lucide-react";
import { ComponentType, ReactNode } from "react";
import { UserRole } from "@/stores/userRoleStore";

/** 侧边栏级别（主/次/从） */
export enum SidebarType {
  MAIN = 'main',
  SUB = 'sub',
  SECONDARY = 'secondary'
}

/** 页面头部配置 */
export interface HeaderConfig {
  type: SidebarType;
  title: string;
  titleI18nKey?: string;
}

/** 路由在导航中的位置 */
export enum RoutePosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  HIDDEN = 'hidden'
}

/** 布局模式 */
export enum LayoutMode {
  STANDARD = 'standard',
  FULLSCREEN = 'fullscreen',
  /** 原生头部模式（隐藏灵动岛，使用与经典模式一致的原生 AppHeader） */
  NATIVE_HEADER = 'native-header'
}

/** 侧边栏分组 */
export enum SidebarGroup {
  ACCOUNT = 'account',
  GAME = 'game',
  COMMON = 'common',
  NONE = 'none'
}

/** 侧边栏菜单项类型 */
export type SidebarItemType = 'route' | 'action' | 'external' | 'divider' | 'header';

/** 侧边栏菜单项 */
export interface SidebarMenuItem {
  id: string;
  type: SidebarItemType;
  title: string;
  titleI18nKey: string;
  icon?: ReactNode;
  path?: string;
  url?: string;
  action?: () => void;
  group: SidebarGroup;
  children?: SidebarMenuItem[];
  danger?: boolean;
  customRender?: React.ComponentType<{
    item: SidebarMenuItem;
    isActive: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    onNavigate?: (path: string) => void;
  }>;
}

/** 侧边栏自定义渲染组件的 Props 类型 */
export type SidebarCustomRender = SidebarMenuItem['customRender'];

/** 上下文菜单子项 */
export interface ContextMenuChildItem {
  id: string;
  type: 'action';
  title: string;
  titleI18nKey: string;
  icon: ReactNode;
  group: SidebarGroup;
  danger?: boolean;
}

/** 灵动岛导航项（由路由 nav 元数据派生） */
export interface NavItem {
  id: string;
  label: string;
  labelI18nKey?: string;
  icon: LucideIcon;
  path: string;
  roles: UserRole[];
  /** 导航分组 */
  group: SidebarGroup;
  /** 组内排序（默认 0） */
  order?: number;
  badge?: number;
  action?: () => void;
}

/** 灵动岛导航元数据（挂在路由上） */
export interface RouteNavMeta {
  id: string;
  label: string;
  labelI18nKey?: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** 导航分组，默认取路由 sidebarGroup */
  group?: SidebarGroup;
  /** 组内排序，默认 0 */
  order?: number;
  badge?: number;
}

/** 侧边栏菜单元数据（挂在路由上，声明该路由参与侧边栏） */
export interface RouteMenuMeta {
  /** 侧边栏项 id（默认取路由 path） */
  id?: string;
  /** 侧边栏显示的路径（默认取路由 path，用于覆盖怪异路径） */
  path?: string;
  icon?: ReactNode;
  title?: string;
  titleI18nKey?: string;
  customRender?: SidebarCustomRender;
  /** 追加在派生路由子项之后的非路由子项（分隔线/动作/右键菜单） */
  extras?: SidebarMenuItem[];
}

/** 路由配置 */
export interface RouteConfig {
  path: string;
  /** 直接挂载的页面组件（父级路由可省略，自动跳转首个子路由） */
  component?: ComponentType;
  header: HeaderConfig;
  position?: RoutePosition;
  layoutMode?: LayoutMode;
  children?: RouteConfig[];
  sidebarGroup?: SidebarGroup;
  parentPath?: string;
  autoNavigateToFirstChild?: boolean;
  needsScrollbar?: boolean;
  /** 灵动岛模式下页面是否自带侧边栏 */
  ownSidebar?: boolean;
  /** 隐藏全局下载进度条（如下载进度页本身） */
  hideGlobalDownloadBar?: boolean;
  /** 灵动岛导航元数据（存在即参与灵动岛导航） */
  nav?: RouteNavMeta;
  /** 侧边栏菜单元数据（存在即参与侧边栏菜单） */
  menu?: RouteMenuMeta;
}
