import { useLocation } from 'react-router-dom';
import { getSidebarGroups, SidebarMenuItem, routes, sidebarMenuItems } from '../../router/config';
import BaseSidebarLayout from './layouts/BaseSidebarLayout';
import AccountSidebarContent from './content/AccountSidebarContent';
import GameSidebarContent from './content/GameSidebarContent';
import CommonSidebarContent from './content/CommonSidebarContent';
import BaseChildrenContent from './content/BaseChildrenContent';
import { logger } from '../../helper/logger';

interface SmartSidebarProps {
  onMenuClick?: (path: string) => void;
  showAllGroups?: boolean; // 是否显示所有组别（默认根据路由决定）
}

const SmartSidebar = ({ onMenuClick, showAllGroups = false }: SmartSidebarProps) => {
  const location = useLocation();
  const groups = getSidebarGroups();
  
  // 获取当前路由的sidebarGroup
  const getCurrentSidebarGroup = (): 'account' | 'game' | 'common' | 'none' | 'all' => {
    if (showAllGroups) return 'all';
    
    const currentRoute = routes.find(route => route.path === location.pathname);
    if (currentRoute && currentRoute.sidebarGroup) {
      return currentRoute.sidebarGroup;
    }
    
    // 如果没有明确指定，根据路径推断
    if (location.pathname.startsWith('/account')) return 'account';
    if (location.pathname.startsWith('/download') || 
        location.pathname.startsWith('/instance')) return 'game';
    if (location.pathname === '/settings' || 
        location.pathname === '/multiplayer' || 
        location.pathname === '/feedback' || 
        location.pathname === '/hint') return 'common';
    
    return 'none';
  };

  // 检查当前页面是否有自己的独立侧边栏
  const hasOwnSidebar = (): boolean => {
    // 页面有自己的独立侧边栏的路径列表（支持前缀匹配）
    const pagesWithOwnSidebar = [
      '/account',  // AccountList页面现在有自己的独立侧边栏
      '/download' // Download页面现在有自己的独立侧边栏
    ];
    
    // 检查当前路径是否以独立侧边栏路径开头
    const hasOwn = pagesWithOwnSidebar.some(path => location.pathname.startsWith(path));
    console.log(`hasOwnSidebar检查: path=${location.pathname}, pages=${JSON.stringify(pagesWithOwnSidebar)}, result=${hasOwn}`);
    return hasOwn;
  };

  let currentMenu;

  const handleMenuClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    logger.info(`菜单点击: path=${path}, group=${group}, itemId=${itemId}, hasChildren=${hasChildren}`);

    if (path === location.pathname) return;
    
    if (onMenuClick) {
      onMenuClick(path);
    }
    currentMenu = itemId;    
    console.log("当前组别：", group, "菜单项ID：", itemId, "有子菜单：", hasChildren);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 检查菜单项是否有子菜单
  const hasChildrenItems = (item: SidebarMenuItem): boolean => {
    return !!(item.children && item.children.length > 0);
  };

  const currentGroup = getCurrentSidebarGroup();

  // 如果页面有自己的独立侧边栏，不显示全局侧边栏
  if (hasOwnSidebar()) {
    console.log(`当前路径 ${location.pathname} 有自己的独立侧边栏，隐藏全局侧边栏`);
    
    // 查找当前路径对应的菜单项和父菜单项
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
    
    // 获取子菜单项：如果当前菜单项有children则使用，否则使用父菜单项的children
    let childrenItems: SidebarMenuItem[] = [];
    if (currentMenuItem?.children && currentMenuItem.children.length > 0) {
      childrenItems = currentMenuItem.children;
    } else if (parentMenuItem?.children && parentMenuItem.children.length > 0) {
      childrenItems = parentMenuItem.children;
    }
    
    console.log(`当前菜单项:`, currentMenuItem);
    console.log(`父菜单项:`, parentMenuItem);
    console.log(`子菜单项:`, childrenItems);
    
    return (
      <BaseSidebarLayout>
        <div className="py-8">
          <BaseChildrenContent 
            items={childrenItems}
            currentMenu={currentMenu}
            onMenuClick={handleMenuClick}
            isActive={isActive}
            hasChildrenItems={hasChildrenItems}
            groupTitle='游戏下载'
          />
        </div>
      </BaseSidebarLayout>
    );
  }

  console.log(`当前路径 ${location.pathname} 使用全局侧边栏，显示组别：${currentGroup}`);
  return (
    <BaseSidebarLayout>
      {currentGroup === 'all' && (
        <>
          <AccountSidebarContent
            items={groups.account}
            onMenuClick={handleMenuClick}
            isActive={isActive}
            hasChildrenItems={hasChildrenItems}
          />
          <div className="mt-8">
            <GameSidebarContent
              items={groups.game}
              onMenuClick={handleMenuClick}
              isActive={isActive}
              hasChildrenItems={hasChildrenItems}
            />
          </div>
          <div className="mt-8">
            <CommonSidebarContent
              items={groups.common}
              onMenuClick={handleMenuClick}
              isActive={isActive}
              hasChildrenItems={hasChildrenItems}
            />
          </div>
        </>
      )}
      
      {currentGroup === 'account' && (
        <AccountSidebarContent
          items={groups.account}
          onMenuClick={handleMenuClick}
          isActive={isActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}
      
      {currentGroup === 'game' && (
        <GameSidebarContent
          items={groups.game}
          onMenuClick={handleMenuClick}
          isActive={isActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}
      
      {currentGroup === 'common' && (
        <CommonSidebarContent
          items={groups.common}
          onMenuClick={handleMenuClick}
          isActive={isActive}
          hasChildrenItems={hasChildrenItems}
        />
      )}
      
      {currentGroup === 'none' && (
        <div className="text-center py-8">
          <p className="text-gray-400">当前页面无侧边栏</p>
        </div>
      )}
    </BaseSidebarLayout>
  );
};

export default SmartSidebar;