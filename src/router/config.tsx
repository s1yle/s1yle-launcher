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

export interface RouteConfig {
  path: string;
  componentName: string;
  header: HeaderConfig;
  position?: RoutePosition;
  children?: RouteConfig[];
  sidebarGroup?: SidebarGroup;
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
    children: [
      {
        path: '/account/microsoft',
        componentName: 'MicrosoftAccount',
        header: { type: SidebarType.SECONDARY, title: '微软账户', titleI18nKey: 'sidebar.microsoftAccount' },
        sidebarGroup: SidebarGroup.ACCOUNT
      },
      {
        path: '/account/offline',
        componentName: 'OfflineAccount',
        header: { type: SidebarType.SECONDARY, title: '离线账户', titleI18nKey: 'sidebar.offlineAccount' },
        sidebarGroup: SidebarGroup.ACCOUNT
      },
    ]
  },
  {
    path: '/instance-manage',
    componentName: 'InstanceManage',
    header: { type: SidebarType.SUB, title: '实例管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME
  },
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: { type: SidebarType.SUB, title: '实例列表', titleI18nKey: 'sidebar.instanceList' },
    sidebarGroup: SidebarGroup.GAME
  },
  {
    path: '/download',
    componentName: 'Download',
    header: { type: SidebarType.SUB, title: '下载', titleI18nKey: 'sidebar.download' },
    sidebarGroup: SidebarGroup.GAME,
    children: [
      {
        path: '/download/game',
        componentName: 'DownloadGame',
        header: { type: SidebarType.SECONDARY, title: '游戏', titleI18nKey: 'sidebar.downloadGame' },
        sidebarGroup: SidebarGroup.GAME
      },
      {
        path: '/download/modpack',
        componentName: 'DownloadModpack',
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME
      },
    ]
  },
  {
    path: '/settings',
    componentName: 'Settings',
    header: { type: SidebarType.SUB, title: '设置', titleI18nKey: 'sidebar.settings' },
    sidebarGroup: SidebarGroup.COMMON
  },
  {
    path: '/multiplayer',
    componentName: 'Multiplayer',
    header: { type: SidebarType.SUB, title: '多人联机', titleI18nKey: 'sidebar.multiplayer' },
    sidebarGroup: SidebarGroup.COMMON
  },
  {
    path: '/feedback',
    componentName: 'Feedback',
    header: { type: SidebarType.SUB, title: '反馈与群组', titleI18nKey: 'sidebar.feedback' },
    sidebarGroup: SidebarGroup.COMMON
  },
  {
    path: '/hint',
    componentName: 'Hint',
    header: { type: SidebarType.SUB, title: '启动器说明', titleI18nKey: 'sidebar.hint' },
    sidebarGroup: SidebarGroup.COMMON
  },
];

export interface SidebarMenuItem {
  id: string;
  title: string;
  titleI18nKey: string;
  icon: ReactNode;
  path: string;
  group: SidebarGroup;
  children?: SidebarMenuItem[];
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: 'account',
    title: '账户列表',
    titleI18nKey: 'sidebar.accountList',
    icon: <User className="w-4 h-4" />,
    path: '/account',
    group: SidebarGroup.ACCOUNT,
    children: [
      {
        id: 'microsoft-account',
        title: '微软账户',
        titleI18nKey: 'sidebar.microsoftAccount',
        icon: <Monitor className="w-4 h-4" />,
        path: '/account/microsoft',
        group: SidebarGroup.ACCOUNT
      },
      {
        id: 'offline-account',
        title: '离线账户',
        titleI18nKey: 'sidebar.offlineAccount',
        icon: <UserMinus className="w-4 h-4" />,
        path: '/account/offline',
        group: SidebarGroup.ACCOUNT
      }
    ]
  },
  {
    id: 'instance-manage',
    title: '实例管理',
    titleI18nKey: 'sidebar.instanceManage',
    icon: <FolderOpen className="w-4 h-4" />,
    path: '/instance-manage',
    group: SidebarGroup.GAME
  },
  {
    id: 'instance-list',
    title: '实例列表',
    titleI18nKey: 'sidebar.instanceList',
    icon: <List className="w-4 h-4" />,
    path: '/instance-list',
    group: SidebarGroup.GAME
  },
  {
    id: 'download',
    title: '下载',
    titleI18nKey: 'sidebar.download',
    icon: <Download className="w-4 h-4" />,
    path: '/download',
    group: SidebarGroup.GAME,
    children: [
      {
        id: 'download-game',
        title: '游戏下载',
        titleI18nKey: 'sidebar.downloadGame',
        icon: <Gamepad2 className="w-4 h-4" />,
        path: '/download/game',
        group: SidebarGroup.GAME
      },
      {
        id: 'download-modpack',
        title: '整合包下载',
        titleI18nKey: 'sidebar.downloadModpack',
        icon: <Package className="w-4 h-4" />,
        path: '/download/modpack',
        group: SidebarGroup.GAME
      }
    ]
  },
  {
    id: 'settings',
    title: '设置',
    titleI18nKey: 'sidebar.settings',
    icon: <Settings className="w-4 h-4" />,
    path: '/settings',
    group: SidebarGroup.COMMON
  },
  {
    id: 'multiplayer',
    title: '多人联机',
    titleI18nKey: 'sidebar.multiplayer',
    icon: <Globe className="w-4 h-4" />,
    path: '/multiplayer',
    group: SidebarGroup.COMMON
  },
  {
    id: 'feedback',
    title: '反馈与群组',
    titleI18nKey: 'sidebar.feedback',
    icon: <MessageCircle className="w-4 h-4" />,
    path: '/feedback',
    group: SidebarGroup.COMMON
  },
  {
    id: 'hint',
    title: '启动器说明',
    titleI18nKey: 'sidebar.hint',
    icon: <FileText className="w-4 h-4" />,
    path: '/hint',
    group: SidebarGroup.COMMON
  },
];

export const getSidebarGroups = () => {
  const groups = {
    [SidebarGroup.ACCOUNT]: [] as SidebarMenuItem[],
    [SidebarGroup.GAME]: [] as SidebarMenuItem[],
    [SidebarGroup.COMMON]: [] as SidebarMenuItem[],
    [SidebarGroup.NONE]: [] as SidebarMenuItem[]
  };

  sidebarMenuItems.forEach(item => {
    groups[item.group].push(item);
  });

  return groups;
};
