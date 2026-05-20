import { ReactNode } from "react";

export enum SidebarType {
  MAIN = 'main',
  SUB = 'sub',
  SECONDARY = 'secondary'
}

export interface HeaderConfig {
  type: SidebarType;
  title: string;
  titleI18nKey?: string;
}

export enum RoutePosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  HIDDEN = 'hidden'
}

export enum LayoutMode {
  STANDARD = 'standard',
  FULLSCREEN = 'fullscreen'
}

export enum SidebarGroup {
  ACCOUNT = 'account',
  GAME = 'game',
  COMMON = 'common',
  NONE = 'none'
}

export type SidebarItemType = 'route' | 'action' | 'external' | 'divider' | 'header';

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

export interface ContextMenuChildItem {
  id: string;
  type: 'action';
  title: string;
  titleI18nKey: string;
  icon: ReactNode;
  group: SidebarGroup;
  danger?: boolean;
}

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
