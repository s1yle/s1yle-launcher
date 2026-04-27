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
  ExternalLink,
  FolderTree,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { type ReactNode } from 'react';
import usehAction, { handleAddGameFolder } from './actionHandler';

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
  // 账号 account
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
  // 实例管理
  {
    path: '/instance-manage',
    componentName: 'InstanceManage',
    header: { type: SidebarType.SUB, title: '实例管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/'
  },
  // 实例列表
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: { type: SidebarType.SUB, title: '实例列表', titleI18nKey: 'sidebar.instanceList' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: false,
    children: [
      {
        path: '/instance-list/game-folder:default',
        componentName: 'DownloadGame',
        header: { type: SidebarType.SECONDARY, title: '游戏文件夹', titleI18nKey: 'instances.gameFolders' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
  // 下载 download
  {
    path: '/download',
    componentName: 'DownloadGame',
    header: { type: SidebarType.SUB, title: '下载', titleI18nKey: 'sidebar.download' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    children: [
      {
        path: '/download/game',
        componentName: 'DownloadGame',
        header: { type: SidebarType.SECONDARY, title: '游戏', titleI18nKey: 'sidebar.downloadGame' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/download/game/:versionId',
        componentName: 'VersionInstall',
        header: { type: SidebarType.SECONDARY, title: '安装新游戏', titleI18nKey: 'download.install.title' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/download/modpack',
        componentName: 'DownloadModpack',
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
  {
    path: '/game-settings',
    componentName: 'GameSettingsJava',
    header: { type: SidebarType.SUB, title: '全局游戏设置', titleI18nKey: 'gameSettings.title' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    children: [
      {
        path: '/game-settings/java', componentName: 'GameSettingsJava',
        header: { type: SidebarType.SECONDARY, title: 'Java 管理', titleI18nKey: 'gameSettings.java' },
        sidebarGroup: SidebarGroup.COMMON, parentPath: '/'
      },
      {
        path: '/game-settings/general', componentName: 'GameSettingsGeneral',
        header: { type: SidebarType.SECONDARY, title: '通用', titleI18nKey: 'gameSettings.general' },
        sidebarGroup: SidebarGroup.COMMON, parentPath: '/'
      },
      {
        path: '/game-settings/appearance', componentName: 'GameSettingsAppearance',
        header: { type: SidebarType.SECONDARY, title: '外观', titleI18nKey: 'gameSettings.appearance' },
        sidebarGroup: SidebarGroup.COMMON, parentPath: '/'
      },
      {
        path: '/game-settings/download', componentName: 'GameSettingsDownload',
        header: { type: SidebarType.SECONDARY, title: '下载', titleI18nKey: 'gameSettings.download' },
        sidebarGroup: SidebarGroup.COMMON, parentPath: '/'
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
            type: 'action',
            title: '微软账户',
            titleI18nKey: 'sidebar.microsoftAccount',
            icon: <Monitor className="w-4 h-4" />,
            path: '/account/microsoft',
            group: SidebarGroup.ACCOUNT
          },
          {
            id: 'offline-account',
            type: 'action',
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
        group: SidebarGroup.GAME,
        children: [
          {
            id: 'game-folders',
            type: 'route',
            title: '游戏文件夹',
            titleI18nKey: 'instances.gameFolders',
            icon: <FolderTree className="w-4 h-4" />,
            path: '/instance-list',
            group: SidebarGroup.GAME
          },
          {
            id: 'divider-instances',
            type: 'divider',
            title: '',
            titleI18nKey: '',
            group: SidebarGroup.GAME
          },
          {
            id: 'add-game-folder',
            type: 'action',
            title: '添加游戏文件夹',
            titleI18nKey: 'instances.addGameFolder',
            icon: <FolderPlus className="w-4 h-4" />,
            path: '/instance-list',
            group: SidebarGroup.GAME,
            action: handleAddGameFolder,
          },
          {
            id: 'install-modpack',
            type: 'action',
            title: '导入整合包',
            titleI18nKey: 'instances.installModpack',
            icon: <Package className="w-4 h-4" />,
            path: '/instance-list',
            group: SidebarGroup.GAME
          },
          {
            id: 'refresh-instances',
            type: 'action',
            title: '刷新',
            titleI18nKey: 'instances.refresh',
            icon: <RefreshCw className="w-4 h-4" />,
            path: '/instance-list',
            group: SidebarGroup.GAME
          },
        ]
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
        id: 'game-settings',
        type: 'route',
        title: '全局游戏设置',
        titleI18nKey: 'gameSettings.title',
        icon: <Settings className="w-4 h-4" />,
        path: '/game-settings',
        group: SidebarGroup.COMMON,
        children: [
          {
            id: 'gs-java',
            type: 'route',
            title: 'Java 管理',
            titleI18nKey: 'gameSettings.java',
            icon: <Settings className="w-4 h-4" />,
            path: '/game-settings/java',
            group: SidebarGroup.COMMON
          },
          {
            id: 'gs-general',
            type: 'route',
            title: '通用',
            titleI18nKey: 'gameSettings.general',
            icon: <Settings className="w-4 h-4" />,
            path: '/game-settings/general',
            group: SidebarGroup.COMMON
          },
          {
            id: 'gs-appearance',
            type: 'route',
            title: '外观',
            titleI18nKey: 'gameSettings.appearance',
            icon: <Settings className="w-4 h-4" />,
            path: '/game-settings/appearance',
            group: SidebarGroup.COMMON
          },
          {
            id: 'gs-download',
            type: 'route',
            title: '下载',
            titleI18nKey: 'gameSettings.download',
            icon: <Settings className="w-4 h-4" />,
            path: '/game-settings/download',
            group: SidebarGroup.COMMON
          }
        ]
      },
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
        url: 'https://discord.gg/s1yle-launcher',
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
