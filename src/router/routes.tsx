import { LayoutMode, RouteConfig, SidebarGroup, SidebarType } from "./models";


/** 完整路由配置列表 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    componentName: 'Home',
    header: { type: SidebarType.MAIN, title: 'WeCraft! Launcher', titleI18nKey: 'header.title' },
    sidebarGroup: SidebarGroup.NONE,
    needsScrollbar: false
  },
  {
    path: '/account',
        componentName: 'AccountList',
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
      {
        path: '/account/thirdparty',
        componentName: 'ThirdParty',
        header: { type: SidebarType.SECONDARY, title: '第三方账户', titleI18nKey: 'sidebar.thirdPartyAccount' },
        sidebarGroup: SidebarGroup.ACCOUNT,
        parentPath: '/account'
      },
    ]
  },
  {
    path: '/instance-manage/:instanceId',
    componentName: '',
    header: { type: SidebarType.SUB, title: '游戏管理', titleI18nKey: 'sidebar.instanceManage' },
    sidebarGroup: SidebarGroup.GAME,
    autoNavigateToFirstChild: true,
    parentPath: '/',
    children: [
      {
        path: '/instance-manage/:instanceId/game-settings',
        componentName: 'InstanceGameSettings',
        header: { type: SidebarType.SECONDARY, title: '游戏设置', titleI18nKey: 'gameManage.gameSettings' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/auto-install',
        componentName: 'InstanceAutoInstall',
        header: { type: SidebarType.SECONDARY, title: '自动安装', titleI18nKey: 'gameManage.autoInstall' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/mods',
        componentName: 'InstanceMods',
        header: { type: SidebarType.SECONDARY, title: '模组', titleI18nKey: 'gameManage.mods' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/resource-packs',
        componentName: 'InstanceResourcePacks',
        header: { type: SidebarType.SECONDARY, title: '材质包', titleI18nKey: 'gameManage.resourcePacks' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
      {
        path: '/instance-manage/:instanceId/worlds',
        componentName: 'InstanceWorlds',
        header: { type: SidebarType.SECONDARY, title: '世界', titleI18nKey: 'gameManage.worlds' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: { type: SidebarType.SUB, title: '游戏列表', titleI18nKey: 'sidebar.instanceList' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: false,
    children: [
      {
        path: '/instance-list/game-folder:default',
        componentName: 'DownloadGame',
        header: { type: SidebarType.SECONDARY, title: '游戏目录', titleI18nKey: 'instances.gameFolders' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
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
        path: '/download/modpack',
        componentName: 'DownloadModpack',
        header: { type: SidebarType.SECONDARY, title: '整合包', titleI18nKey: 'sidebar.downloadModpack' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/'
      },
    ]
  },
  {
    path: '/hint',
    componentName: 'Hint',
    header: { type: SidebarType.SUB, title: '启动器说明', titleI18nKey: 'sidebar.hint' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/settings',
    componentName: '',
    header: { type: SidebarType.SUB, title: '设置', titleI18nKey: 'sidebar.settings' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    children: [
      {
        path: '/settings/java',
        componentName: 'JavaSettings',
        header: { type: SidebarType.SUB, title: 'Java 管理', titleI18nKey: 'sidebar.javaSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
      },
      {
        path: '/settings/appearance',
        componentName: 'AppearanceSettings',
        header: { type: SidebarType.SUB, title: '外观', titleI18nKey: 'sidebar.appearanceSettings' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
      }
    ]
  },
  // 服主管理页面
  {
    path: '/admin/servers',
    componentName: 'AdminServers',
    header: { type: SidebarType.SUB, title: '服务器管理', titleI18nKey: 'admin.servers' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/admin/analytics',
    componentName: 'AdminAnalytics',
    header: { type: SidebarType.SUB, title: '数据看板', titleI18nKey: 'admin.analytics' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/admin/upload',
    componentName: 'AdminUpload',
    header: { type: SidebarType.SUB, title: '配置上传', titleI18nKey: 'admin.upload' },
    sidebarGroup: SidebarGroup.COMMON,
    parentPath: '/'
  },
  {
    path: '/download/game/:versionId',
    componentName: 'VersionDetailWithInstall',
    header: { type: SidebarType.SECONDARY, title: '安装游戏', titleI18nKey: 'download.install.title' },
    layoutMode: LayoutMode.FULLSCREEN,
    parentPath: '/download/game'
  },
];

