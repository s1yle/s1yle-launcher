import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import React, { createContext, useContext, useEffect, useState } from "react";
import { routes, findRouteByPath } from "../router/config";
import {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  DownloadGame,
  DownloadModpack,
  VersionDetailWithInstall,
  MicrosoftAccount,
  OfflineAccount,
  ThirdParty,
  AppearanceSettings,
  JavaSettings,
  Multiplayer,
  Feedback,
  Hint,
  VersionInstall,
  InstanceGameSettings,
} from '../pages';
import { AdminServers, AdminAnalytics, AdminUpload } from '../pages/admin';
import { useAnimation } from "../hooks/useAnimation";
import { DURATION, pageTransition } from "../utils/animations";
import { useNavStore } from "../stores/navStore";

const componentMap: Record<string, React.FC> = {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  DownloadGame,
  DownloadModpack,
  VersionDetailWithInstall,
  MicrosoftAccount,
  OfflineAccount,
  ThirdParty,
  AppearanceSettings,
  JavaSettings,
  Multiplayer,
  Feedback,
  Hint,
  VersionInstall,
  InstanceGameSettings,
  AdminServers,
  AdminAnalytics,
  AdminUpload
};

const parseRouteParams = (routePath: string, actualPath: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const routeSegments = routePath.split('/');
  const actualSegments = actualPath.split('/');

  for (let i = 0; i < routeSegments.length; i++) {
    if (routeSegments[i].startsWith(':')) {
      params[routeSegments[i].slice(1)] = actualSegments[i];
    }
  }

  return params;
};

const RouteParamsContext = createContext<Record<string, string> | null>(null);

export const useRouteParams = (): Record<string, string> => {
  const reactRouterParams = useParams();
  const contextParams = useContext(RouteParamsContext);
  const params = contextParams || reactRouterParams || {};

  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;
};

interface RouterRendererProps {
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  sidebarWidth?: number;
  sidebarTransitionDuration?: number;
}

/**
 * 专门用于渲染页面内容
 */
const RouterRenderer = ({
  sidebar,
  showSidebar = false,
  sidebarWidth = 240,
  sidebarTransitionDuration = 0.3,
}: RouterRendererProps) => {
  const location = useLocation();
  const currentPathname = location.pathname;
  const { enabled, transition } = useAnimation();
  const route = findRouteByPath(currentPathname, routes);
  if (!route) return null;

  const Component = componentMap[route.componentName];
  if (!Component) return null;

  const params = parseRouteParams(route.path, currentPathname);

  // ── Drag preview ──
  const dragPreview = useNavStore((s) => s.dragPreview);
  const [dragProgress, setDragProgress] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { progress } = (e as CustomEvent).detail;
      setDragProgress(progress);
    };
    window.addEventListener('nav-drag-update', handler);
    return () => window.removeEventListener('nav-drag-update', handler);
  }, []);

  useEffect(() => {
    if (!dragPreview?.isDragging) {
      setDragProgress(0);
    }
  }, [dragPreview?.isDragging]);

  const sidebarTransitionCss = `width ${sidebarTransitionDuration}s ease-in-out, opacity ${sidebarTransitionDuration}s ease-in-out`;

  const sidebarStyle: React.CSSProperties = {
    width: showSidebar ? sidebarWidth : 0,
    opacity: showSidebar ? 1 : 0,
    overflow: 'hidden',
    flexShrink: 0,
    transition: sidebarTransitionCss,
  };

  if (dragPreview?.isDragging) {
    const fromRoute = findRouteByPath(dragPreview.fromPath, routes);
    const toRoute = findRouteByPath(dragPreview.toPath, routes);
    const FromComponent = fromRoute ? componentMap[fromRoute.componentName] : null;
    const ToComponent = toRoute ? componentMap[toRoute.componentName] : null;
    const fromParams = fromRoute ? parseRouteParams(fromRoute.path, dragPreview.fromPath) : {};
    const toParams = toRoute ? parseRouteParams(toRoute.path, dragPreview.toPath) : {};
    const p = dragProgress;

    const fromX = dragPreview.direction === 'right'
      ? `${-p * 100}%`
      : `${p * 100}%`;

    const toX = dragPreview.direction === 'right'
      ? `${(1 - p) * 100}%`
      : `${-(1 - p) * 100}%`;

    return (
      <div className="h-full relative overflow-hidden">
        {FromComponent && (
          <div
            className="absolute inset-0 flex"
            style={{ transform: `translateX(${fromX})` }}
          >
            {sidebar && <div style={sidebarStyle}>{sidebar}</div>}
            <div className="flex-1 overflow-y-auto">
              <RouteParamsContext.Provider value={fromParams}>
                <FromComponent />
              </RouteParamsContext.Provider>
            </div>
          </div>
        )}
        {ToComponent && (
          <div
            className="absolute inset-0 flex"
            style={{ transform: `translateX(${toX})` }}
          >
            {sidebar && <div style={sidebarStyle}>{sidebar}</div>}
            <div className="flex-1 overflow-y-auto">
              <RouteParamsContext.Provider value={toParams}>
                <ToComponent />
              </RouteParamsContext.Provider>
            </div>
          </div>
        )}
      </div>
    );
  }

  const variant = (() => {
    console.warn("动画没有启用，跳过");
    if (!enabled) return { initial: {}, animate: {}, exit: {} };

    const dir = useNavStore.getState().direction;
    useNavStore.getState().setDirection(null);
    console.warn("方向：", dir);
    

    if (dir === 'right') {
      return {
        initial: { opacity: 1, x: '100%' },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: '-100%' },
      };
    }
    if (dir === 'left') {
      return {
        initial: { opacity: 1, x: '-100%' },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: '100%' },
      };
    }
    return pageTransition;
  })();

  return (
    <div className="h-full relative overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPathname}
          className="absolute inset-0 flex overflow-hidden"
          variants={variant}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition({
            x: { duration: DURATION.PAGE_TRANSITION, ease: [0.25, 0.1, 0.25, 1] },
            opacity: { duration: DURATION.PAGE_TRANSITION * 0.5, ease: 'easeOut' },
          })}
        >
          <div style={sidebarStyle}>{sidebar}</div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <RouteParamsContext.Provider value={params}>
              <Component />
            </RouteParamsContext.Provider>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RouterRenderer;
