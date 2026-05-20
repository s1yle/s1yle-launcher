import {
  UserMinus,
  User,
  Settings,
  FileText,
  FolderOpen,
  List,
  Download,
  Gamepad2,
  Package,
  Monitor,
  FolderTree,
  FolderPlus,
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
  type LucideIcon,
  UserPlus,
} from 'lucide-react';
import { type LayoutMode, type RouteConfig, SidebarGroup, type SidebarMenuItem, type SidebarType } from "./models";
import InstanceManageButton from '@/components/sidebar/InstanceManageButton';
import { handleAddGameFolder, handleRefreshInstances } from './actionHandler';

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: 'account',
    type: 'header',
    title: 'Account',
    titleI18nKey: 'sidebar.group.account',
    group: SidebarGroup.ACCOUNT,
    navItem: [
      {
        id: 'account',
        label: '账户',
        labelI18nKey: 'nav.account',
        icon: User,
        path: '/account',
        roles: ['player', 'admin'],
      }
    ],
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
          },
          {
            id: 'thirdparty-account',
            type: 'action',
            title: '第三方账户',
            titleI18nKey: 'sidebar.thirdPartyAccount',
            icon: <UserPlus className="w-4 h-4" />,
            path: '/account/thirdparty',
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
    navItem: [
      {
        id: 'games',
        label: '游戏',
        labelI18nKey: 'nav.games',
        icon: Gamepad2,
        path: '/instance-list',
        roles: ['player', 'admin'],
      }
    ],
    children: [
      {
        id: 'instance-manage',
        type: 'route',
        title: '游戏管理',
        titleI18nKey: 'sidebar.instanceManage',
        icon: <FolderOpen className="w-4 h-4" />,
        path: '/instance-manage',
        group: SidebarGroup.GAME,
        customRender: InstanceManageButton,
        children: [
          {
            id: 'gm-game-settings',
            type: 'route',
            title: '游戏设置',
            titleI18nKey: 'gameManage.gameSettings',
            icon: <Settings className="w-4 h-4" />,
            path: '/instance-manage/:instanceId/game-settings',
            group: SidebarGroup.GAME
          },
          {
            id: 'gm-auto-install',
            type: 'route',
            title: '自动安装',
            titleI18nKey: 'gameManage.autoInstall',
            icon: <Sparkles className="w-4 h-4" />,
            path: '/instance-manage/:instanceId/auto-install',
            group: SidebarGroup.GAME
          },
          {
            id: 'gm-mods',
            type: 'route',
            title: '模组',
            titleI18nKey: 'gameManage.mods',
            icon: <Puzzle className="w-4 h-4" />,
            path: '/instance-manage/:instanceId/mods',
            group: SidebarGroup.GAME
          },
          {
            id: 'gm-resource-packs',
            type: 'route',
            title: '材质包',
            titleI18nKey: 'gameManage.resourcePacks',
            icon: <PackageOpen className="w-4 h-4" />,
            path: '/instance-manage/:instanceId/resource-packs',
            group: SidebarGroup.GAME
          },
          {
            id: 'gm-worlds',
            type: 'route',
            title: '世界',
            titleI18nKey: 'gameManage.worlds',
            icon: <Map className="w-4 h-4" />,
            path: '/instance-manage/:instanceId/worlds',
            group: SidebarGroup.GAME
          },
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
      {
        id: 'instance-list',
        type: 'route',
        title: '游戏列表',
        titleI18nKey: 'sidebar.instanceList',
        icon: <List className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
        children: [
          {
            id: 'game-folders',
            type: 'route',
            title: '游戏目录',
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
            title: '添加游戏目录',
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
            group: SidebarGroup.GAME,
            action: handleRefreshInstances,
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
    navItem: [
      {
        id: 'settings',
        label: '设置',
        labelI18nKey: 'nav.settings',
        icon: Settings,
        path: '/settings',
        roles: ['player', 'admin'],
      },
    ],
    children: [
      {
        id: 'settings',
        type: 'route',
        title: '设置',
        titleI18nKey: 'sidebar.settings',
        icon: <Settings className="w-4 h-4" />,
        path: '/settings',
        group: SidebarGroup.COMMON,
        children: [
          {
            id: 'settings-appearance',
            type: 'route',
            title: '外观',
            titleI18nKey: 'sidebar.appearanceSettings',
            icon: <UserPlus className="w-4 h-4" />,
            path: '/settings/appearance',
            group: SidebarGroup.COMMON,
          }
        ]
      },
      {
        id: 'hint',
        type: 'route',
        title: '启动器说明',
        titleI18nKey: 'sidebar.hint',
        icon: <FileText className="w-4 h-4" />,
        path: '/hint',
        group: SidebarGroup.COMMON
      },
    ]
  },
];
