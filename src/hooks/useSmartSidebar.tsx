import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserCheck, Trash2 } from 'lucide-react';
import {
  getSidebarGroups, routes, sidebarMenuItems,
  type SidebarMenuItem, type RouteConfig, findRouteByPath, SidebarGroup, autoJumpToFirstChild,
} from '@/router/config';
import { logger } from '@/helper/logger';
import { openUrl } from '@/helper/rustInvoke';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useNavStore } from '@/stores/navStore';
import { useAccountSelectionStore } from '@/stores/accountSelectionStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { getErrorMessage } from '@/utils/errorUtils';
import { useNotification, type ContextMenuItemData } from '@/components/common';
import { confirm } from '@tauri-apps/plugin-dialog';

interface UseSmartSidebarOptions {
  onMenuClick: (path: string) => void;
  ownSidebar: boolean;
}

interface UseSmartSidebarReturn {
  sidebarItems: SidebarMenuItem[];
  currentMenuItem: SidebarMenuItem | undefined;
  parentMenuItem: SidebarMenuItem | undefined;
  isAccountPage: boolean;
  isActive: (path: string) => boolean;
  isParentActive: (itemPath: string) => boolean;
  hasChildrenItems: (item: SidebarMenuItem) => boolean;
  handleItemClick: (item: SidebarMenuItem) => void;
  handleContextMenuAction: (parentId: string, actionId: string) => void;
  contextMenuFor: (itemId: string) => ContextMenuItemData[] | undefined;
  handleCustomContextAction: (itemId: string, actionId: string) => Promise<void>;
}

function findMenuItemsByPath(path: string): { current: SidebarMenuItem | undefined; parent: SidebarMenuItem | undefined } {
  let foundParent: SidebarMenuItem | undefined = undefined;
  const findInItems = (items: SidebarMenuItem[], parent?: SidebarMenuItem): SidebarMenuItem | undefined => {
    for (const item of items) {
      const normalizedItemPath = item.path?.replace(/:gameId/g, '[^/]+');
      const pathRegex = new RegExp(`^${normalizedItemPath}$`);
      if (item.path === path || pathRegex.test(path)) {
        foundParent = parent;
        return item;
      }
      if (item.children) {
        const found = findInItems(item.children, item);
        if (found) return found;
      }
    }
    return undefined;
  };
  const current = findInItems(sidebarMenuItems);
  return { current, parent: foundParent };
}

/** 根据 pathname 找到匹配的路由配置（支持动态参数） */
function findRouteByPathname(pathname: string): RouteConfig | undefined {
  return findRouteByPath(pathname, routes) ?? undefined;
}

/** 收集所有声明了 sidebarProvider 的路由（按 sidebarGroup 分组） */
function collectProviderRoutes(): Map<SidebarGroup, { route: RouteConfig; menuId: string }[]> {
  const map = new Map<SidebarGroup, { route: RouteConfig; menuId: string }[]>();
  for (const route of routes) {
    if (!route.sidebarProvider || !route.sidebarGroup || route.sidebarGroup === SidebarGroup.NONE) continue;
    const menuId = route.menu?.id ?? route.path;
    const list = map.get(route.sidebarGroup) ?? [];
    list.push({ route, menuId });
    map.set(route.sidebarGroup, list);
  }
  return map;
}

