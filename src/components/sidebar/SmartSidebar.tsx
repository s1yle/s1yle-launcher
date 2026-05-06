import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSidebarGroups, routes, sidebarMenuItems, type SidebarMenuItem, findRouteByPath, SidebarGroup } from '../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import AccountSidebarContent from './content/AccountSidebarContent';
import GameSidebarContent from './content/GameSidebarContent';
import CommonSidebarContent from './content/CommonSidebarContent';
import BaseChildrenContent from './content/BaseChildrenContent';
import { logger } from '../../helper/logger';
import { openUrl, openFolder } from '../../helper/rustInvoke';
import { useInstanceStore } from '@/stores/instanceStore';
import { Folder } from 'lucide-react';
import { ConfirmPopup, useNotification } from '@/components/common';

interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
  footer?: React.ReactNode;
}

const SmartSidebar = ({ onMenuClick, showAllGroups = false, footer }: SmartSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const groups = getSidebarGroups();
  const selectedFolderId = useInstanceStore(s => s.selectedFolderId);

  const getCurrentSidebarGroup = (): 'account' | 'game' | 'common' | 'none' | 'all' => {
    if (showAllGroups) return 'all';
    const currentRoute = routes.find(route => route.path === location.pathname);
    if (currentRoute && currentRoute.sidebarGroup) {
      return currentRoute.sidebarGroup;
    }
    if (location.pathname.startsWith('/account')) return 'account';
    if (location.pathname.startsWith('/download')) return 'game';
    if (location.pathname.startsWith('/instance-list')) return 'game';
    if (location.pathname.startsWith('/instance-manage')) return 'game';
    return 'none';
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    logger.info(`菜单点击: type=${item.type} path=${item.path}`);

    if (item.type === 'route' && item.path) {
      if (item.path === location.pathname) return;

      const route = findRouteByPath(item.path, routes);
      if (route?.autoNavigateToFirstChild && route.children && route.children.length > 0) {
        const firstChildPath = route.children[0].path;
        if (firstChildPath !== location.pathname) {
          if (onMenuClick) onMenuClick(firstChildPath);
        }
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

  const isActive = (path: string) => location.pathname === path;

  const hasChildrenItems = (item: SidebarMenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  };

  const currentGroup = getCurrentSidebarGroup();

  // 带独立侧边栏的渲染逻辑
  const pagesWithOwnSidebar = ['/account', '/download', '/game-settings', '/instance-list', '/instance-manage'];

  const knownFolders = useInstanceStore(s => s.knownFolders);
  const removeKnownFolder = useInstanceStore(s => s.removeKnownFolder);
  const { success, error: notifyError } = useNotification();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (pagesWithOwnSidebar.some(path => location.pathname.startsWith(path))) {
    const findMenuItemsByPath = (path: string): { current: SidebarMenuItem | undefined, parent: SidebarMenuItem | undefined } => {
      let foundParent: SidebarMenuItem | undefined = undefined;
      const findInItems = (items: SidebarMenuItem[], parent?: SidebarMenuItem): SidebarMenuItem | undefined => {
        for (const item of items) {
          if (item.path === path) {
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

    // 渲染子侧边栏
    let childrenItems: SidebarMenuItem[] = [];
    if (currentMenuItem?.children && currentMenuItem.children.length > 0) {
      childrenItems = currentMenuItem.children;
    } else if (parentMenuItem?.children && parentMenuItem.children.length > 0) {
      childrenItems = parentMenuItem.children;
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
    

    // 合并动态 + 静态
    const allChildrenItems = [
      ...folderItems,
      ...childrenItems.filter(item => item.id !== 'game-folders'),
    ];

    const SYSTEM_FOLDER_IDS = new Set(['default', 'official', 'home-mc']);

    const deletableIds = new Set(
      folderItems.filter(f => !SYSTEM_FOLDER_IDS.has(f.id.replace('folder-', ''))).map(f => f.id)
    );

    const handleDeleteFolder = (itemId: string) => {
      const folderId = itemId.replace('folder-', '');
      const folder = knownFolders.find(f => f.id === folderId);
      setDeletingId(itemId);
      setDeletingName(folder?.name || folderId);
      setShowDeleteConfirm(true);
    };

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

    const handleContextMenuAction = (parentId: string, actionId: string) => {
      logger.info(`Context menu action: parent=${parentId}, action=${actionId}`);

      if (parentId === 'gm-browse') {
        switch (actionId) {
          case 'ctx-version':
            success(t('gameManage.browse'), t('gameManage.browseVersionDir'));
            break;
          case 'ctx-mods':
            success(t('gameManage.browse'), t('gameManage.browseModsDir'));
            break;
          case 'ctx-resourcepacks':
            success(t('gameManage.browse'), t('gameManage.browseResourcePacksDir'));
            break;
          case 'ctx-saves':
            success(t('gameManage.browse'), t('gameManage.browseSavesDir'));
            break;
          case 'ctx-shaders':
            success(t('gameManage.browse'), t('gameManage.browseShadersDir'));
            break;
          case 'ctx-screenshots':
            success(t('gameManage.browse'), t('gameManage.browseScreenshotsDir'));
            break;
          case 'ctx-config':
            success(t('gameManage.browse'), t('gameManage.browseConfigDir'));
            break;
          case 'ctx-logs':
            success(t('gameManage.browse'), t('gameManage.browseLogsDir'));
            break;
        }
      } else if (parentId === 'gm-manage') {
        switch (actionId) {
          case 'ctx-script':
            success(t('gameManage.manage'), t('gameManage.manageGenerateScript'));
            break;
          case 'ctx-rename':
            success(t('gameManage.manage'), t('gameManage.manageRename'));
            break;
          case 'ctx-copy':
            success(t('gameManage.manage'), t('gameManage.manageCopy'));
            break;
          case 'ctx-delete':
            success(t('gameManage.manage'), t('gameManage.manageDelete'));
            break;
          case 'ctx-export':
            success(t('gameManage.manage'), t('gameManage.manageExport'));
            break;
        }
      }
    };

    return (
      <BaseSidebarLayout footer={footer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`sidebar-instance-${selectedFolderId || 'default'}`}
            className="py-8"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <BaseChildrenContent
              items={allChildrenItems}
              onMenuClick={handleItemClick}
              isActive={isActive}
              isItemActive={(id) => id === `folder-${selectedFolderId}` }
              isParentActive={isParentOfActive}
              hasChildrenItems={hasChildrenItems}
              groupTitle={currentMenuItem?.title || parentMenuItem?.title || ''}
              groupTitleI18nKey={currentMenuItem?.titleI18nKey || parentMenuItem?.titleI18nKey}
              onItemDelete={handleDeleteFolder}
              onItemOpenFolder={handleOpenFolder}
              deletableItemIds={deletableIds}
              onContextMenuAction={handleContextMenuAction}
            />
          </motion.div>
        </AnimatePresence>

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
      </BaseSidebarLayout>
    );
  }

  return (
    <BaseSidebarLayout footer={footer}>
      <AnimatePresence mode="wait">
        {currentGroup === 'all' && (
          <motion.div
            key="sidebar-all"
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <AccountSidebarContent
              items={groups.account}
              onMenuClick={handleItemClick}
              isActive={isActive}
              isParentActive={isParentOfActive}
              hasChildrenItems={hasChildrenItems}
            />
            <div className="mt-8">
              <GameSidebarContent
                items={groups.game}
                onMenuClick={handleItemClick}
                isActive={isActive}
                isParentActive={isParentOfActive}
                hasChildrenItems={hasChildrenItems}
              />
            </div>
            <div className="mt-8">
              <CommonSidebarContent
                items={groups.common}
                onMenuClick={handleItemClick}
                isActive={isActive}
                isParentActive={isParentOfActive}
                hasChildrenItems={hasChildrenItems}
              />
            </div>
          </motion.div>
        )}

        {currentGroup === 'account' && (
          <motion.div
            key="sidebar-account"
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <AccountSidebarContent
              items={groups.account}
              onMenuClick={handleItemClick}
              isActive={isActive}
              isParentActive={isParentOfActive}
              hasChildrenItems={hasChildrenItems}
            />
          </motion.div>
        )}

        {currentGroup === 'game' && (
          <motion.div
            key="sidebar-game"
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <GameSidebarContent
              items={groups.game}
              onMenuClick={handleItemClick}
              isActive={isActive}
              isParentActive={isParentOfActive}
              hasChildrenItems={hasChildrenItems}
            />
          </motion.div>
        )}

        {currentGroup === 'common' && (
          <motion.div
            key="sidebar-common"
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <CommonSidebarContent
              items={groups.common}
              onMenuClick={handleItemClick}
              isActive={isActive}
              isParentActive={isParentOfActive}
              hasChildrenItems={hasChildrenItems}
            />
          </motion.div>
        )}

        {currentGroup === 'none' && (
          <motion.div
            key="sidebar-none"
            className="text-center py-8"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-text-tertiary text-sm">{t('sidebar.noSidebar', '当前页面无侧边栏')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseSidebarLayout>
  );
};

export default SmartSidebar;
