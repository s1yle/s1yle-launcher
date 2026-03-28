import { SidebarMenuItem } from '../../router/config';

interface CommonSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  isExpanded?: (itemId: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
}

const CommonSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  isExpanded, 
  hasChildrenItems 
}: CommonSidebarContentProps) => {
  
  const defaultIsActive = (_path: string) => false;
  const defaultIsExpanded = (_itemId: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);
  
  const activeCheck = isActive || defaultIsActive;
  const expandedCheck = isExpanded || defaultIsExpanded;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;
  
  const handleClick = (path: string, _group: string, itemId: string, hasChildren: boolean) => {
    if (onMenuClick) {
      onMenuClick(path, _group, itemId, hasChildren);
    }
  };

  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
        通用
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const hasChildren = childrenCheck(item);
          
          return (
            <div key={item.id}>
              {/* 父菜单项 */}
              <button
                onClick={() => handleClick(item.path, item.group, item.id, hasChildren)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all
                  ${activeCheck(item.path) 
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-left flex-1">{item.title}</span>
                {hasChildren && (
                  <span className="text-xs">
                    {expandedCheck(item.id) ? '▲' : '▼'}
                  </span>
                )}
              </button>

              {/* 子菜单项 - 只在展开时显示 */}
              {hasChildren && expandedCheck(item.id) && item.children && (
                <div className="ml-4 pl-2 border-l border-white/10">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleClick(child.path, child.group, child.id, false)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2 mb-1 rounded-lg transition-all
                        ${activeCheck(child.path) 
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

export default CommonSidebarContent;