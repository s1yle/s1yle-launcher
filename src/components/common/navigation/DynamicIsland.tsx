import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User, Home, ChevronDown, HomeIcon, FileQuestionMark, AlertTriangle, LogOut } from 'lucide-react';
import { useUserRoleStore, UserRole } from '@/stores/userRoleStore';
import { useAdminStore } from '@/stores/adminStore';
import { useAccountStore } from '@/stores/accountStore';
import { useLoginStore } from '@/stores/loginStore';
import { useNavStore } from '@/stores/navStore';
import { logoutAndShowLogin } from '@/api/window';
import { useNotification, ConfirmPopup } from '@/components/common';
import { getNavItemsByRole, type NavItem } from '@/config/navigationConfig';
import { autoJumpToFirstChild, findRouteByPath, routes } from '@/router/config';

export interface DynamicIslandProps {
  onMenuClick?: (path: string) => void;
}

const AVAILABLE_ROLES: UserRole[] = [UserRole.PLAYER, UserRole.ADMIN];
const TIMEOUT_IDLE = 30000;

const ROLE_CONFIG: Record<UserRole, { icon: typeof User; label: string; color: string }> = {
  [UserRole.PLAYER]: {
    icon: User,
    label: '玩家',
    color: 'text-blue-400'
  },
  [UserRole.ADMIN]: {
    icon: Crown,
    label: '服主',
    color: 'text-purple-400'
  },
  [UserRole.CREATOR]: {
    icon: User,
    label: '创建者',
    color: 'text-green-400'
  }
};

