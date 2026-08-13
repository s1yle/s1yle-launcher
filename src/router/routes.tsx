import { lazy } from "react";
import {
  User,
  Settings,
  FileText,
  FolderOpen,
  List,
  Download,
  Gamepad2,
  Package,
  FolderTree,
  RefreshCw,
  Sparkles,
  Puzzle,
  PackageOpen,
  Map,
  FolderSearch,
  Edit3,
  Copy,
  Trash2,
  FileDown,
  UserPlus,
  Server,
  BarChart3,
  Home as HomeIcon,
  Upload,
} from 'lucide-react';
import { LayoutMode, RouteConfig, SidebarGroup, SidebarType } from "./models";
import { UserRole } from '@/stores/userRoleStore';
import InstanceManageButton from '@/components/common/sidebar/renderer/InstanceManageButton';
import { handleRefreshInstances } from './actionHandler';

/** 页面组件按路由懒加载（每个路由独立 chunk） */
const Loading = lazy(() => import('../pages/Loading'));
const Home = lazy(() => import('../pages/Home'));
const AccountDetail = lazy(() => import('../pages/AccountList/AccountDetail'));
const InstanceGameSettings = lazy(() => import('../pages/Instance/InstanceSettings/InstanceGameSettings'));
const InstanceAutoInstall = lazy(() => import('../pages/Instance/InstanceSettings/InstanceAutoInstall'));
const InstanceMods = lazy(() => import('../pages/Instance/InstanceSettings/InstanceMods'));
const InstanceResourcePacks = lazy(() => import('../pages/Instance/InstanceSettings/InstanceResourcePacks'));
const InstanceWorlds = lazy(() => import('../pages/Instance/InstanceSettings/InstanceWorlds'));
const InstanceList = lazy(() => import('../pages/Instance/InstanceList'));
const DownloadGame = lazy(() => import('../pages/Download/DownloadGame'));
const DownloadModpack = lazy(() => import('../pages/Download/DownloadModpack'));
const DownloadProgress = lazy(() => import('../pages/Download/DownloadProgress'));
const VersionDetailWithInstall = lazy(() => import('../pages/Download/VersionDetailWithInstall'));
const Hint = lazy(() => import('../pages/Feedback/Hint'));
const JavaSettings = lazy(() => import('../pages/Settings/JavaSettings.tsx'));
const AppearanceSettings = lazy(() => import('../pages/Settings/AppearanceSettings'));
const AdminServers = lazy(() => import('../pages/admin/AdminServers'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminUpload = lazy(() => import('../pages/admin/AdminUpload'));

/** 完整路由配置列表（唯一事实源，侧边栏菜单与灵动岛导航由此派生） */
export const routes: RouteConfig[] = [
  {
    path: '/loading',
    component: Loading,
    header: { type: SidebarType.MAIN, title: 'Loading', titleI18nKey: '' },
    sidebarGroup: SidebarGroup.NONE,
    needsScrollbar: false,
    layoutMode: LayoutMode.FULLSCREEN,
  },
  {
    path: '/',
    component: Home,
    header: { type: SidebarType.MAIN, title: 'WeCraft! Launcher', titleI18nKey: 'header.title' },
    sidebarGroup: SidebarGroup.NONE,
    needsScrollbar: false,
    nav: {
      id: 'main',
      label: '主页',
      labelI18nKey: 'nav.main',
      icon: HomeIcon,
      roles: [UserRole.PLAYER, UserRole.ADMIN],
      group: SidebarGroup.NONE,
      order: 0,
    },
  },
  {
    path: '/account',
    component: AccountDetail,
    header: { type: SidebarType.SUB, title: '账户列表', titleI18nKey: 'sidebar.accountList' },
    sidebarGroup: SidebarGroup.ACCOUNT,
    parentPath: '/',
    ownSidebar: true,
    nav: {
      id: 'account',
      label: '账户',
      labelI18nKey: 'nav.account',
      icon: User,
      roles: [UserRole.PLAYER],
      group: SidebarGroup.ACCOUNT,
    },
    menu: {
      id: 'account-list',
      icon: <User className="w-4 h-4" />,
    },
  },
  {
    path: '/instance-manage/:instanceId',
    header: { type: SidebarType.SUB, title: '游戏管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME,
    autoNavigateToFirstChild: true,
    parentPath: '/',
    ownSidebar: true,
    layoutMode: LayoutMode.NATIVE_HEADER,
    menu: {
      id: 'instance-manage',
      icon: <FolderOpen className="w-4 h-4" />,
      customRender: InstanceManageButton,
      extras: [
        {
          id: 'gm-browse',
          type: 'action',
          title: '浏览',
          titleI18nKey: 'gameManage.browse',
          icon: <FolderSearch className="w-4 h-4" />,
          path: '/instance-manage',
          group: SidebarGroup.GAME,
          children: [
            { id: 'ctx-version', type: 'action' as const, title: '版本目录', titleI18nKey: 'gameManage.browseVersionDir', icon: <FolderOpen className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-mods', type: 'action' as const, title: '模组文件夹', titleI18nKey: 'gameManage.browseModsDir', icon: <Puzzle className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-resourcepacks', type: 'action' as const, title: '材质包文件夹', titleI18nKey: 'gameManage.browseResourcePacksDir', icon: <PackageOpen className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-saves', type: 'action' as const, title: '世界文件夹', titleI18nKey: 'gameManage.browseSavesDir', icon: <Map className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-shaders', type: 'action' as const, title: '光影文件夹', titleI18nKey: 'gameManage.browseShadersDir', icon: <FolderSearch className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-screenshots', type: 'action' as const, title: '截图文件夹', titleI18nKey: 'gameManage.browseScreenshotsDir', icon: <FolderSearch className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-config', type: 'action' as const, title: '配置文件夹', titleI18nKey: 'gameManage.browseConfigDir', icon: <FolderSearch className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-logs', type: 'action' as const, title: '日志文件夹', titleI18nKey: 'gameManage.browseLogsDir', icon: <FolderSearch className="w-4 h-4" />, group: SidebarGroup.GAME },
          ]
        },
        {
          id: 'gm-manage',
          type: 'action',
          title: '管理',
          titleI18nKey: 'gameManage.manage',
          icon: <Settings className="w-4 h-4" />,
          path: '/instance-manage',
          group: SidebarGroup.GAME,
          children: [
            { id: 'ctx-script', type: 'action' as const, title: '生成启动脚本', titleI18nKey: 'gameManage.manageGenerateScript', icon: <FileText className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-rename', type: 'action' as const, title: '重命名该实例', titleI18nKey: 'gameManage.manageRename', icon: <Edit3 className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-copy', type: 'action' as const, title: '复制游戏实例', titleI18nKey: 'gameManage.manageCopy', icon: <Copy className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-delete', type: 'action' as const, title: '删除该实例', titleI18nKey: 'gameManage.manageDelete', icon: <Trash2 className="w-4 h-4" />, danger: true, group: SidebarGroup.GAME },
            { id: 'ctx-export', type: 'action' as const, title: '导出整合包', titleI18nKey: 'gameManage.manageExport', icon: <FileDown className="w-4 h-4" />, group: SidebarGroup.GAME },
          ]
        }
      ]
    },
    children: [
      {
        path: '/instance-manage/:instanceId/game-settings',
        component: InstanceGameSettings,
        header: { type: SidebarType.SECONDARY, title: '游戏设置', titleI18nKey: 'gameManage.gameSettings' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/instance-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-game-settings',
          icon: <Settings className="w-4 h-4" />,
        },
      },
      {
        path: '/instance-manage/:instanceId/auto-install',
        component: InstanceAutoInstall,
        header: { type: SidebarType.SECONDARY, title: '自动安装', titleI18nKey: 'gameManage.autoInstall' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/instance-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-auto-install',
          icon: <Sparkles className="w-4 h-4" />,
        },
      },
      {
        path: '/instance-manage/:instanceId/mods',
        component: InstanceMods,
        header: { type: SidebarType.SECONDARY, title: '模组', titleI18nKey: 'gameManage.mods' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/instance-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-mods',
          icon: <Puzzle className="w-4 h-4" />,
        },
      },
      {
        path: '/instance-manage/:instanceId/resource-packs',
        component: InstanceResourcePacks,
        header: { type: SidebarType.SECONDARY, title: '材质包', titleI18nKey: 'gameManage.resourcePacks' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/instance-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-resource-packs',
          icon: <PackageOpen className="w-4 h-4" />,
        },
      },
      {
        path: '/instance-manage/:instanceId/worlds',
        component: InstanceWorlds,
        header: { type: SidebarType.SECONDARY, title: '世界', titleI18nKey: 'gameManage.worlds' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/instance-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-worlds',
          icon: <Map className="w-4 h-4" />,
        },
      },
    ]
  },
  {
    path: '/instance-list',
    component: InstanceList,
    header: { type: SidebarType.SUB, title: '游戏列表', titleI18nKey: 'sidebar.instanceList' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: false,
    ownSidebar: true,
    nav: {
      id: 'games',
      label: '游戏',
      labelI18nKey: 'nav.games',
      icon: Gamepad2,
      roles: [UserRole.PLAYER, UserRole.ADMIN],
      group: SidebarGroup.GAME,
      order: 0,
    },
    menu: {
      id: 'instance-list',
      icon: <List className="w-4 h-4" />,
      extras: [
        {
          id: 'divider-instances',
          type: 'divider',
          title: '',
          titleI18nKey: '',
          group: SidebarGroup.GAME
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
          group: SidebarGroup.GAME,
          action: handleRefreshInstances,
        },
      ]
    },
    children: [
      {
        path: '/instance-list/game-folder:default',
        component: DownloadGame,
        header: { type: SidebarType.SECONDARY, title: '游戏目录', titleI18nKey: 'instances.gameFolders' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'game-folders',
          path: '/instance-list',
          icon: <FolderTree className="w-4 h-4" />,
        },
      },
    ]
  },
  {
    path: '/download',
    component: DownloadGame,
    header: { type: SidebarType.SUB, title: '下载', titleI18nKey: 'sidebar.download' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    ownSidebar: true,
    nav: {
      id: 'download',
      label: '下载',
      labelI18nKey: 'nav.download',
      icon: Download,
      roles: [UserRole.PLAYER],
      group: SidebarGroup.GAME,
      order: 4,
    },
    menu: {
      id: 'download',
      icon: <Download className="w-4 h-4" />,
    },
    children: [
      {
        path: '/download/game',
        component: DownloadGame,
        header: { type: SidebarType.SECONDARY, title: '游戏', titleI18nKey: 'sidebar.downloadGame' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'download-game',
          icon: <Gamepad2 className="w-4 h-4" />,
        },
      },
      {
        path: '/download/modpack',
        component: DownloadModpack,
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'download-modpack',
          icon: <Package className="w-4 h-4" />,
        },
      },
    ]
  },
  {
    path: '/settings',
    header: { type: SidebarType.SUB, title: '设置', titleI18nKey: 'sidebar.settings' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    ownSidebar: true,
    nav: {
      id: 'settings',
      label: '设置',
      labelI18nKey: 'nav.settings',
      icon: Settings,
      roles: [UserRole.PLAYER, UserRole.ADMIN],
      group: SidebarGroup.COMMON,
    },
    menu: {
      id: 'settings',
      icon: <Settings className="w-4 h-4" />,
    },
    children: [
      {
        path: '/settings/java',
        component: JavaSettings,
        header: { type: SidebarType.SUB, title: 'Java 管理', titleI18nKey: 'sidebar.javaSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'settings-java',
          icon: <PackageOpen className="w-4 h-4" />,
        },
      },
      {
        path: '/settings/appearance',
        component: AppearanceSettings,
        header: { type: SidebarType.SUB, title: '外观', titleI18nKey: 'sidebar.appearanceSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'settings-appearance',
          icon: <UserPlus className="w-4 h-4" />,
        },
      }
    ]
  },
  {
    path: '/hint',
    component: Hint,
    header: { type: SidebarType.SUB, title: '启动器说明', titleI18nKey: 'sidebar.hint' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    menu: {
      id: 'hint',
      icon: <FileText className="w-4 h-4" />,
    },
  },
  // 服主管理页面
  {
    path: '/admin/servers',
    component: AdminServers,
    header: { type: SidebarType.SUB, title: '服务器管理', titleI18nKey: 'admin.servers' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    nav: {
      id: 'servers',
      label: '服务器管理',
      labelI18nKey: 'nav.serverManage',
      icon: Server,
      roles: [UserRole.ADMIN],
      group: SidebarGroup.GAME,
      order: 1,
    },
  },
  {
    path: '/admin/analytics',
    component: AdminAnalytics,
    header: { type: SidebarType.SUB, title: '数据看板', titleI18nKey: 'admin.analytics' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    nav: {
      id: 'analytics',
      label: '数据分析',
      labelI18nKey: 'nav.analytics',
      icon: BarChart3,
      roles: [UserRole.ADMIN],
      group: SidebarGroup.GAME,
      order: 2,
      badge: 0,
    },
  },
  {
    path: '/admin/upload',
    component: AdminUpload,
    header: { type: SidebarType.SUB, title: '配置上传', titleI18nKey: 'admin.upload' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    nav: {
      id: 'upload-config',
      label: '配置上传',
      labelI18nKey: 'nav.uploadConfig',
      icon: Upload,
      roles: [UserRole.ADMIN],
      group: SidebarGroup.GAME,
      order: 3,
    },
  },
  {
    path: '/download/game/:versionId',
    component: VersionDetailWithInstall,
    header: { type: SidebarType.SECONDARY, title: '安装游戏', titleI18nKey: 'download.install.title' },
    layoutMode: LayoutMode.NATIVE_HEADER,
    parentPath: '/download/game'
  },
  {
    path: '/download/progress',
    component: DownloadProgress,
    header: { type: SidebarType.SECONDARY, title: '下载进度', titleI18nKey: 'download.progressTitle' },
    layoutMode: LayoutMode.FULLSCREEN,
    parentPath: '/download',
    hideGlobalDownloadBar: true,
  },
];