export function useSmartSidebar({ onMenuClick, ownSidebar }: UseSmartSidebarOptions): UseSmartSidebarReturn {
  const location = useLocation();
  const { t } = useTranslation();
  const groups = getSidebarGroups();

  const { error: notifyError } = useNotification();

  const gameFolders = useGameStore((s) => s.gameFolders);
  const gameRoot = useGameStore((s) => s.gameRoot);
  const currentAccountUuid = useAuthStore(s => s.currentAccount?.uuid);
  const storeAccounts = useAuthStore(s => s.accounts);

  const { current: currentMenuItem, parent: parentMenuItem } = findMenuItemsByPath(location.pathname);

  const sidebarItems: SidebarMenuItem[] = useMemo(() => {
    const providerRoutes = collectProviderRoutes();

    if (ownSidebar) {
      const currentRoute = findRouteByPathname(location.pathname);
      const effectiveRoute = currentRoute
        || (parentMenuItem ? findRouteByPathname(parentMenuItem.path ?? '') : undefined);

      if (effectiveRoute?.sidebarProvider) {
        const providerItems = effectiveRoute.sidebarProvider();
        const placement = effectiveRoute.sidebarPlacement ?? 'append';

        if (placement === 'replace') return providerItems;

        const baseItems = currentMenuItem?.children
          ?? parentMenuItem?.children
          ?? [];
        return placement === 'prepend'
          ? [...providerItems, ...baseItems]
          : [...baseItems, ...providerItems];
      }

      if (currentMenuItem?.children && currentMenuItem.children.length > 0) {
        return currentMenuItem.children;
      }
      if (parentMenuItem?.children && parentMenuItem.children.length > 0) {
        return parentMenuItem.children;
      }
      return [];
    }

    const items = Object.values(groups).flat();
    const currentProviderRoute = findRouteByPathname(location.pathname);

    for (const [group, entries] of providerRoutes) {
      for (const { route, menuId } of entries) {
        // 仅当当前路由属于该 provider 路由（或为其子路由）时才注入，
        // 避免 / 等无 ownSidebar 的页面聚合所有 provider 内容
        const isSelfOrChild =
          currentProviderRoute?.path === route.path ||
          currentProviderRoute?.path?.startsWith(route.path + '/') ||
          currentProviderRoute?.parentPath === route.path;
        if (!isSelfOrChild) continue;

        const providerItems = route.sidebarProvider!();
        if (providerItems.length === 0) continue;

        const header = items.find((it) => it.type === 'header' && it.group === group);
        if (!header?.children) continue;

        const idx = header.children.findIndex((it) => it.id === menuId);
        const newChildren = idx >= 0
          ? [...header.children.slice(0, idx + 1), ...providerItems, ...header.children.slice(idx + 1)]
          : [...header.children, ...providerItems];

        const pos = items.indexOf(header);
        items[pos] = { ...header, children: newChildren };
      }
    }

    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownSidebar, currentMenuItem, parentMenuItem, groups, location.pathname, gameFolders, storeAccounts, gameRoot, currentAccountUuid]);

  const isAccountPage = location.pathname === '/account';

  const isActive = useCallback((path: string) => {
    if (path === '/game-list') return false;
    const normalizedPath = path.replace(/:gameId/g, '[^/]+');
    const pathRegex = new RegExp(`^${normalizedPath}$`);
    return path === location.pathname || pathRegex.test(location.pathname);
  }, [location.pathname]);

  const isParentActive = useCallback((itemPath: string): boolean => {
    if (!itemPath || itemPath === location.pathname) return false;
    if (itemPath === '/game-list') return false;
    return location.pathname.startsWith(itemPath + '/');
  }, [location.pathname]);

  const hasChildrenItems = useCallback((item: SidebarMenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  }, []);

  const handleItemClick = useCallback((item: SidebarMenuItem) => {
    logger.info(`菜单点击: type=${item.type} path=${item.path}`);

    if (item.type === 'route' && item.path) {
      if (item.path === location.pathname) return;
      useNavStore.getState().setDirection(null);

      const route = findRouteByPath(item.path, routes);
      if (route?.autoNavigateToFirstChild && route.children && route.children.length > 0 && onMenuClick) {
        autoJumpToFirstChild(route, onMenuClick);
        return;
      }

      if (onMenuClick) onMenuClick(item.path);
    } else if (item.type === 'action') {
      item.action?.();
    } else if (item.type === 'external' && item.url) {
      openUrl(item.url);
    }
  }, [location.pathname, onMenuClick]);

  /// -------------------- 右键菜单 ---------------------
  const handleContextMenuAction = useCallback((parentId: string, actionId: string) => {
    logger.info(`Context menu action: parent=${parentId}, action=${actionId}`);
  }, []);

  const contextMenuFor = useCallback((itemId: string): ContextMenuItemData[] | undefined => {
    if (!isAccountPage || !itemId.startsWith('account-')) return undefined;
    const uuid = itemId.slice('account-'.length);
    const isCurrent = currentAccountUuid === uuid;
    return [
      { id: 'setCurrent', label: t('account.setCurrent', '设为当前账户'), icon: UserCheck, disabled: isCurrent },
      { id: 'divider', label: '', divider: true },
      { id: 'delete', label: t('common.delete', '删除账户'), icon: Trash2, danger: true },
    ];
  }, [isAccountPage, currentAccountUuid, t]);

  const handleCustomContextAction = useCallback(async (itemId: string, actionId: string) => {
    if (!itemId.startsWith('account-')) return;
    const uuid = itemId.slice('account-'.length);

    if (actionId === 'setCurrent') {
      useAccountSelectionStore.getState().selectAccount(uuid);
      useSidebarStore.getState().setActiveItem(`account-${uuid}`);
      try {
        await useAuthStore.getState().setCurrentAccount(uuid);
      } catch (e) {
        const msg = getErrorMessage(e);
        notifyError(t('notification.error'), msg);
      }
      return;
    }

    if (actionId === 'delete') {
      const confirmed = await confirm(
        t('account.deleteConfirm', '确定要删除此账号吗？'),
        { title: t('account.title', '账号管理'), kind: 'warning' },
      );
      if (!confirmed) return;
      try {
        await useAuthStore.getState().deleteAccount(uuid);
      } catch (e) {
        const msg = getErrorMessage(e);
        notifyError(t('notification.error'), msg);
      }
    }
  }, [t, notifyError]);

  return {
    sidebarItems,
    currentMenuItem,
    parentMenuItem,
    isAccountPage,
    isActive,
    isParentActive,
    hasChildrenItems,
    handleItemClick,
    handleContextMenuAction,
    contextMenuFor,
    handleCustomContextAction,
  };
}
