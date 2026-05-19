import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User, Home, ChevronDown, HomeIcon, FileQuestionMark } from 'lucide-react';
import { useUserRoleStore, type UserRole } from '@/stores/userRoleStore';
import { getNavItemsByRole, type NavItem } from '@/config/navigationConfig';

interface DynamicIslandProps {
  onMenuClick?: (path: string) => void;
}

const AVAILABLE_ROLES: UserRole[] = ['player', 'admin'];
const TIMEOUT_IDLE = 15000;

const ROLE_CONFIG: Record<UserRole, { icon: typeof User; label: string; color: string }> = {
  player: {
    icon: User,
    label: '玩家',
    color: 'text-blue-400'
  },
  admin: {
    icon: Crown,
    label: '服主',
    color: 'text-purple-400'
  },
  creator: {
    icon: User,
    label: '创建者',
    color: 'text-green-400'
  },
};

// 可配置的底部随机文本
const BOTTOM_TEXTS = [
  '探索无限可能',
  '开启冒险之旅',
  '创造你的世界',
  '与朋友同乐',
  '方块无限，创意无限',
  '今天玩什么？',
];

const DynamicIsland = ({ onMenuClick }: DynamicIslandProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, isTransitioning, switchRole } = useUserRoleStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [bottomText, setBottomText] = useState(BOTTOM_TEXTS[0]);
  const idleTimerRef = useRef<number | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => getNavItemsByRole(currentRole as 'player' | 'admin'), [currentRole]);
  
  const hasMultipleRoles = AVAILABLE_ROLES.length > 2;
  const currentRoleConfig = ROLE_CONFIG[currentRole];

  // 空闲检测：长时间未访问时收起文字
  useEffect(() => {
    const resetTimer = () => {
      setIsExpanded(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        if (!isHovered) {
          setIsExpanded(false);
        }
      }, TIMEOUT_IDLE); // 5 秒未访问收起
    };

    resetTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [location.pathname, isHovered]);

  // 随机切换底部文本
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * BOTTOM_TEXTS.length);
      setBottomText(BOTTOM_TEXTS[randomIndex]);
    }, 8000); // 8 秒切换一次

    return () => clearInterval(interval);
  }, []);

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

    const needsNavigate = location.pathname.startsWith('/');

    setShowRoleMenu(false);
    switchRole(role);

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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={islandRef}
        className={`
          relative flex items-center gap-1
          bg-[var(--color-surface)]/90
          border border-[var(--color-border)]/50
          rounded-full shadow-xl shadow-black/20
          select-none overflow-hidden
          transition-all duration-500 ease-out
          ${isExpanded ? 'gap-2 px-6' : ''}
        `}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsExpanded(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleDragStart}
        data-tauri-drag-region="true"
      >
        {/* 角色切换按钮 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRoleButtonClick();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isTransitioning}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full
              text-sm font-medium transition-all duration-200 cursor-pointer
              ${currentRoleConfig.color}
              hover:bg-surface-hover
              active:scale-95
            `}
            data-tauri-drag-region="false"
          >
            <currentRoleConfig.icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{currentRoleConfig.label}</span>
            {hasMultipleRoles && (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* 角色下拉菜单 */}
          {hasMultipleRoles && showRoleMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 py-1.5 min-w-[140px]
                bg-surface-solid
                rounded-lg
                shadow-xl z-50"
              data-tauri-drag-region="false"
            >
              {AVAILABLE_ROLES.map((role) => {
                const config = ROLE_CONFIG[role];
                return (
                  <button
                    key={role}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleSelect(role);
                    }}
                    disabled={isTransitioning || role === currentRole}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-sm
                      hover:bg-surface-hover transition-colors cursor-pointer
                      ${(role === currentRole || isTransitioning)
                        ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    data-tauri-drag-region="false"
                  >
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`font-medium ${config.color}`}>
                      切换到{config.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-[var(--color-border)]/30 flex-shrink-0 z-10" />

        {/* 导航菜单项 */}
        <div className="flex items-center gap-1 z-10">
          {navItems.map((item, index) => (
            <DynamicItem
              isMainMenu={item.id === 'main'}
              isActive={isActive(item.path)}
              isExpanded={isExpanded}
              isTransitioning={isTransitioning}
              handleItemClick={handleItemClick}
              homeItem={homeItem}
              item={item}
            />
          ))}
        </div>
      </div>

      {/* 底部随机文本 */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap "
          >
            <span className="text-xs text-text-tertiary font-medium bg-[var(--color-bg-tertiary)] rounded-full px-3 py-1">
              {bottomText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface DynamicItemProps {
  isMainMenu: boolean;
  handleItemClick: (item: NavItem) => void;
  homeItem: NavItem;
  isActive: boolean,
  isExpanded: boolean;
  isTransitioning: boolean;
  item?: NavItem;
}

let def_item: NavItem = {
  id: '未知',
  label: '未知',
  icon: FileQuestionMark,
  path: '未知',
  roles: ['player']
}

export const DynamicItem = ({ isMainMenu, handleItemClick, homeItem, isActive, isExpanded, isTransitioning, item }: DynamicItemProps) => {
  
  if (!item) {
    console.warn("Navtem 传入失败, 转而使用默认 NavItem !");
    item = def_item;
  }

  return (
    <>
      {/* 主页按钮 */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();

          if (isMainMenu) {
            handleItemClick(homeItem);
          } else if (item) {
            handleItemClick(item);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={isTransitioning}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
            relative flex items-center gap-2 px-2 py-1 rounded-full
            text-sm font-medium transition-all duration-300 cursor-pointer z-10
            ${isActive
            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-md'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
          }
          `}
        title={isMainMenu ? "主页" : item?.label}
        data-tauri-drag-region="false"
      >
        {isMainMenu
          ? (<Home className="w-4 h-4 flex-shrink-0" />)
          : (<item.icon className="w-4 h-4 flex-shrink-0" />)
        }

        <span
          className={`
              overflow-hidden whitespace-nowrap hidden sm:inline font-medium
              transition-all duration-500 ease-out
              ${isExpanded || isActive
              ? 'max-w-[120px] opacity-100 ml-1'
              : 'max-w-0 opacity-0 ml-0'
            }
            `}
        >
          {isMainMenu ? '主页' : item?.label}
        </span>

        {!isMainMenu && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full
                  text-white text-xs flex items-center justify-center font-bold shadow-md">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}

        {item.path && isActive && (
          <motion.div
            layoutId={`activeIndicator-${item.id}`}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5
                  bg-[var(--color-primary)] rounded-full shadow-lg"
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        )}
      </motion.button>
    </>
  )
}

export default DynamicIsland;
