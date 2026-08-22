import { lazy } from "react";
import {
  Settings,
  FileText,
  FolderOpen,
  Gamepad2,
  Package,
  Folder,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Puzzle,
  PackageOpen,
  Map,
  FolderSearch,
  Edit3,
  Trash2,
  FileDown,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react';
import { LayoutMode, RouteConfig, SidebarGroup, SidebarType, type SidebarMenuItem } from "./models";
import { UserRole } from '@/stores/userRoleStore';
import GameManageButton from '@/components/common/sidebar/renderer/GameManageButton';
import BlockIcon from '@/components/common/BlockIcon';
import { SkinAvatar } from '@/components/common';
import { UI_BLOCK_ICONS } from '@/utils/iconFactory';
import { handleRefreshGames, handleAddGameFolder, handleSelectGameFolder } from './actionHandler';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useAccountSelectionStore } from '@/stores/accountSelectionStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useDownloadStore } from '@/stores/downloadStore';
import { refreshAll } from '@/stores/refreshStore';
import { getGameSettings, getGlobalGameSettings, scanJavaInstallations } from '@/helper/rustInvoke';
import { logger } from "@/helper/logger.ts";
import { getErrorMessage } from "@/utils/errorUtils.ts";

const blockNavIcon = (src: string) => (props: { className?: string }) => (
  <BlockIcon src={src} {...props} w={6} h={6} />
);

/** 页面组件按路由懒加载（每个路由独立 chunk） */
const Home = lazy(() => import('../pages/Home'));
const AccountDetail = lazy(() => import('../pages/AccountList/AccountDetail'));
const GameSettings = lazy(() => import('../pages/Game/GameSettings/GameSettings.tsx'));
const GameAutoInstall = lazy(() => import('../pages/Game/GameSettings/GameAutoInstall'));
const GameMods = lazy(() => import('../pages/Game/GameSettings/GameMods'));
const GameResourcePacks = lazy(() => import('../pages/Game/GameSettings/GameResourcePacks'));
const GameWorlds = lazy(() => import('../pages/Game/GameSettings/GameWorlds'));
const GameList = lazy(() => import('../pages/Game/GameList'));
const DownloadGame = lazy(() => import('../pages/Download/DownloadGame'));
const DownloadModpack = lazy(() => import('../pages/Download/DownloadModpack'));
const DownloadProgress = lazy(() => import('../pages/Download/DownloadProgress'));
const VersionDetailWithInstall = lazy(() => import('../pages/Download/VersionDetailWithInstall'));
const AppearanceSettings = lazy(() => import('../pages/Settings/AppearanceSettings'));
const GlobalGameSettings = lazy(() => import('../pages/Settings/GlobalGameSettings'));

