import { useLocation } from 'react-router-dom';
import { getSidebarGroups, SidebarMenuItem } from '../router/config';

interface SidebarProps {
  onMenuClick?: (path: string) => void;
}

const Sidebar = ({ onMenuClick }: SidebarProps) => {
  // const navigate = useNavigate();
  const location = useLocation();
  const groups = getSidebarGroups();

  const handleMenuClick = (path: string) => {
    if (path === location.pathname) return;
    if (onMenuClick) {
      onMenuClick(path);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
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
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive(item.path) 
                  ? 'bg-white/20 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-left">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-72 bg-white/10 backdrop-blur-md h-full border-r border-white/20 flex flex-col">
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

      <div className="p-4 border-t border-white/20">
        <div className="bg-indigo-500/20 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">提示：</span>
            点击菜单切换页面，左侧侧边栏固定显示
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;