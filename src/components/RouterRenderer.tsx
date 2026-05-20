import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import React, { createContext, useContext } from "react";
import { routes, findRouteByPath } from "../router/config";
import {
  Home,
  AccountList,
  AccountListWithSidebar,
  InstanceManage,
  InstanceList,
  DownloadGame,
  DownloadModpack,
  VersionDetailWithInstall,
  MicrosoftAccount,
  OfflineAccount,
  Settings,
  Multiplayer,
  Feedback,
  Hint,
  VersionInstall,
  InstanceGameSettings
} from '../pages';
import { AdminServers, AdminAnalytics, AdminUpload } from '../pages/admin';
import { useUIModeStore, type PageAnimationDirection } from "../stores/uiModeStore";

const PAGE_TRANSITION_DURATION = 0.4;

const componentMap: Record<string, React.FC> = {
  Home,
  AccountList,
  AccountListWithSidebar,
  InstanceManage,
  InstanceList,
  DownloadGame,
  DownloadModpack,
  VersionDetailWithInstall,
  MicrosoftAccount,
  OfflineAccount,
  Settings,
  Multiplayer,
  Feedback,
  Hint,
  VersionInstall,
  InstanceGameSettings,
  AdminServers,
  AdminAnalytics,
  AdminUpload
};

const findComponentForPath = (pathname: string): React.FC | null => {
  const route = findRouteByPath(pathname, routes);
  if (!route) return null;
  return componentMap[route.componentName] || null;
};

// 手动解析路由参数
const parseRouteParams = (routePath: string, actualPath: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const routeSegments = routePath.split('/');
  const actualSegments = actualPath.split('/');

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const actualSegment = actualSegments[i];

    if (routeSegment.startsWith(':')) {
      const paramName = routeSegment.slice(1);
      params[paramName] = actualSegment;
    }
  }

  return params;
};

// 创建路由参数的 Context
const RouteParamsContext = createContext<Record<string, string> | null>(null);

// 自定义 hook 用于获取路由参数
export const useRouteParams = (): Record<string, string> => {
  const reactRouterParams = useParams();
  const contextParams = useContext(RouteParamsContext);

  // 优先使用 context 中的参数（手动解析的）
  // 如果没有，则使用 React Router 的参数
  return contextParams || reactRouterParams || {};
};

const getAnimationValues = (direction: PageAnimationDirection, enabled: boolean) => {
  if (!enabled) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  const yEnter = direction === 'slide-up' ? 30 : -30;
  const yExit = direction === 'slide-down' ? -30 : 30;

  return {
    initial: { opacity: 0, y: yEnter },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: yExit },
  };
};

const RouterRenderer = () => {
  const location = useLocation();
  const currentPathname = location.pathname;
  const { animation } = useUIModeStore();

  const route = findRouteByPath(currentPathname, routes);
  if (!route) return null;

  const Component = componentMap[route.componentName];
  if (!Component) return null;

  const params = parseRouteParams(route.path, currentPathname);
  const animationValues = getAnimationValues(animation.direction, animation.enabled);

  return (
    <div className="h-full relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPathname}
          className="absolute inset-0"
          initial={animationValues.initial}
          animate={animationValues.animate}
          exit={animationValues.exit}
          transition={{
            duration: PAGE_TRANSITION_DURATION,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <RouteParamsContext.Provider value={params}>
            <Component />
          </RouteParamsContext.Provider>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RouterRenderer;
