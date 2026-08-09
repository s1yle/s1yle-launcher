import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useEffect, useState } from "react";
import { routes, findRouteByPath } from "../router/config";
import { parseRouteParams, RouteParamsContext } from "../router/routeParams";
import { useAnimation } from "../hooks/useAnimation";
import { DURATION, pageTransition } from "../utils/animations";
import { useNavStore } from "../stores/navStore";

const PageFallback = () => (
  <div className="h-full w-full flex items-center justify-center opacity-50 text-sm">
    Loading…
  </div>
);

const MissingComponentPanel = ({ path }: { path: string }) => (
  <div className="h-full flex items-center justify-center bg-red-950/40 text-red-300 text-sm p-6 text-center">
    路由未匹配：{path}
    <br />
    请检查 src/router/routes.tsx 中是否存在该路径对应的路由定义。
  </div>
);

interface RouterRendererProps {
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  sidebarWidth?: number;
  sidebarTransitionDuration?: number;
}

/**
 * 路由渲染器组件。
 * 根据当前路径匹配路由配置，动态渲染对应的页面组件。
 * 支持页面切换动画（左右滑动）和拖拽预览模式。
 */
const RouterRenderer = ({
  sidebar,
  showSidebar = false,
  sidebarWidth = 240,
  sidebarTransitionDuration = 0.3,
}: RouterRendererProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPathname = location.pathname;
  const { enabled, transition } = useAnimation();
  const route = findRouteByPath(currentPathname, routes);

  const Component = route?.component;
  const dragPreview = useNavStore((s) => s.dragPreview);
  const [dragProgress, setDragProgress] = useState(0);

  useEffect(() => {
    if (!route) return;
    if (!Component && route.children?.length) {
      navigate(route.children[0].path, { replace: true });
    }
  }, [route, Component, navigate, currentPathname]);

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

  if (!route) {
    console.error(`[RouterRenderer] 路由 "${currentPathname}" 未匹配任何定义`);
    return <MissingComponentPanel path={currentPathname} />;
  }

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
    const FromComponent = fromRoute?.component;
    const ToComponent = toRoute?.component;
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
                <Suspense fallback={<PageFallback />}>
                  <FromComponent />
                </Suspense>
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
                <Suspense fallback={<PageFallback />}>
                  <ToComponent />
                </Suspense>
              </RouteParamsContext.Provider>
            </div>
          </div>
        )}
      </div>
    );
  }

  const variant = (() => {
    if (!enabled) return { initial: {}, animate: {}, exit: {} };

    const dir = useNavStore.getState().direction;
    useNavStore.getState().setDirection(null);

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

  if (!Component) {
    console.error(`[RouterRenderer] 路由 "${currentPathname}" 未挂载 component，且无子路由可跳转`);
    return <MissingComponentPanel path={currentPathname} />;
  }

  const params = parseRouteParams(route.path, currentPathname);

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
              <Suspense fallback={<PageFallback />}>
                <Component />
              </Suspense>
            </RouteParamsContext.Provider>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RouterRenderer;