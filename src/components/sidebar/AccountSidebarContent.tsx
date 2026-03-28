import { SidebarMenuItem } from '../../router/config';

interface AccountSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
}

const AccountSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  hasChildrenItems 
}: AccountSidebarContentProps) => {
  
  const defaultIsActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);
  
  const activeCheck = isActive || defaultIsActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;
  
  const handleClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    // 这些参数被传递给onMenuClick回调函数
    if (onMenuClick) {
      onMenuClick(path, group, itemId, hasChildren);
    }
  };

  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
        账户
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

              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSidebarContent;