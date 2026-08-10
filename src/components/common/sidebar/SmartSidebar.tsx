import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { getSidebarGroups, routes, sidebarMenuItems, SidebarMenuItem, findRouteByPath, SidebarGroup, autoJumpToFirstChild } from '../../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import { logger } from '../../../helper/logger';
import { openUrl, openFolder } from '../../../helper/rustInvoke';
import { useInstanceStore } from '@/stores/instanceStore';
import { Folder } from 'lucide-react';
import { BaseSidebarContent, ConfirmPopup, useNotification, SkinAvatar } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { useAccountSelectionStore } from '@/stores/accountSelectionStore';
import { UserPlus } from 'lucide-react';
import { DURATION } from '@/utils/animations';
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
  const selectedFolderId = useInstanceStore(s => s.selectedFolderId);


  // 侧边栏按钮点击辅助函数
  const handleItemClick = (item: SidebarMenuItem) => {
    logger.info(`菜单点击: type=${item.type} path=${item.path}`);

    if (item.type === 'route' && item.path) {
      if (item.path === location.pathname) return;

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
    // 支持动态参数匹配（如 /instance-manage/:instanceId/game-settings）
    const normalizedPath = path.replace(/:instanceId/g, '[^/]+');
    const pathRegex = new RegExp(`^${normalizedPath}$`);
    return path === location.pathname || pathRegex.test(location.pathname);
  };

  const hasChildrenItems = (item: SidebarMenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  };

  const knownFolders = useInstanceStore(s => s.knownFolders);
  const removeKnownFolder = useInstanceStore(s => s.removeKnownFolder);
  const { success, error: notifyError } = useNotification();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [ _setCurrentMenuItem] = useState();

  // 获取到 current 及 parent 的SidebarMenuItem
  const findMenuItemsByPath = (path: string): { current: SidebarMenuItem | undefined, parent: SidebarMenuItem | undefined } => {
    let foundParent: SidebarMenuItem | undefined = undefined;
    const findInItems = (items: SidebarMenuItem[], parent?: SidebarMenuItem): SidebarMenuItem | undefined => {
      for (const item of items) {
        // 支持动态参数匹配（如 /instance-manage/:instanceId/game-settings）
        const normalizedItemPath = item.path?.replace(/:instanceId/g, '[^/]+');
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

  // 生成动态文件夹菜单项
  let folderItems: SidebarMenuItem[] = location.pathname.startsWith('/instance-list') ?
    knownFolders.map(f => ({
      id: `folder-${f.id}`,
      type: 'action' as const,
      title: f.name,
      titleI18nKey: '',
      icon: <Folder className="w-4 h-4" />,
      action: () => useInstanceStore.getState().setSelectedFolder(f.id),
      group: 'game' as SidebarGroup,
    })) : [];



  // ------------------------- 辅助函数部分 -------------------------

  const SYSTEM_FOLDER_IDS = new Set(['default', 'official', 'home-mc']);

  // 获取可删除的游戏文件夹
  const deletableIds = new Set(
    folderItems.filter(f => !SYSTEM_FOLDER_IDS.has(f.id.replace('folder-', ''))).map(f => f.id)
  );

  // 删除游戏文件夹辅助函数
  const handleDeleteFolder = (itemId: string) => {
    const folderId = itemId.replace('folder-', '');
    const folder = knownFolders.find(f => f.id === folderId);
    setDeletingId(itemId);
    setDeletingName(folder?.name || folderId);
    setShowDeleteConfirm(true);
  };

  // 打开游戏文件夹辅助函数
  const handleOpenFolder = async (itemId: string) => {
    const folderId = itemId.replace('folder-', '');
    const folder = knownFolders.find(f => f.id === folderId);
    if (folder?.path) {
      try {
        await openFolder(folder.path);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('notification.error');
        notifyError(t('instances.openFolderFailed', '打开文件夹失败'), msg);
      }
    }
  };

  // 确认删除辅助函数
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const folderId = deletingId.replace('folder-', '');
      await removeKnownFolder(folderId);
      success(
        t('instances.folderRemoved', '目录已移除'),
        t('instances.folderRemovedMsg', '"{{name}}" 已从列表中移除', { name: deletingName })
      );
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setDeletingName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.removeFolderFailed', '删除失败'), msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // 右键菜单辅助函数
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

  const sidebarVariants = {
    initial: { opacity: 0, x: -16 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        x: { type: 'spring', stiffness: 400, damping: 22, delay: DURATION.PAGE_TRANSITION },
        opacity: { duration: DURATION.FAST, ease: 'easeOut' as const, delay: DURATION.PAGE_TRANSITION },
      },
    },
    exit: {
      opacity: 0,
      x: 16,
      transition: {
        x: { duration: DURATION.FAST, ease: 'easeIn' as const },
        opacity: { duration: DURATION.FAST, ease: 'easeIn' as const },
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
                  if (isAccountPage) return id === `account-${useAccountSelectionStore.getState().selectedUuid}`;
                  return id === `folder-${selectedFolderId}`;
                }}
                groupTitle={currentMenuItem?.title || parentMenuItem?.title || ''}
                groupTitleI18nKey={currentMenuItem?.titleI18nKey || parentMenuItem?.titleI18nKey}
                onItemDelete={handleDeleteFolder}
                onItemOpenFolder={handleOpenFolder}
                deletableItemIds={deletableIds}
                onContextMenuAction={handleContextMenuAction}
              >
              </BaseSidebarContent>

              {/* 弹框确认是否删除 */}
              {showDeleteConfirm && (
                <ConfirmPopup
                  isOpen={showDeleteConfirm}
                  title={t('instances.confirmRemoveFolder', '删除游戏目录')}
                  message={t('instances.confirmRemoveFolderDesc', '确定要删除目录 "{{name}}" 吗？此操作仅从列表中移除记录，不会删除实际文件。', { name: deletingName })}
                  confirmText={t('common.delete', '删除')}
                  cancelText={t('common.cancel', '取消')}
                  confirmType="danger"
                  showIcon
                  iconType="warning"
                  loading={isDeleting}
                  onConfirm={handleConfirmDelete}
                  onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeletingId(null);
                    setDeletingName('');
                  }}
                  onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletingId(null);
                    setDeletingName('');
                  }}
                />
              )}
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
