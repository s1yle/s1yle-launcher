import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { getSidebarGroups, routes, sidebarMenuItems, SidebarMenuItem, findRouteByPath, SidebarGroup, autoJumpToFirstChild } from '../../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import { logger } from '../../../helper/logger';
import { openUrl } from '../../../helper/rustInvoke';
import { BaseSidebarContent, useNotification, SkinAvatar, type ContextMenuItemData } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { useNavStore } from '@/stores/navStore';
import { useAccountSelectionStore } from '@/stores/accountSelectionStore';
import { UserPlus, UserCheck, Trash2 } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';
import { DURATION, EASING } from '@/utils/animations';
import { useContextMenuAction } from '../../../router/contextMenuConfigs';

/** 智能侧边栏组件 Props */
export interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  /** 是否为页面自带侧边栏（显示当前菜单的子项），否则显示所有顶级菜单 */
  ownSidebar?: boolean;
}

/** 智能侧边栏组件，根据当前路由自动切换菜单项，支持动态文件夹和右键菜单 */
const SmartSidebar = ({ onMenuClick = () => {}, footer, header, ownSidebar = false }: SmartSidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const groups = getSidebarGroups();


  // 侧边栏按钮点击辅助函数
  const handleItemClick = (item: SidebarMenuItem) => {
    logger.info(`菜单点击: type=${item.type} path=${item.path}`);

    if (item.type === 'route' && item.path) {
      if (item.path === location.pathname) return;

      // 侧边栏导航不继承灵动岛的滑动方向，强制淡入淡出
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
  };

  const isParentOfActive = (itemPath: string): boolean => {
    if (!itemPath || itemPath === location.pathname) return false;
    return location.pathname.startsWith(itemPath + '/');
  };

  const isActive = (path: string) => {
    // 支持动态参数匹配（如 /game-manage/:gameId/game-settings）
    const normalizedPath = path.replace(/:gameId/g, '[^/]+');
    const pathRegex = new RegExp(`^${normalizedPath}$`);
    return path === location.pathname || pathRegex.test(location.pathname);
  };

  const hasChildrenItems = (item: SidebarMenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  };

  const { success, error: notifyError } = useNotification();

  // 获取到 current 及 parent 的SidebarMenuItem
  const findMenuItemsByPath = (path: string): { current: SidebarMenuItem | undefined, parent: SidebarMenuItem | undefined } => {
    let foundParent: SidebarMenuItem | undefined = undefined;
    const findInItems = (items: SidebarMenuItem[], parent?: SidebarMenuItem): SidebarMenuItem | undefined => {
      for (const item of items) {
        // 支持动态参数匹配（如 /game-manage/:gameId/game-settings）
        const normalizedItemPath = item.path?.replace(/:gameId/g, '[^/]+');
        const pathRegex = new RegExp(`^${normalizedItemPath}$`);
        if ((item.path === path || pathRegex.test(path))) {
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
  };

  const { current: currentMenuItem, parent: parentMenuItem } = findMenuItemsByPath(location.pathname);

  // 渲染侧边栏
  let sidebarItems: SidebarMenuItem[] = [];

  // 1. 先判断是否有独立侧边栏
  const hasOwnSidebar = ownSidebar;

  // 2. 根据是否有独立侧边栏来决定显示什么
  if (hasOwnSidebar) {
    // 有独立侧边栏的页面：显示子菜单
    if (currentMenuItem?.children && currentMenuItem.children.length > 0) {
      sidebarItems = currentMenuItem.children;
    } else if (parentMenuItem?.children && parentMenuItem.children.length > 0) {
      sidebarItems = parentMenuItem.children;
    }
  } else {
    // 普通页面：显示所有顶级菜单
    sidebarItems = Object.values(groups).flat();
  }

  // 账户页面：使用动态账户列表作为侧边栏
  const isAccountPage = location.pathname === '/account';
  const storeAccounts = useAuthStore(s => s.accounts);
  const currentAccountUuid = useAuthStore(s => s.currentAccount?.uuid);
  const selectedAccountUuid = useAccountSelectionStore(s => s.selectedUuid);
  if (isAccountPage) {
    const accountItems: SidebarMenuItem[] = storeAccounts.map(acc => ({
      id: `account-${acc.uuid}`,
      type: 'action' as const,
      title: acc.name,
      titleI18nKey: '',
      icon: <SkinAvatar uuid={acc.uuid} size={20} />,
      action: () => {
        useAccountSelectionStore.getState().selectAccount(acc.uuid);
        useAuthStore.getState().setCurrentAccount(acc.uuid).catch((e) => {
          const msg = e instanceof Error ? e.message : '设置当前账户失败';
          notifyError(t('notification.error'), msg);
        });
      },
      group: SidebarGroup.ACCOUNT,
    }));

    accountItems.push({
      id: 'add-account-btn',
      type: 'action' as const,
      title: '添加账户',
      titleI18nKey: '',
      icon: <UserPlus className="w-4 h-4" />,
      action: () => useAccountSelectionStore.getState().openAddPopup(),
      group: SidebarGroup.ACCOUNT,
    });

    sidebarItems = accountItems;
  }

  // ------------------------- 辅助函数部分 -------------------------
  const handleContextMenuAction = (parentId: string, actionId: string) => {
    logger.info(`Context menu action: parent=${parentId}, action=${actionId}`);
    useContextMenuAction(parentId, actionId, t, {
      success,
      error: notifyError,
      warning: (_title: string, _message?: string) => {
        // TODO: implement warning
        return '';
      },
      info: (_title: string, _message?: string) => {
        // TODO: implement info
        return '';
      },
    });
    // };
  }

  // 账户侧边栏按钮的右键菜单项
  const contextMenuFor = (itemId: string): ContextMenuItemData[] | undefined => {
    if (!isAccountPage || !itemId.startsWith('account-')) return undefined;
    const uuid = itemId.slice('account-'.length);
    const isCurrent = currentAccountUuid === uuid;
    return [
      { id: 'setCurrent', label: t('account.setCurrent', '设为当前账户'), icon: UserCheck, disabled: isCurrent },
      { id: 'divider', label: '', divider: true },
      { id: 'delete', label: t('common.delete', '删除账户'), icon: Trash2, danger: true },
    ];
  };

  // 账户侧边栏按钮右键菜单动作处理
  const handleCustomContextAction = async (itemId: string, actionId: string) => {
    if (!itemId.startsWith('account-')) return;
    const uuid = itemId.slice('account-'.length);

    if (actionId === 'setCurrent') {
      useAccountSelectionStore.getState().selectAccount(uuid);
      try {
        await useAuthStore.getState().setCurrentAccount(uuid);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '设置当前账户失败';
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
        success(t('notification.accountDeleted', '账号已删除'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : '删除账户失败';
        notifyError(t('notification.error'), msg);
      }
    }
  };

  const sidebarVariants = {
    initial: { opacity: 0.8, x: -16 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        x: { ...EASING.SPRING_SOFT, delay: DURATION.ROUTE_SLIDE },
        opacity: { duration: DURATION.FAST, ease: EASING.OUT_FLUENT, delay: DURATION.ROUTE_SLIDE },
      },
    },
    exit: {
      opacity: 0,
      x: 16,
      transition: {
        x: { duration: DURATION.FAST, ease: EASING.IN_FLUENT },
        opacity: { duration: DURATION.FAST, ease: EASING.IN_FLUENT },
      },
    },
  } satisfies Variants;

  const renderSidebar = (items: SidebarMenuItem[]) => {
    return (
      <>
        <BaseSidebarLayout footer={footer} header={header}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={sidebarVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col"
            >
              <BaseSidebarContent
                items={items}
                onMenuClick={handleItemClick}
                isActive={isActive}
                isParentActive={isParentOfActive}
                hasChildrenItems={hasChildrenItems}

                isItemActive={(id) => {
                  if (isAccountPage) return id === `account-${selectedAccountUuid}`;
                  return false;
                }}
                groupTitle={currentMenuItem?.title || parentMenuItem?.title || ''}
                groupTitleI18nKey={currentMenuItem?.titleI18nKey || parentMenuItem?.titleI18nKey}
                onContextMenuAction={handleContextMenuAction}
                contextMenuFor={isAccountPage ? contextMenuFor : undefined}
                onCustomContextAction={isAccountPage ? handleCustomContextAction : undefined}
              >
              </BaseSidebarContent>
            </motion.div>
          </AnimatePresence>
        </BaseSidebarLayout>
      </>
    )
  }

  return (
    renderSidebar(sidebarItems)
  );
};

export default SmartSidebar;