/** 完整路由配置列表（唯一事实源，侧边栏菜单与灵动岛导航由此派生） */
export const routes: RouteConfig[] = [
  {
    path: '/loading',
    header: { type: SidebarType.MAIN, title: 'Loading', titleI18nKey: '' },
    sidebarGroup: SidebarGroup.NONE,
    needsScrollbar: false,
    layoutMode: LayoutMode.FULLSCREEN,
  },
  {
    path: '/',
    component: Home,
    loader: async () => {
      await useGameStore.getState().init();
    },
    header: { type: SidebarType.MAIN, title: 'WeCraft! Launcher', titleI18nKey: 'header.title' },
    sidebarGroup: SidebarGroup.NONE,
    needsScrollbar: false,
    nav: {
      id: 'main',
      label: '主页',
      labelI18nKey: 'nav.main',
      icon: blockNavIcon(UI_BLOCK_ICONS.home),
      roles: [UserRole.PLAYER],
      group: SidebarGroup.NONE,
      order: 0,
    },
  },
  {
    path: '/account',
    component: AccountDetail,
    loader: async () => {
      const store = useAuthStore.getState();
      if (store.accounts.length > 0) return;
      await store.loadAccounts();
    },
    header: { type: SidebarType.SUB, title: '账户列表', titleI18nKey: 'sidebar.accountList' },
    sidebarGroup: SidebarGroup.ACCOUNT,
    parentPath: '/',
    ownSidebar: true,
    nav: {
      id: 'account',
      label: '账户',
      labelI18nKey: 'nav.account',
      icon: blockNavIcon(UI_BLOCK_ICONS.account),
      roles: [UserRole.PLAYER],
      group: SidebarGroup.ACCOUNT,
    },
    menu: {
      id: 'account-list',
      icon: <BlockIcon src={UI_BLOCK_ICONS.account} />,
    },
    sidebarPlacement: 'replace',
    sidebarProvider: () => {
      const { accounts, currentAccount } = useAuthStore.getState();
      const items: SidebarMenuItem[] = accounts.map(acc => ({
        id: `account-${acc.uuid}`,
        type: 'action' as const,
        title: acc.name,
        titleI18nKey: '',
        icon: <SkinAvatar uuid={acc.uuid} size={20} />,
        active: acc.uuid === currentAccount?.uuid,
        action: () => {
          useAccountSelectionStore.getState().selectAccount(acc.uuid);
          useSidebarStore.getState().setActiveItem(`account-${acc.uuid}`);
          useAuthStore.getState().setCurrentAccount(acc.uuid).catch(() => {});
        },
        group: SidebarGroup.ACCOUNT,
      }));
      items.push({
        id: 'add-account-btn',
        type: 'action' as const,
        title: '添加账户',
        titleI18nKey: '',
        icon: <UserPlus className="w-4 h-4" />,
        action: () => useAccountSelectionStore.getState().openAddPopup(),
        group: SidebarGroup.ACCOUNT,
      });
      return items;
    },
  },
  {
    path: '/game-manage/:gameId',
    header: { type: SidebarType.SUB, title: '游戏管理', titleI18nKey: 'sidebar.gameManage' },
    sidebarGroup: SidebarGroup.GAME,
    autoNavigateToFirstChild: true,
    parentPath: '/',
    ownSidebar: true,
    layoutMode: LayoutMode.NATIVE_HEADER,
    menu: {
      id: 'game-manage',
      icon: <FolderOpen className="w-4 h-4" />,
      customRender: GameManageButton,
      extras: [
        {
          id: 'gm-browse',
          type: 'action',
          title: '浏览',
          titleI18nKey: 'gameManage.browse',
          icon: <FolderSearch className="w-4 h-4" />,
          path: '/game-manage',
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
          path: '/game-manage',
          group: SidebarGroup.GAME,
          children: [
            { id: 'ctx-script', type: 'action' as const, title: '生成启动脚本', titleI18nKey: 'gameManage.manageGenerateScript', icon: <FileText className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-rename', type: 'action' as const, title: '重命名该游戏', titleI18nKey: 'gameManage.manageRename', icon: <Edit3 className="w-4 h-4" />, group: SidebarGroup.GAME },
            { id: 'ctx-delete', type: 'action' as const, title: '删除该游戏', titleI18nKey: 'gameManage.manageDelete', icon: <Trash2 className="w-4 h-4" />, danger: true, group: SidebarGroup.GAME },
            { id: 'ctx-export', type: 'action' as const, title: '导出整合包', titleI18nKey: 'gameManage.manageExport', icon: <FileDown className="w-4 h-4" />, group: SidebarGroup.GAME },
          ]
        }
      ]
    },
    children: [
      {
        path: '/game-manage/:gameId/game-settings',
        component: GameSettings,
        loader: async (params) => {
          const game = useGameStore.getState().getGame(params.gameId ?? '');
          if (!game) return { loaded: {}, global: {} };
          const [loaded, global, javas] = await Promise.all([
            getGameSettings(game.name),
            getGlobalGameSettings(),
            scanJavaInstallations()
              .catch((e) => {
                const msg = getErrorMessage(e);
                logger.warn(`[useGameSettingsForm] 扫描 Java 失败: ${msg}`);
              }),
          ]);
          return { loaded, global, javas };
        },
        header: { type: SidebarType.SECONDARY, title: '游戏设置', titleI18nKey: 'gameManage.gameSettings' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/game-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-game-settings',
          icon: <Settings className="w-4 h-4" />,
        },
      },
      {
        path: '/game-manage/:gameId/auto-install',
        component: GameAutoInstall,
        header: { type: SidebarType.SECONDARY, title: '自动安装', titleI18nKey: 'gameManage.autoInstall' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/game-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-auto-install',
          icon: <Sparkles className="w-4 h-4" />,
        },
      },
      {
        path: '/game-manage/:gameId/mods',
        component: GameMods,
        header: { type: SidebarType.SECONDARY, title: '模组', titleI18nKey: 'gameManage.mods' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/game-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-mods',
          icon: <Puzzle className="w-4 h-4" />,
        },
      },
      {
        path: '/game-manage/:gameId/resource-packs',
        component: GameResourcePacks,
        header: { type: SidebarType.SECONDARY, title: '材质包', titleI18nKey: 'gameManage.resourcePacks' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/game-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-resource-packs',
          icon: <PackageOpen className="w-4 h-4" />,
        },
      },
      {
        path: '/game-manage/:gameId/worlds',
        component: GameWorlds,
        header: { type: SidebarType.SECONDARY, title: '世界', titleI18nKey: 'gameManage.worlds' },
        sidebarGroup: SidebarGroup.GAME,
        parentPath: '/game-list',
        ownSidebar: true,
        layoutMode: LayoutMode.NATIVE_HEADER,
        menu: {
          id: 'gm-worlds',
          icon: <BlockIcon src={UI_BLOCK_ICONS.world} />,
        },
      },
    ]
  },
  {
    path: '/game-list',
    component: GameList,
    loader: async () => {
      await useGameStore.getState().init();
      void useGameStore.getState().validateAll();
    },
    header: { type: SidebarType.SUB, title: '游戏列表', titleI18nKey: 'sidebar.gameList' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: false,
    ownSidebar: true,
    nav: {
      id: 'games',
      label: '游戏',
      labelI18nKey: 'nav.games',
      icon: blockNavIcon(UI_BLOCK_ICONS.game),
      roles: [UserRole.PLAYER],
      group: SidebarGroup.GAME,
      order: 0,
    },
    menu: {
      id: 'game-list',
      icon: <BlockIcon src={UI_BLOCK_ICONS.game} />,
      extras: [
        {
          id: 'divider-games',
          type: 'divider',
          title: '',
          titleI18nKey: '',
          group: SidebarGroup.GAME
        },
        {
          id: 'add-game-folder',
          type: 'action',
          title: '添加文件夹',
          titleI18nKey: 'games.addGameFolder',
          icon: <FolderPlus className="w-4 h-4" />,
          action: handleAddGameFolder,
          group: SidebarGroup.GAME
        },
        {
          id: 'refresh-games',
          type: 'action',
          title: '刷新',
          titleI18nKey: 'games.refresh',
          icon: <RefreshCw className="w-4 h-4" />,
          path: '/game-list',
          group: SidebarGroup.GAME,
          action: handleRefreshGames,
        },
      ]
    },
    sidebarPlacement: 'prepend',
    sidebarProvider: () => {
      const { gameFolders, gameRoot } = useGameStore.getState();
      // 保持文件夹原始顺序，不在渲染期重排（选中不应改变顺序）
      return gameFolders.map((f) => ({
        id: `game-folder:${f.path}`,
        type: 'action' as const,
        title: f.name,
        titleI18nKey: '',
        icon: <Folder className="w-4 h-4" />,
        active: f.path === gameRoot,
        action: () => {
          useSidebarStore.getState().setActiveItem(`game-folder:${f.path}`);
          handleSelectGameFolder(f.path);
        },
        group: SidebarGroup.GAME,
      }));
    },
  },
  {
    path: '/download',
    component: DownloadGame,
    loader: async () => {
      const store = useDownloadStore.getState();
      if (store.manifest) return;
      await store.loadManifest();
    },
    header: { type: SidebarType.SUB, title: '下载', titleI18nKey: 'sidebar.download' },
    sidebarGroup: SidebarGroup.GAME,
    parentPath: '/',
    autoNavigateToFirstChild: true,
    ownSidebar: true,
    nav: {
      id: 'download',
      label: '下载',
      labelI18nKey: 'nav.download',
      icon: blockNavIcon(UI_BLOCK_ICONS.download),
      roles: [UserRole.PLAYER],
      group: SidebarGroup.GAME,
      order: 4,
    },
    menu: {
      id: 'download',
      icon: <BlockIcon src={UI_BLOCK_ICONS.download} />,
    },
    children: [
      {
        path: '/download/game',
        component: DownloadGame,
        loader: async () => {
          const store = useDownloadStore.getState();
          if (store.manifest) return;
          await store.loadManifest();
        },
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
      icon: blockNavIcon(UI_BLOCK_ICONS.settings),
      roles: [UserRole.PLAYER],
      group: SidebarGroup.COMMON,
    },
    menu: {
      id: 'settings',
      icon: <BlockIcon src={UI_BLOCK_ICONS.settings} />,
    },
    children: [
      {
        path: '/settings/game',
        component: GlobalGameSettings,
        loader: async () => {
          const [loaded, javas] = await Promise.all([
            getGlobalGameSettings(),
            scanJavaInstallations()
              .catch((e) => {
                const msg = getErrorMessage(e);
                logger.warn(`[useGameSettingsForm] 扫描 Java 失败: ${msg}`);
              }),
          ]);
          return { loaded, javas };
        },
        header: { type: SidebarType.SUB, title: '全局游戏设置', titleI18nKey: 'gameSettings.title' },
        sidebarGroup: SidebarGroup.COMMON,
        parentPath: '/',
        ownSidebar: true,
        menu: {
          id: 'settings-game',
          icon: <SlidersHorizontal className="w-5 h-4" />,
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
    path: '/download/game/:versionId',
    component: VersionDetailWithInstall,
    header: { type: SidebarType.SECONDARY, title: '安装游戏', titleI18nKey: 'download.install.title' },
    layoutMode: LayoutMode.NATIVE_HEADER,
    parentPath: '/download/game'
  },
  {
    path: '/download/progress',
    component: DownloadProgress,
    loader: refreshAll,
    header: { type: SidebarType.SECONDARY, title: '下载进度', titleI18nKey: 'download.progressTitle' },
    layoutMode: LayoutMode.FULLSCREEN,
    parentPath: '/download',
    hideGlobalDownloadBar: true,
  },
];