// TODO: 添加更有趣的显示
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
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [bottomText, setBottomText] = useState(BOTTOM_TEXTS[0]);
  const idleTimerRef = useRef<number | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartXRef = useRef(0);
  const navDragActiveRef = useRef(false);
  const navDragProgressRef = useRef(0);
  const navDragDirectionRef = useRef<'left' | 'right'>('right');
  const { error: notifyError } = useNotification();

  const navItems = useMemo(() => getNavItemsByRole(currentRole), [currentRole]);

  // available role >= 3 个时, 改为下拉框选择而非按钮toggle
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

  const getDirection = (targetPath: string): 'left' | 'right' => {
    const currentPath = location.pathname;
    const currentIndex = navItems.findIndex(
      item => currentPath === item.path || currentPath.startsWith(item.path + '/')
    );
    const targetIndex = navItems.findIndex(item => item.path === targetPath);

    if (currentIndex === -1 || targetIndex === -1 || targetIndex === currentIndex) {
      return 'right';
    }
    return targetIndex > currentIndex ? 'right' : 'left';
  };

  const handleItemClick = (item: NavItem) => {
    if (item.action) {
      item.action();
      return;
    }

    if (item.path && item.path !== location.pathname) {
      useNavStore.getState().setDirection(getDirection(item.path));

      const route = findRouteByPath(item.path, routes);
      if (route?.autoNavigateToFirstChild && route.children && route.children.length > 0 && onMenuClick) {
        autoJumpToFirstChild(route, onMenuClick);
        return;
      }

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
      handleRoleSwitch(currentRole === UserRole.PLAYER ? UserRole.ADMIN : UserRole.PLAYER);
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (role === currentRole || isTransitioning) return;

    // 角色切换校验
    if (role === UserRole.ADMIN) {
      const { isLoggedIn } = useAdminStore.getState();
      if (!isLoggedIn) {
        setShowRoleGuide(true);
        setShowRoleMenu(false);
        return;
      }
    }

    if (role === UserRole.PLAYER) {
      const { accounts } = useAccountStore.getState();
      if (accounts.length === 0) {
        setShowRoleGuide(true);
        setShowRoleMenu(false);
        return;
      }
    }

    const needsNavigate = location.pathname.startsWith('/');

    setShowRoleMenu(false);
    switchRole(role);

    if (needsNavigate) {
      useNavStore.getState().setDirection('right');
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
    roles: [UserRole.PLAYER, UserRole.ADMIN],
  };

  const handleLogout = async () => {
    useAdminStore.getState().logout();
    useLoginStore.getState().setLoggedOut();
    try {
      await logoutAndShowLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '退出登录失败';
      notifyError('退出登录失败', msg);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      return;
    }
  };

  // ── Long-press drag navigation ──

  const snapBackDrag = () => {
    const startProgress = navDragProgressRef.current;
    if (startProgress <= 0) {
      navDragActiveRef.current = false;
      useNavStore.getState().setDragPreview(null);
      return;
    }
    const startTime = performance.now();
    const duration = 200;
    const dir = navDragDirectionRef.current;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const progress = startProgress * (1 - eased);

      window.dispatchEvent(new CustomEvent('nav-drag-update', {
        detail: { progress, direction: dir },
      }));

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        navDragActiveRef.current = false;
        useNavStore.getState().setDragPreview(null);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleNavPointerMove = (e: PointerEvent) => {
    if (navDragActiveRef.current) {
      const totalDeltaX = e.clientX - pointerStartXRef.current;
      const island = islandRef.current;
      if (!island) return;

      const islandRect = island.getBoundingClientRect();
      const itemWidth = islandRect.width / Math.max(navItems.length, 1);
      const threshold = itemWidth * 1.2;
      const direction = totalDeltaX > 0 ? 'right' : 'left';

      const absDeltaX = Math.abs(totalDeltaX);
      const totalPages = absDeltaX / threshold;
      const integerPages = Math.floor(totalPages);
      const fractionalPage = totalPages - integerPages;

      navDragProgressRef.current = fractionalPage;
      navDragDirectionRef.current = direction;

      const currentPath = location.pathname;
      const currentIndex = navItems.findIndex(
        item => currentPath === item.path || currentPath.startsWith(item.path + '/')
      );
      if (currentIndex === -1) return;

      const n = navItems.length;
      let fromIndex: number;
      let toIndex: number;

      if (direction === 'right') {
        fromIndex = currentIndex + integerPages;
        toIndex = fromIndex + 1;
      } else {
        fromIndex = currentIndex - integerPages;
        toIndex = fromIndex - 1;
      }

      if (fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n) return;

      window.dispatchEvent(new CustomEvent('nav-drag-update', {
        detail: { progress: fractionalPage, direction },
      }));

      useNavStore.getState().setDragPreview({
        isDragging: true,
        fromPath: navItems[fromIndex].path,
        toPath: navItems[toIndex].path,
        direction,
      });
    } else if (longPressTimerRef.current !== null) {
      const deltaX = e.clientX - pointerStartXRef.current;
      if (Math.abs(deltaX) > 8) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        document.removeEventListener('pointermove', handleNavPointerMove);
        document.removeEventListener('pointerup', handleNavPointerUpEarly);
      }
    }
  };

  const handleNavPointerUpEarly = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    document.removeEventListener('pointermove', handleNavPointerMove);
    document.removeEventListener('pointerup', handleNavPointerUpEarly);
  };

  const handleNavDragPointerUp = () => {
    if (navDragActiveRef.current) {
      const progress = navDragProgressRef.current;
      navDragActiveRef.current = false;

      if (progress > 0.5) {
        const dragState = useNavStore.getState().dragPreview;
        if (dragState) {
          const { toPath, direction } = dragState;
          useNavStore.getState().setDirection(direction);
          useNavStore.getState().setDragPreview(null);

          const route = findRouteByPath(toPath, routes);
          if (route?.autoNavigateToFirstChild && route.children && route.children.length > 0 && onMenuClick) {
            autoJumpToFirstChild(route, onMenuClick);
          } else if (onMenuClick) {
            onMenuClick(toPath);
          } else {
            navigate(toPath);
          }
        }
      } else {
        snapBackDrag();
      }
    }
    document.removeEventListener('pointermove', handleNavPointerMove);
    document.removeEventListener('pointerup', handleNavPointerUpEarly);
    document.removeEventListener('pointerup', handleNavDragPointerUp);
    document.removeEventListener('pointercancel', handleNavDragPointerUp);
  };

  const handleNavPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (navItems.length < 2) return;

    pointerStartXRef.current = e.clientX;

    document.addEventListener('pointermove', handleNavPointerMove);
    document.addEventListener('pointerup', handleNavPointerUpEarly);

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      navDragActiveRef.current = true;
      navDragProgressRef.current = 0;

      document.removeEventListener('pointerup', handleNavPointerUpEarly);
      document.addEventListener('pointerup', handleNavDragPointerUp);
      document.addEventListener('pointercancel', handleNavDragPointerUp);
    }, 300);
  };

  return (
    <motion.div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
    >
      <motion.div
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
        whileHover={{ scale: 1.02, y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
            <div className="relative w-4 h-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentRole}
                  initial={{ opacity: 0, rotateY: -180, scale: 0.6 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: 180, scale: 0.6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <currentRoleConfig.icon className="w-4 h-4" />
                </motion.div>
              </AnimatePresence>
            </div>
            <span className="relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={currentRole}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap"
                >
                  {currentRoleConfig.label}
                </motion.span>
              </AnimatePresence>
            </span>
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
        <motion.div
          ref={navContainerRef}
          className="flex items-center gap-1 z-10 touch-none"
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.08,
              },
            },
          }}
          initial="initial"
          animate="animate"
          onPointerDown={handleNavPointerDown}
          style={{ touchAction: 'none' }}
        >
          {navItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
              }}
            >
              <DynamicItem
                isMainMenu={item.id === 'main'}
                isActive={isActive(item.path)}
                isExpanded={isExpanded}
                isTransitioning={isTransitioning}
                handleItemClick={handleItemClick}
                homeItem={homeItem}
                item={item}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* 退出登录按钮 */}
        <div className="w-px h-6 bg-[var(--color-border)]/30 flex-shrink-0 z-10" />
        <div className="relative flex-shrink-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutConfirm(!showLogoutConfirm);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-2 rounded-full text-[var(--color-text-secondary)] 
              hover:text-red-400 hover:bg-red-500/10 
                transition-all duration-200 cursor-pointer"
            title="退出登录"
            data-tauri-drag-region="false"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* 退出确认弹窗 */}
          <ConfirmPopup
            isOpen={showLogoutConfirm}
            size='lg'
            title="确认退出登录"
            message="确认退出登录？"
            confirmText="退出"
            cancelText="取消"
            confirmType="danger"
            showIcon
            iconType="warning"
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
            onClose={() => setShowLogoutConfirm(false)}
          />
        </div>
      </motion.div>

      {/* 角色引导弹窗 */}
      <AnimatePresence>
        {showRoleGuide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72
              bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
              shadow-2xl z-50 p-4"
            data-tauri-drag-region="false"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                  {currentRole === UserRole.ADMIN ? '需要玩家账户' : '需要服主账号'}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {currentRole === UserRole.ADMIN
                    ? '当前没有玩家账户。请先在账户管理中添加玩家账户，再切换到玩家身份。'
                    : '当前没有已登录的服主账号。请先在账户管理页面注册或登录服主账号。'}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowRoleGuide(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]
                      hover:bg-[var(--color-border)] transition-colors"
                  >
                    知道了
                  </button>
                  <button
                    onClick={() => {
                      setShowRoleGuide(false);
                      navigate('/account');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-[var(--color-primary)]/10 text-[var(--color-primary)]
                      hover:bg-[var(--color-primary)]/20 transition-colors"
                  >
                    去管理
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部随机文本 */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key={bottomText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
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

export interface DynamicItemProps {
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
  roles: [UserRole.PLAYER]
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
          if (useNavStore.getState().dragPreview?.isDragging) return;
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
            ? 'text-[var(--color-primary)] shadow-md'
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
            layoutId="activeIndicator"
            className="absolute inset-0 rounded-full bg-[var(--color-primary)]/15 -z-10"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </motion.button>
    </>
  )
}

export default DynamicIsland;
