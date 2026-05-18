import { useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, User, Home, ChevronDown } from 'lucide-react';
import { useUserRoleStore, type UserRole } from '@/stores/userRoleStore';
import { getNavItemsByRole, type NavItem } from '@/config/navigationConfig';

interface DynamicIslandProps {
  onMenuClick?: (path: string) => void;
}

const AVAILABLE_ROLES: UserRole[] = ['player', 'admin'];

const ROLE_CONFIG: Record<UserRole, { icon: typeof User; label: string; colorClass: string; bgGradient: string }> = {
  player: { 
    icon: User, 
    label: '玩家', 
    colorClass: 'bg-blue-500/20 text-blue-400',
    bgGradient: 'from-blue-500/10 to-transparent'
  },
  admin: { 
    icon: Crown, 
    label: '服主', 
    colorClass: 'bg-purple-500/20 text-purple-400',
    bgGradient: 'from-purple-500/10 to-transparent'
  },
};

const DynamicIsland = ({ onMenuClick }: DynamicIslandProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, isTransitioning, switchRole } = useUserRoleStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => getNavItemsByRole(currentRole as 'player' | 'admin'), [currentRole]);

  const hasMultipleRoles = AVAILABLE_ROLES.length > 2;
  const currentRoleConfig = ROLE_CONFIG[currentRole];

  const handleItemClick = (item: NavItem) => {
    if (item.action) {
      item.action();
      return;
    }

    if (item.path && item.path !== location.pathname) {
      if (onMenuClick) {
        onMenuClick(item.path);
      } else {
        navigate(item.path);
      }
    }
  };

  const handleRoleButtonClick = () => {
    if (hasMultipleRoles) {
      setShowRoleMenu(!showRoleMenu);
    } else {
      handleRoleSwitch(currentRole === 'player' ? 'admin' : 'player');
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (role === currentRole || isTransitioning) return;
    
    // 检查是否需要导航回主页（当从 admin 页面切回时）
    const needsNavigate = location.pathname.startsWith('/admin');
    
    setShowRoleMenu(false);
    switchRole(role);
    
    // 如果需要导航，使用 React Router 的 navigate（不刷新页面）
    if (needsNavigate) {
      navigate('/');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setShowRoleMenu(false);
    handleRoleSwitch(role);
  };

  const isActive = (path: string) => {
    return path === location.pathname || location.pathname.startsWith(path + '/');
  };

  const homeItem: NavItem = {
    id: 'home',
    label: '主页',
    icon: Home,
    path: '/',
    roles: ['player', 'admin'],
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      return;
    }
  };

  return (
    <motion.div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        ref={islandRef}
        className={`
          relative flex items-center gap-1 px-4 py-2.5
          bg-[var(--color-surface)]/90 backdrop-blur-2xl
          border border-[var(--color-border)]/50
          rounded-full shadow-xl shadow-black/20
          select-none overflow-hidden
          transition-all duration-500 ease-out
          ${isExpanded ? 'gap-2 px-6' : ''}
        `}
        style={{
          willChange: 'transform, opacity',
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onMouseDown={handleDragStart}
        data-tauri-drag-region="true"
      >
        {/* 背景渐变指示器 - 平滑过渡 */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-r transition-opacity duration-700 ${currentRoleConfig.bgGradient}`}
        />

        {/* 角色切换按钮 */}
        <div className="relative flex-shrink-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRoleButtonClick();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isTransitioning}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-full
              text-sm font-medium transition-all duration-300 cursor-pointer
              ${currentRoleConfig.colorClass}
              hover:bg-opacity-40 active:scale-95
            `}
            data-tauri-drag-region="false"
          >
            {/* 图标旋转动画 */}
            <motion.span
              key={currentRole}
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              <currentRoleConfig.icon className="w-4 h-4" />
            </motion.span>

            <span className="hidden sm:inline whitespace-nowrap font-medium">
              {currentRoleConfig.label}
            </span>

            {hasMultipleRoles && (
              <ChevronDown 
                className={`w-3.5 h-3.5 transition-transform duration-300 ${showRoleMenu ? 'rotate-180' : ''}`} 
              />
            )}
          </button>

          {/* 角色下拉菜单 */}
          {hasMultipleRoles && showRoleMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 py-2 min-w-[150px]
                bg-[var(--color-surface-solid)]/98 backdrop-blur-xl
                border border-[var(--color-border)]/60 rounded-xl
                shadow-2xl z-50"
              data-tauri-drag-region="false"
            >
              {AVAILABLE_ROLES.map((role) => {
                const config = ROLE_CONFIG[role];
                const IconComponent = config.icon;
                return (
                  <button
                    key={role}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleSelect(role);
                    }}
                    disabled={isTransitioning || role === currentRole}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer
                      hover:bg-[var(--color-surface-hover)] transition-colors duration-200
                      rounded-lg mx-1 my-0.5
                      ${(role === currentRole || isTransitioning) 
                        ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                    data-tauri-drag-region="false"
                  >
                    <IconComponent className={`w-5 h-5 ${config.colorClass.split(' ')[1]}`} />
                    <span className={`font-medium ${config.colorClass.split(' ')[1]}`}>
                      切换到{config.label}模式
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-[var(--color-border)]/30 flex-shrink-0 z-10" />

        {/* 主页按钮 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(homeItem);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isTransitioning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative flex items-center gap-2 p-2 rounded-full
            text-sm font-medium transition-all duration-300 cursor-pointer z-10
            ${isActive('/')
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-md'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }
          `}
          title="主页"
          data-tauri-drag-region="false"
        >
          <Home className="w-4.5 h-4.5 flex-shrink-0" />

          <span 
            className={`
              overflow-hidden whitespace-nowrap hidden sm:inline font-medium
              transition-all duration-500 ease-out
              ${isExpanded || isActive('/') 
                ? 'max-w-[120px] opacity-100 ml-1' 
                : 'max-w-0 opacity-0 ml-0'
              }
            `}
          >
            主页
          </span>

          {isActive('/') && (
            <motion.div
              layoutId="activeIndicator-home"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5
                bg-[var(--color-primary)] rounded-full shadow-lg"
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </motion.button>

        {/* 导航菜单项 */}
        <div className="flex items-center gap-1 z-10">
          {navItems.map((item, index) => (
            <motion.button
              key={`${currentRole}-${item.id}`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.08,
                ease: "easeOut"
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={isTransitioning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-full
                text-sm font-medium transition-all duration-300 cursor-pointer
                ${isActive(item.path || '')
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-md'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }
              `}
              title={item.label}
              data-tauri-drag-region="false"
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />

              <span 
                className={`
                  overflow-hidden whitespace-nowrap hidden sm:inline font-medium
                  transition-all duration-500 ease-out
                  ${isExpanded || isActive(item.path)
                    ? 'max-w-[120px] opacity-100 ml-1'
                    : 'max-w-0 opacity-0 ml-0'
                  }
                `}
              >
                {item.label}
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full
                    text-white text-xs flex items-center justify-center font-bold shadow-lg"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </motion.span>
              )}

              {isActive(item.path) && (
                <motion.div
                  layoutId={`activeIndicator-${item.id}`}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5
                    bg-[var(--color-primary)] rounded-full shadow-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DynamicIsland;
