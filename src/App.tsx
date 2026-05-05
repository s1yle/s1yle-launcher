import { useEffect, useRef } from 'react';
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
import './helper/i18n';

const PAGE_TRANSITION_DURATION = 0.15;
const SIDEBAR_TRANSITION_DURATION = 0.25;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPath, setNavigating } = useNavStore();
  const animLockRef = useRef(false);

  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];

  const isFullscreen = currentRoute.layoutMode === LayoutMode.FULLSCREEN;

  const handleMenuClick = (targetPath: string) => {
    if (animLockRef.current || targetPath === location.pathname) return;
    animLockRef.current = true;
    setNavigating(true);
    setCurrentPath(targetPath);
    navigate(targetPath);
    setTimeout(() => {
      animLockRef.current = false;
      setNavigating(false);
    }, (Math.max(PAGE_TRANSITION_DURATION, SIDEBAR_TRANSITION_DURATION) * 1000) + 100);
  };

  useEffect(() => {
    setCurrentPath(location.pathname);
    logger.info(`Navigated to ${location.pathname}`);
  }, [location.pathname, setCurrentPath]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-screen flex flex-col " onContextMenu={handleContextMenu}>
      <Header type={currentRoute.header.type === 'main' ? 'main' : 'sub'} title={currentRoute.header.title} />
      <div className="flex flex-1 overflow-hidden ">
        <AnimatePresence>
          {!isFullscreen && (
            <motion.div
              key="sidebar"
              className="flex-shrink-0"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                duration: SIDEBAR_TRANSITION_DURATION,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{ overflow: 'hidden' }}
            >
              <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} />
            </motion.div>
          )}
        </AnimatePresence>
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
