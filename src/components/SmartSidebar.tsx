import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSidebarGroups, SidebarMenuItem, routes } from '../router/config';
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
  
  // 状态：当前展开的菜单项ID
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
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

  // 根据当前路径自动设置展开状态
  useEffect(() => {
    // 查找当前路径对应的父菜单项
    const findParentItem = (): string | null => {
      for (const groupKey in groups) {
        const groupItems = groups[groupKey as keyof typeof groups];
        for (const item of groupItems) {
          // 检查是否是当前路径的直接父菜单
          if (item.children) {
            const childMatch = item.children.find(child => child.path === location.pathname);
            if (childMatch) {
              return item.id;
            }
          }
          // 检查是否是当前路径本身（父菜单被点击）
          if (item.path === location.pathname && item.children) {
            return item.id;
          }
        }
      }
      return null;
    };

    const parentId = findParentItem();
    setExpandedItemId(parentId);
  }, [location.pathname, groups]);

  const handleMenuClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    if (path === location.pathname) return;
    
    // 如果有子菜单，切换展开状态
    if (hasChildren) {
      setExpandedItemId(prev => prev === itemId ? null : itemId);
    }
    
    if (onMenuClick) {
      onMenuClick(path);
    }
    
    console.log("当前组别：", group, "菜单项ID：", itemId);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 检查菜单项是否应该展开
  const isExpanded = (itemId: string) => {
    return expandedItemId === itemId;
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
            isExpanded={isExpanded}
            hasChildrenItems={hasChildrenItems}
          />
          <div className="mt-8">
            <GameSidebarContent
              items={groups.game}
              onMenuClick={handleMenuClick}
              isActive={isActive}
              isExpanded={isExpanded}
              hasChildrenItems={hasChildrenItems}
            />
          </div>
          <div className="mt-8">
            <CommonSidebarContent
              items={groups.common}
              onMenuClick={handleMenuClick}
              isActive={isActive}
              isExpanded={isExpanded}
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
          isExpanded={isExpanded}
          hasChildrenItems={hasChildrenItems}
        />
      )}
      
      {currentGroup === 'game' && (
        <GameSidebarContent
          items={groups.game}
          onMenuClick={handleMenuClick}
          isActive={isActive}
          isExpanded={isExpanded}
          hasChildrenItems={hasChildrenItems}
        />
      )}
      
      {currentGroup === 'common' && (
        <CommonSidebarContent
          items={groups.common}
          onMenuClick={handleMenuClick}
          isActive={isActive}
          isExpanded={isExpanded}
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