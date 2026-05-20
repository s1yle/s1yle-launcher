import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import SmartSidebar from './components/sidebar/SmartSidebar';
import DynamicIsland from './components/navigation/DynamicIsland';
import FloatingControls from './components/header/FloatingControls';
import { routes, findRouteByPath, LayoutMode, pagesWithOwnSidebar } from './router/config';
import { useNavStore } from './stores/navStore';
import { useThemeStore } from './stores/themeStore';
import { useAppStore } from './stores/appStore';
import { useInstanceStore } from './stores/instanceStore';
import { useDownloadStore } from './stores/downloadStore';
import { useUIModeStore } from './stores/uiModeStore';
import { logger } from './helper/logger';
import RouterRenderer from './components/RouterRenderer';
import { useWindowPosition } from './hooks/useWindowPosition';
import FloatingDownloadButton from './components/FloatingDownloadButton';
import { PanelLeftClose, PanelLeftOpen } from './icons';
import './helper/i18n';

const PAGE_TRANSITION_DURATION = 0.10;
const SIDEBAR_TRANSITION_DURATION = 0.2;
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 220;
const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebar-width';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Nav Store 模式
  const { setCurrentPath, setNavigating } = useNavStore();
  const isNavigating = useNavStore().isNavigating;

  const { mode: uiMode } = useUIModeStore();
  const animLockRef = useRef(false);

  // 获取 sidebar 的宽度
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT_WIDTH;
      return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, parsed));
    } catch {
      return SIDEBAR_DEFAULT_WIDTH;
    }
  });

  // 获取sidebar 的收起/展开 状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];

  const isFullscreen = currentRoute.layoutMode === LayoutMode.FULLSCREEN;

  const isInstanceManagePage = location.pathname.startsWith('/instance-manage/');
  const hasOwnSidebar = uiMode === 'island' && (
    pagesWithOwnSidebar.some(path => location.pathname.startsWith(path)) ||
    isInstanceManagePage
  );

  const handleMenuClick = (targetPath: string) => {
    if (animLockRef.current || targetPath === location.pathname) return;

    let finalPath = targetPath;

    // 处理带有 instanceId 的 路径
    if (finalPath.includes(':instanceId')) {
      const instance = useInstanceStore.getState().getSelectedInstance();
      if (instance) {
        finalPath = finalPath.replace(':instanceId', instance.id);
      } else {
        logger.warn('No instance selected for instance-specific route');
        return;
      }
    }

    animLockRef.current = true;
    setNavigating(true);
    setCurrentPath(finalPath);
    navigate(finalPath);
    setTimeout(() => {
      animLockRef.current = false;
      setNavigating(false);
    }, (Math.max(PAGE_TRANSITION_DURATION, SIDEBAR_TRANSITION_DURATION) * 1000) + 100);
  };

  useEffect(() => {
    setCurrentPath(location.pathname);
    logger.info(`Navigated to ${location.pathname}`);
  }, [location.pathname, setCurrentPath]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(sidebarWidth)));
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(newVal));
      } catch {
        // ignore
      }
      return newVal;
    });
  }, []);

  const shouldShowSidebar = !isFullscreen && !isSidebarCollapsed;

  const sidebarFooter = (
    <button
      onClick={toggleSidebar}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
      title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      <PanelLeftClose className="w-4 h-4" />
      <span>收起侧边栏</span>
    </button>
  );

  const collapsedToggleButton = !isFullscreen && isSidebarCollapsed && (
    <button
      onClick={toggleSidebar}
      className="fixed left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-md"
      title="展开侧边栏"
    >
      <PanelLeftOpen className="w-4 h-4" />
    </button>
  );

  return (
    <div className="h-screen flex flex-col " onContextMenu={handleContextMenu}>
      {uiMode === 'island' ? (
        <>
          {/* 灵动岛模式 */}
          <FloatingControls />
          <DynamicIsland onMenuClick={handleMenuClick} />

          {/* 顶部拖曳区域 - 覆盖灵动岛两侧的空间 */}
          <div
            className="fixed top-0 left-0 right-0 h-20 z-40 shadow-[var(--shadow-md)]"
            data-tauri-drag-region="true"
          >
            <div className="absolute inset-0" data-tauri-drag-region />
          </div>


          {/* //外层动画容器 */}
          <AnimatePresence mode='wait'>
            <motion.div
              className='bg-[var(--color-bg-secondary)]'
              style={{ width: 'auto', height: '100%', marginTop: '80px' }}
              exit={{ x: -sidebarWidth, opacity: 0 }}
              transition={{
                duration: SIDEBAR_TRANSITION_DURATION,
              }}
            >
              {hasOwnSidebar && !isSidebarCollapsed ? (
                // 有独立侧边栏的页面：显示侧边栏 + 内容
                <div
                  className="flex flex-1 overflow-hidden"
                  style={{ height: '100%', }}
                >

                  {/* 侧边栏容器 */}
                  <AnimatePresence mode='popLayout'>
                    {!isNavigating && !isSidebarCollapsed ? (
                      <motion.div
                        className="flex-shrink-0 fixed left-0 top-0 bottom-0 z-30 
                        border-[var(--color-border)] 
                        shadow-[var(--shadow-lg)] 
                        overflow-hidden"
                        style={{ 
                          width: sidebarWidth, top: '80px', 
                        }}
                        initial={{ x: -sidebarWidth, opacity: 0 }}
                        exit={{ x: -sidebarWidth, opacity: 0 }}
                        animate={{
                          x: 0,
                          opacity: 1,
                        }}
                        transition={{
                          duration: SIDEBAR_TRANSITION_DURATION,
                        }}
                      >
                        <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} footer={sidebarFooter} />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-primary)] hover:opacity-50 transition-opacity z-10"
                          onMouseDown={handleMouseDown}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <main
                    className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-custom"
                    style={{ background: 'var(--bg-primary)', padding: `40px 0 0 0`, paddingLeft: sidebarWidth }}
                  >
                    <RouterRenderer />
                  </main>

                </div>
              ) : (
                // 普通页面：只显示内容区
                < main
                  className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-custom pt-30"
                  style={{ background: 'var(--bg-primary)', height: '100%' }}
                >
                  <RouterRenderer />
                </main>
              )}
            </motion.div>
          </AnimatePresence>
          {/* 侧边栏折叠按钮 */}
          {collapsedToggleButton}

        </>
      ) : (
        <>
          {/* 经典模式 */}
          <Header type={currentRoute.header.type === 'main' ? 'main' : 'sub'} title={currentRoute.header.title} />

          <div className="flex flex-1 overflow-hidden ">
            <AnimatePresence>
              {shouldShowSidebar && (
                <motion.div
                  key="sidebar"
                  className="flex-shrink-0 relative"
                  style={{ width: sidebarWidth }}
                  initial={{ x: -sidebarWidth, opacity: 0 }}
                  exit={{ x: -sidebarWidth, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                  }}
                  transition={{
                    duration: SIDEBAR_TRANSITION_DURATION,
                    ease: 'easeInOut'
                  }}
                >
                  <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} footer={sidebarFooter} />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-primary)] hover:opacity-50 transition-opacity z-10"
                    onMouseDown={handleMouseDown}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <main
              className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-custom"
              style={{ background: 'var(--bg-primary)' }}
            >
              <RouterRenderer />
            </main>
          </div>
          {collapsedToggleButton}
        </>
      )
      }
    </div >
  );
};

function App() {
  const initTheme = useThemeStore((s) => s.init);
  const initApp = useAppStore((s) => s.init);
  const initInstances = useInstanceStore((s) => s.init);
  const setupDownloadListeners = useDownloadStore((s) => s.setupEventListeners);

  useWindowPosition();

  useEffect(() => {
    initTheme();
    initApp();
    initInstances();
  }, [initTheme, initApp, initInstances]);

  useEffect(() => {
    const cleanup = setupDownloadListeners();
    return cleanup;
  }, [setupDownloadListeners]);

  // 监听角色切换事件（目前主要用于日志记录）
  useEffect(() => {
    const handleRoleSwitch = (event: CustomEvent) => {
      // 导航已在 DynamicIsland 组件中通过 useNavigate 处理
      // 这里只需要记录日志即可
    };

    window.addEventListener('role-switch', handleRoleSwitch as EventListener);
    return () => {
      window.removeEventListener('role-switch', handleRoleSwitch as EventListener);
    };
  }, []);

  return (
    <Router>
      <MainLayout />
      <FloatingDownloadButton />
    </Router>
  );
}

export default App;
