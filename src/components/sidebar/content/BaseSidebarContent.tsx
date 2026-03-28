// BaseSidebarContent.tsx
// 基础侧边栏内容组件，包含公共的渲染和交互逻辑
// 通过 props 控制渲染行为，子组件可以继承或组合使用

import { SidebarMenuItem } from '../../../router/config';

export interface BaseSidebarContentProps {
  items: SidebarMenuItem[];
  onMenuClick?: (path: string, group: string, itemId: string, hasChildren: boolean) => void;
  isActive?: (path: string) => boolean;
  hasChildrenItems?: (item: SidebarMenuItem) => boolean;
  groupTitle?: string;
}

const BaseSidebarContent = ({ 
  items, 
  onMenuClick, 
  isActive, 
  hasChildrenItems,
  groupTitle
}: BaseSidebarContentProps) => {

  const defaultIsActive = (_path: string) => false;
  const defaultHasChildrenItems = (item: SidebarMenuItem) => !!(item.children && item.children.length > 0);
  
  const activeCheck = isActive || defaultIsActive;
  const childrenCheck = hasChildrenItems || defaultHasChildrenItems;
  
  const handleClick = (path: string, group: string, itemId: string, hasChildren: boolean) => {
    if (onMenuClick) {
      onMenuClick(path, group, itemId, hasChildren);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem, level: number = 0) => {
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
            ${level > 0 ? 'ml-4 pl-2' : ''}
          `}
          style={{ paddingLeft: level > 0 ? `${level * 1}rem` : '1rem' }}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-left flex-1">{item.title}</span>
        </button>

      </div>
    );
  };

  return (
    <div>
      {groupTitle && (
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
          {groupTitle}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => renderMenuItem(item))}
      </div>
    </div>
  );
};

export default BaseSidebarContent;