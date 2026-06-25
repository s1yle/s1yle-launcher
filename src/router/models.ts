import { NavItem } from "@/config/navigationConfig";
import { ReactNode } from "react";


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
  FULLSCREEN = 'fullscreen'
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
  navItem?: NavItem[];
  customRender?: React.ComponentType<{
    item: SidebarMenuItem;
    isActive: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    onNavigate?: (path: string) => void;
  }>;
}

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

/** 路由配置 */
export interface RouteConfig {
  path: string;
  componentName: string;
  header: HeaderConfig;
  position?: RoutePosition;
  layoutMode?: LayoutMode;
  children?: RouteConfig[];
  sidebarGroup?: SidebarGroup;
  parentPath?: string;
  autoNavigateToFirstChild?: boolean;
  needsScrollbar?: boolean;
}
