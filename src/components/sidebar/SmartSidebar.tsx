import { useLocation } from 'react-router-dom';
import { getSidebarGroups, SidebarMenuItem, routes } from '../../router/config';
import BaseSidebarLayout from './BaseSidebarLayout';
import AccountSidebarContent from './AccountSidebarContent';
import GameSidebarContent from './GameSidebarContent';
import CommonSidebarContent from './CommonSidebarContent';

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
    // 页面有自己的独立侧边栏的路径列表
    const pagesWithOwnSidebar = [
      '/account'  // AccountList页面现在有自己的独立侧边栏
    ];
    
    return pagesWithOwnSidebar.includes(location.pathname);
  };

  const handleMenuClick = (path: string, group: string, itemId: string) => {
    if (path === location.pathname) return;
    
    if (onMenuClick) {
      onMenuClick(path);
    }
    
    console.log("当前组别：", group, "菜单项ID：", itemId);
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
    return (
      <BaseSidebarLayout>
        <div className="text-center py-8">
          <p className="text-gray-400">页面使用独立侧边栏</p>
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