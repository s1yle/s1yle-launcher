import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSidebarGroups, routes, SidebarGroup, type SidebarMenuItem, findRouteByPath } from '../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import AccountSidebarContent from './content/AccountSidebarContent';
import GameSidebarContent from './content/GameSidebarContent';
import CommonSidebarContent from './content/CommonSidebarContent';
import BaseChildrenContent from './content/BaseChildrenContent';
import { logger } from '../../helper/logger';
import { openUrl } from '../../helper/rustInvoke';
import { useInstanceStore } from '../../stores/instanceStore';
import { FolderTree, FolderPlus, Download, Package, RefreshCw, Settings } from 'lucide-react';

interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
}

const SmartSidebar = ({ onMenuClick, showAllGroups = false }: SmartSidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const groups = getSidebarGroups();
  const { knownFolders, setSelectedFolder, refresh, refreshKnownFolders } = useInstanceStore();

  const getCurrentSidebarGroup = (): 'account' | 'game' | 'common' | 'none' | 'all' => {
    if (showAllGroups) return 'all';
    const currentRoute = routes.find(route => route.path === location.pathname);
    if (currentRoute && currentRoute.sidebarGroup) {
      return currentRoute.sidebarGroup;
    }
    if (location.pathname.startsWith('/account')) return 'account';
    if (location.pathname.startsWith('/download') || location.pathname.startsWith('/instance')) return 'game';
    return 'none';
  };

  const hasOwnSidebar = (): boolean => {
    const pagesWithOwnSidebar = ['/account', '/download', '/instance-list'];
    return pagesWithOwnSidebar.some(path => location.pathname.startsWith(path));
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

  // Build dynamic instance-list sidebar items
  const buildInstanceSidebarItems = (): SidebarMenuItem[] => {
    const folderItems: SidebarMenuItem[] = knownFolders.map(folder => ({
      id: folder.id,
      type: 'route' as const,
      title: folder.name,
      titleI18nKey: `instances.folder.${folder.id}`,
      icon: <FolderTree className="w-4 h-4" />,
      path: '/instance-list',
      group: SidebarGroup.GAME,
    }));

    return [
      ...folderItems,
      {
        id: 'add-game-folder',
        type: 'action' as const,
        title: t('instances.addGameFolder', '添加游戏文件夹'),
        titleI18nKey: 'instances.addGameFolder',
        icon: <FolderPlus className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
        action: () => {
          logger.info('添加游戏文件夹 - 待实现');
        },
      },
      {
        id: 'divider-instances',
        type: 'divider' as const,
        title: '',
        titleI18nKey: '',
        group: SidebarGroup.GAME,
      },
      {
        id: 'install-new-game',
        type: 'action' as const,
        title: t('instances.installNewGame', '安装新游戏'),
        titleI18nKey: 'instances.installNewGame',
        icon: <Download className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
        action: () => {
          logger.info('安装新游戏 - 待实现');
        },
      },
      {
        id: 'install-modpack',
        type: 'action' as const,
        title: t('instances.installModpack', '安装整合包'),
        titleI18nKey: 'instances.installModpack',
        icon: <Package className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
        action: () => {
          logger.info('安装整合包 - 待实现');
        },
      },
      {
        id: 'refresh-instances',
        type: 'action' as const,
        title: t('instances.refresh', '刷新'),
        titleI18nKey: 'instances.refresh',
        icon: <RefreshCw className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
        action: () => {
          refresh();
          refreshKnownFolders();
        },
      },
      {
        id: 'global-game-settings',
        type: 'route' as const,
        title: t('instances.globalSettings', '全局游戏设置'),
        titleI18nKey: 'instances.globalSettings',
        icon: <Settings className="w-4 h-4" />,
        path: '/instance-list',
        group: SidebarGroup.GAME,
      },
    ];
  };

  if (hasOwnSidebar()) {
    const instanceItems = buildInstanceSidebarItems();

    return (
      <BaseSidebarLayout>
        <div className="py-8">
          <BaseChildrenContent
            items={instanceItems}
            onMenuClick={(item) => {
              if (item.type === 'action') {
                item.action?.();
              } else if (item.id && knownFolders.find(f => f.id === item.id)) {
                setSelectedFolder(item.id);
              }
            }}
            isActive={(path) => location.pathname === path}
            isParentActive={() => false}
            hasChildrenItems={() => false}
            groupTitle={t('instances.title', '实例列表')}
            groupTitleI18nKey="instances.title"
          />
        </div>
      </BaseSidebarLayout>
    );
  }

  return (
    <BaseSidebarLayout>
      {currentGroup === 'all' && (
        <>
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
        </>
      )}

      {currentGroup === 'account' && (
        <AccountSidebarContent
          items={groups.account}
          onMenuClick={handleItemClick}
          isActive={isActive}
          isParentActive={isParentOfActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}

      {currentGroup === 'game' && (
        <GameSidebarContent
          items={groups.game}
          onMenuClick={handleItemClick}
          isActive={isActive}
          isParentActive={isParentOfActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}

      {currentGroup === 'common' && (
        <CommonSidebarContent
          items={groups.common}
          onMenuClick={handleItemClick}
          isActive={isActive}
          isParentActive={isParentOfActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}

      {currentGroup === 'none' && (
        <div className="text-center py-8">
          <p className="text-text-tertiary text-sm">{t('sidebar.noSidebar', '当前页面无侧边栏')}</p>
        </div>
      )}
    </BaseSidebarLayout>
  );
};

export default SmartSidebar;
