import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSidebarGroups, routes, sidebarMenuItems, type SidebarMenuItem, findRouteByPath } from '../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import AccountSidebarContent from './content/AccountSidebarContent';
import GameSidebarContent from './content/GameSidebarContent';
import CommonSidebarContent from './content/CommonSidebarContent';
import BaseChildrenContent from './content/BaseChildrenContent';
import { logger } from '../../helper/logger';

interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean;
}

const SmartSidebar = ({ onMenuClick, showAllGroups = false }: SmartSidebarProps) => {
  const location = useLocation();
  
  const { t } = useTranslation();
  const groups = getSidebarGroups();

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
    const pagesWithOwnSidebar = ['/account', '/download'];
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
      window.open(item.url, '_blank', 'noopener,noreferrer');
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

  if (hasOwnSidebar()) {
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

    let childrenItems: SidebarMenuItem[] = [];
    if (currentMenuItem?.children && currentMenuItem.children.length > 0) {
      childrenItems = currentMenuItem.children;
    } else if (parentMenuItem?.children && parentMenuItem.children.length > 0) {
      childrenItems = parentMenuItem.children;
    }

    return (
      <BaseSidebarLayout>
        <div className="py-8">
          <BaseChildrenContent
            items={childrenItems}
            onMenuClick={handleItemClick}
            isActive={isActive}
            isParentActive={isParentOfActive}
            hasChildrenItems={hasChildrenItems}
            groupTitle={currentMenuItem?.title || parentMenuItem?.title || ''}
            groupTitleI18nKey={currentMenuItem?.titleI18nKey || parentMenuItem?.titleI18nKey}
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
          <p className="text-white/40 text-sm">{t('sidebar.noSidebar', '当前页面无侧边栏')}</p>
        </div>
      )}
    </BaseSidebarLayout>
  );
};

export default SmartSidebar;
