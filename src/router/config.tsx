import {
  UserMinus,
  User,
  Settings,
  Globe,
  MessageCircle,
  FileText,
  FolderOpen,
  List,
  Download,
  Gamepad2,
  Package,
  Monitor,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import { type ReactNode } from 'react';

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

export enum SidebarGroup {
  ACCOUNT = 'account',
  GAME = 'game',
  COMMON = 'common',
  NONE = 'none'
}

export type SidebarItemType = 'route' | 'action' | 'external' | 'divider' | 'header';

export interface RouteConfig {
  path: string;
  componentName: string;
  header: HeaderConfig;
  position?: RoutePosition;
  children?: RouteConfig[];
  sidebarGroup?: SidebarGroup;
  parentPath?: string;
  autoNavigateToFirstChild?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    componentName: 'Home',
    header: { type: SidebarType.MAIN, title: 'Hello Minecraft! Launcher', titleI18nKey: 'header.title' },
    sidebarGroup: SidebarGroup.NONE
  },
  {
    path: '/account',
    componentName: 'AccountListWithSidebar',
    header: { type: SidebarType.SUB, title: '账户列表', titleI18nKey: 'sidebar.accountList' },
    sidebarGroup: SidebarGroup.ACCOUNT,
    parentPath: '/',
    children: [
      {
        path: '/account/microsoft',
        componentName: 'MicrosoftAccount',
        header: { type: SidebarType.SECONDARY, title: '微软账户', titleI18nKey: 'sidebar.microsoftAccount' },
        sidebarGroup: SidebarGroup.ACCOUNT,
        parentPath: '/account'
      },
      {
        path: '/account/offline',
        componentName: 'OfflineAccount',
        header: { type: SidebarType.SECONDARY, title: '离线账户', titleI18nKey: 'sidebar.offlineAccount' },
        sidebarGroup: SidebarGroup.ACCOUNT,
        parentPath: '/account'
      },
    ]
  },
  {
    path: '/instance-manage',
    componentName: 'InstanceManage',
    header: { type: SidebarType.SUB, title: '实例管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/'
  },
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: { type: SidebarType.SUB, title: '实例列表', titleI18nKey: 'sidebar.instanceList' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/'
  },
  {
    path: '/download',
    componentName: 'Download',
    header: { type: SidebarType.SUB, title: '下载', titleI18nKey: 'sidebar.download' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    children: [
      {
        path: '/download/game',
        componentName: 'DownloadGame',
        header: { type: SidebarType.SECONDARY, title: '游戏', titleI18nKey: 'sidebar.downloadGame' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/download'
      },
      {
        path: '/download/modpack',
        componentName: 'DownloadModpack',
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/download'
      },
    ]
  },
  {
    path: '/settings',
    componentName: 'Settings',
    header: { type: SidebarType.SUB, title: '设置', titleI18nKey: 'sidebar.settings' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/multiplayer',
    componentName: 'Multiplayer',
    header: { type: SidebarType.SUB, title: '多人联机', titleI18nKey: 'sidebar.multiplayer' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/feedback',
    componentName: 'Feedback',
    header: { type: SidebarType.SUB, title: '反馈与群组', titleI18nKey: 'sidebar.feedback' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/hint',
    componentName: 'Hint',
    header: { type: SidebarType.SUB, title: '启动器说明', titleI18nKey: 'sidebar.hint' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
];

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
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: 'account',
    type: 'header',
    title: 'Account',
    titleI18nKey: 'sidebar.group.account',
    group: SidebarGroup.ACCOUNT,
    children: [
      {
        id: 'account-list',
        type: 'route',
        title: '账户列表',
        titleI18nKey: 'sidebar.accountList',
        icon: <User className="w-4 h-4" />,
        path: '/account',
        group: SidebarGroup.ACCOUNT,
        children: [
          {
            id: 'microsoft-account',
            type: 'route',
            title: '微软账户',
            titleI18nKey: 'sidebar.microsoftAccount',
            icon: <Monitor className="w-4 h-4" />,
            path: '/account/microsoft',
            group: SidebarGroup.ACCOUNT
          },
          {
            id: 'offline-account',
            type: 'route',
            title: '离线账户',
            titleI18nKey: 'sidebar.offlineAccount',
            icon: <UserMinus className="w-4 h-4" />,
            path: '/account/offline',
            group: SidebarGroup.ACCOUNT
          }
        ]
      }
    ]
  },
  {
    id: 'game',
    type: 'header',
    title: 'Game',
    titleI18nKey: 'sidebar.group.game',
    group: SidebarGroup.GAME,
    children: [
      {
        id: 'launch-game',
        type: 'action',
        title: '启动游戏',
        titleI18nKey: 'sidebar.launchGame',
        icon: <Rocket className="w-4 h-4" />,
        group: SidebarGroup.GAME
      },
      {
        id: 'instance-manage',
        type: 'route',
        title: '实例管理',
        titleI18nKey: 'sidebar.instanceManage',
        icon: <FolderOpen className="w-4 h-4" />,
        path: '/instance-manage',
        group: SidebarGroup.GAME
      },
      {
        id: 'instance-list',
        type: 'route',
        title: '实例列表',
        titleI18nKey: 'sidebar.instanceList',
        icon: <List className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME
      },
      {
        id: 'download',
        type: 'route',
        title: '下载',
        titleI18nKey: 'sidebar.download',
        icon: <Download className="w-4 h-4" />,
        path: '/download',
        group: SidebarGroup.GAME,
        children: [
          {
            id: 'download-game',
            type: 'route',
            title: '游戏下载',
            titleI18nKey: 'sidebar.downloadGame',
            icon: <Gamepad2 className="w-4 h-4" />,
            path: '/download/game',
            group: SidebarGroup.GAME
          },
          {
            id: 'download-modpack',
            type: 'route',
            title: '整合包下载',
            titleI18nKey: 'sidebar.downloadModpack',
            icon: <Package className="w-4 h-4" />,
            path: '/download/modpack',
            group: SidebarGroup.GAME
          }
        ]
      }
    ]
  },
  {
    id: 'common',
    type: 'header',
    title: 'Common',
    titleI18nKey: 'sidebar.group.common',
    group: SidebarGroup.COMMON,
    children: [
      {
        id: 'settings',
        type: 'route',
        title: '设置',
        titleI18nKey: 'sidebar.settings',
        icon: <Settings className="w-4 h-4" />,
        path: '/settings',
        group: SidebarGroup.COMMON
      },
      {
        id: 'multiplayer',
        type: 'route',
        title: '多人联机',
        titleI18nKey: 'sidebar.multiplayer',
        icon: <Globe className="w-4 h-4" />,
        path: '/multiplayer',
        group: SidebarGroup.COMMON
      },
      {
        id: 'divider-1',
        type: 'divider',
        title: '',
        titleI18nKey: '',
        group: SidebarGroup.COMMON
      },
      {
        id: 'discord',
        type: 'external',
        title: 'Discord',
        titleI18nKey: 'sidebar.discord',
        icon: <ExternalLink className="w-4 h-4" />,
        url: 'https://discord.gg/',
        group: SidebarGroup.COMMON
      },
      {
        id: 'feedback',
        type: 'route',
        title: '反馈与群组',
        titleI18nKey: 'sidebar.feedback',
        icon: <MessageCircle className="w-4 h-4" />,
        path: '/feedback',
        group: SidebarGroup.COMMON
      },
      {
        id: 'hint',
        type: 'route',
        title: '启动器说明',
        titleI18nKey: 'sidebar.hint',
        icon: <FileText className="w-4 h-4" />,
        path: '/hint',
        group: SidebarGroup.COMMON
      }
    ]
  },
];

export const getSidebarGroups = (): Record<SidebarGroup, SidebarMenuItem[]> => {
  const groups: Record<string, SidebarMenuItem[]> = {
    [SidebarGroup.ACCOUNT]: [],
    [SidebarGroup.GAME]: [],
    [SidebarGroup.COMMON]: [],
    [SidebarGroup.NONE]: []
  };

  sidebarMenuItems.forEach(item => {
    groups[item.group].push(item);
  });

  return groups as Record<SidebarGroup, SidebarMenuItem[]>;
};

export const findRouteByPath = (path: string, routeList: RouteConfig[]): RouteConfig | undefined => {
  for (const route of routeList) {
    if (route.path === path) return route;
    if (route.children) {
      const found = findRouteByPath(path, route.children);
      if (found) return found;
    }
  }
  return undefined;
};

export const getParentPath = (path: string): string => {
  const route = findRouteByPath(path, routes);
  return route?.parentPath || '/';
};
