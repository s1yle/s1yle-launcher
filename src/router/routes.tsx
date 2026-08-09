import { lazy } from "react";
import { LayoutMode, RouteConfig, SidebarGroup, SidebarType } from "./models";

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

/** 完整路由配置列表 */
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
    needsScrollbar: false
  },
  {
    path: '/account',
    component: AccountDetail,
    header: { type: SidebarType.SUB, title: '账户列表', titleI18nKey: 'sidebar.accountList' },
    sidebarGroup: SidebarGroup.ACCOUNT,
    parentPath: '/',
  },
  {
    path: '/instance-manage/:instanceId',
    header: { type: SidebarType.SUB, title: '游戏管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME,
    autoNavigateToFirstChild: true,
    parentPath: '/',
    children: [
      {
        path: '/instance-manage/:instanceId/game-settings',
        component: InstanceGameSettings,
        header: { type: SidebarType.SECONDARY, title: '游戏设置', titleI18nKey: 'gameManage.gameSettings' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/auto-install',
        component: InstanceAutoInstall,
        header: { type: SidebarType.SECONDARY, title: '自动安装', titleI18nKey: 'gameManage.autoInstall' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/mods',
        component: InstanceMods,
        header: { type: SidebarType.SECONDARY, title: '模组', titleI18nKey: 'gameManage.mods' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/resource-packs',
        component: InstanceResourcePacks,
        header: { type: SidebarType.SECONDARY, title: '材质包', titleI18nKey: 'gameManage.resourcePacks' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/worlds',
        component: InstanceWorlds,
        header: { type: SidebarType.SECONDARY, title: '世界', titleI18nKey: 'gameManage.worlds' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
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
    children: [
      {
        path: '/instance-list/game-folder:default',
        component: DownloadGame,
        header: { type: SidebarType.SECONDARY, title: '游戏目录', titleI18nKey: 'instances.gameFolders' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
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
    children: [
      {
        path: '/download/game',
        component: DownloadGame,
        header: { type: SidebarType.SECONDARY, title: '游戏', titleI18nKey: 'sidebar.downloadGame' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/download/modpack',
        component: DownloadModpack,
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
  {
    path: '/hint',
    component: Hint,
    header: { type: SidebarType.SUB, title: '启动器说明', titleI18nKey: 'sidebar.hint' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/settings',
    header: { type: SidebarType.SUB, title: '设置', titleI18nKey: 'sidebar.settings' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    children: [
      {
        path: '/settings/java',
        component: JavaSettings,
        header: { type: SidebarType.SUB, title: 'Java 管理', titleI18nKey: 'sidebar.javaSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
      },
      {
        path: '/settings/appearance',
        component: AppearanceSettings,
        header: { type: SidebarType.SUB, title: '外观', titleI18nKey: 'sidebar.appearanceSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
      }
    ]
  },
  // 服主管理页面
  {
    path: '/admin/servers',
    component: AdminServers,
    header: { type: SidebarType.SUB, title: '服务器管理', titleI18nKey: 'admin.servers' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/admin/analytics',
    component: AdminAnalytics,
    header: { type: SidebarType.SUB, title: '数据看板', titleI18nKey: 'admin.analytics' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/admin/upload',
    component: AdminUpload,
    header: { type: SidebarType.SUB, title: '配置上传', titleI18nKey: 'admin.upload' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/download/game/:versionId',
    component: VersionDetailWithInstall,
    header: { type: SidebarType.SECONDARY, title: '安装游戏', titleI18nKey: 'download.install.title' },
    layoutMode: LayoutMode.FULLSCREEN,
    parentPath: '/download/game'
  },
  {
    path: '/download/progress',
    component: DownloadProgress,
    header: { type: SidebarType.SECONDARY, title: '下载进度', titleI18nKey: 'download.progressTitle' },
    layoutMode: LayoutMode.FULLSCREEN,
    parentPath: '/download'
  },
];