import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import SmartSidebar from './components/sidebar/SmartSidebar';
import { routes } from './router/config';
import { useNavStore } from './stores/navStore';
import { useThemeStore } from './stores/themeStore';
import { useAppStore } from './stores/appStore';
import { logger } from './helper/logger';
import RouterRenderer from './components/RouterRenderer';
import './helper/i18n';

const BACKGROUND_IMAGE_URL = './src/assets/img/bg-1.png';
const PAGE_TRANSITION_DURATION = 0.35;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPath, setNavigating } = useNavStore();
  const animLockRef = useRef(false);

  const findRouteByPath = (path: string, routeList: typeof routes): typeof routes[0] | undefined => {
    for (const route of routeList) {
      if (route.path === path) return route;
      if (route.children) {
        const found = findRouteByPath(path, route.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];

  const handleMenuClick = (targetPath: string) => {
    if (animLockRef.current || targetPath === location.pathname) return;
    animLockRef.current = true;
    setNavigating(true);
    setCurrentPath(targetPath);
    navigate(targetPath);
    setTimeout(() => {
      animLockRef.current = false;
      setNavigating(false);
    }, PAGE_TRANSITION_DURATION * 1000 + 100);
  };

  useEffect(() => {
    setCurrentPath(location.pathname);
    logger.info(`Navigated to ${location.pathname}`);
  }, [location.pathname, setCurrentPath]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!true) e.preventDefault();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" onContextMenu={handleContextMenu}>
      <Header type={currentRoute.header.type === 'main' ? 'main' : 'sub'} title={currentRoute.header.title} />
      <div className="flex flex-1 overflow-hidden">
        <SmartSidebar onMenuClick={handleMenuClick} showAllGroups={true} />
        <main
          className="flex-1 overflow-auto relative"
          style={{ background: `url(${BACKGROUND_IMAGE_URL}) no-repeat center center / cover`, backgroundAttachment: 'fixed' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{
                duration: PAGE_TRANSITION_DURATION,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div className="relative z-10 h-full rounded-lg shadow-lg">
                <div className="p-8">
                  <RouterRenderer />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

function App() {
  const initTheme = useThemeStore((s) => s.init);
  const initApp = useAppStore((s) => s.init);

  useEffect(() => {
    initTheme();
    initApp();
  }, [initTheme, initApp]);

  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
