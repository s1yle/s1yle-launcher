import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import SmartSidebar from './components/sidebar/SmartSidebar';
import { routes, findRouteByPath, LayoutMode } from './router/config';
import { useNavStore } from './stores/navStore';
import { useThemeStore } from './stores/themeStore';
import { useAppStore } from './stores/appStore';
import { useInstanceStore } from './stores/instanceStore';
import { useDownloadStore } from './stores/downloadStore';
import { logger } from './helper/logger';
import RouterRenderer from './components/RouterRenderer';
import { useWindowPosition } from './hooks/useWindowPosition';
import FloatingDownloadButton from './components/FloatingDownloadButton';
import { PanelLeftClose, PanelLeftOpen } from './icons';
import './helper/i18n';

const PAGE_TRANSITION_DURATION = 0.15;
const SIDEBAR_TRANSITION_DURATION = 0.25;
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 220;
const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebar-width';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPath, setNavigating } = useNavStore();
  const animLockRef = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT_WIDTH;
      return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, parsed));
    } catch {
      return SIDEBAR_DEFAULT_WIDTH;
    }
  });
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

  const handleMenuClick = (targetPath: string) => {
    if (animLockRef.current || targetPath === location.pathname) return;
    
    let finalPath = targetPath;
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
      <Header type={currentRoute.header.type === 'main' ? 'main' : 'sub'} title={currentRoute.header.title} />
      <div className="flex flex-1 overflow-hidden ">
        <AnimatePresence>
          {shouldShowSidebar && (
            <motion.div
              key="sidebar"
              className="flex-shrink-0 relative"
              style={{ width: sidebarWidth }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                duration: SIDEBAR_TRANSITION_DURATION,
                ease: [0.25, 0.1, 0.25, 1],
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
        {collapsedToggleButton}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden relative noise-bg gradient-bg scrollbar-custom"
          style={{ background: 'var(--color-bg-primary)' }}
        >
          <RouterRenderer />
        </main>
      </div>
    </div>
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

  return (
    <Router>
      <MainLayout />
      <FloatingDownloadButton />
    </Router>
  );
}

export default App;
