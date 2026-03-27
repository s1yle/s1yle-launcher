import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSidebarGroups, SidebarMenuItem } from '../router/config';

interface SidebarProps {
  onMenuClick?: (path: string) => void;
}

const Sidebar = ({ onMenuClick }: SidebarProps) => {
  const location = useLocation();
  const groups = getSidebarGroups();
  
  // 状态：当前展开的菜单项ID
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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

  const renderGroup = (groupName: string, items: SidebarMenuItem[], index: number) => {
    const groupTitle = {
      account: '账户',
      game: '游戏',
      common: '通用'
    }[groupName];

    return (
      <div key={groupName} className={index > 0 ? 'mt-8' : ''}>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
          {groupTitle}
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const hasChildren = hasChildrenItems(item);
            
            return (
              <div key={item.id}>
                {/* 父菜单项 */}
                <button
                  onClick={() => handleMenuClick(item.path, item.group, item.id, hasChildren)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all
                    ${isActive(item.path) 
                      ? 'bg-white/20 text-white font-semibold' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-left flex-1">{item.title}</span>
                  {hasChildren && (
                    <span className="text-xs">
                      {isExpanded(item.id) ? '▲' : '▼'}
                    </span>
                  )}
                </button>

                {/* 子菜单项 - 只在展开时显示 */}
                {hasChildren && isExpanded(item.id) && (
                  <div className="ml-4 pl-2 border-l border-white/10">
                    {item.children!.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleMenuClick(child.path, child.group, child.id, false)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2 mb-1 rounded-lg transition-all
                          ${isActive(child.path) 
                            ? 'bg-white/15 text-white font-medium' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                          }
                        `}
                      >
                        <span className="text-sm">{child.icon}</span>
                        <span className="text-left text-sm">{child.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside style={{
      backgroundColor: '#191919',   //黑色背景
    }}
    className="w-55 bg-white/10 backdrop-blur-md h-full flex flex-col">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-lg font-bold text-white">MC启动器</h2>
        <p className="text-sm text-gray-300 mt-1">简洁高效的游戏启动管理</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 账户分组 */}

        {renderGroup('account', groups.account, 0)}
        
        {/* 游戏分组 */}
        {renderGroup('game', groups.game, 1)}
        
        {/* 通用分组 */}
        {renderGroup('common', groups.common, 2)}
      </div>

      {/* <div className="p-4 border-t border-white/20">
        <div className="bg-indigo-500/20 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">提示：</span>
            点击菜单切换页面，左侧侧边栏固定显示
          </p>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;