import { useLocation, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { routes, findRouteByPath } from "../router/config";
import { parseRouteParams, RouteParamsContext } from "../router/routeParams";
import { useAnimation } from "../hooks/useAnimation";
import { ROUTE_DIRECTION_FRESH_MS, createRouteSlideVariants, routeFade } from "../utils/animations";
import { useNavStore } from "../stores/navStore";
import { usePageLifecycleStore } from "../stores/pageLifecycleStore";
import { safeNavigate } from "../router/navigation";
import { logger } from "../helper/logger";

/** 退出层硬超时：超过该时长无论动画是否完成都强制移除旧页面（framer-motion + React 19 下退出动画可能不完成） */
const EXIT_FALLBACK_MS = 800;

/** 路由层：当前页 + 正在退出的旧页 */
interface RouteLayer {
  /** 唯一标识（同一路径可能短暂共存两个层） */
  entryId: number;
  /** 页面路径（pathname） */
  path: string;
  component: React.ComponentType;
  params: Record<string, string>;
  /** 是否为退出中的旧层（新层始终排在数组末尾，自然盖住旧层） */
  isExiting: boolean;
  /** 挂载时捕获的变体（退出期间不随全局方向变化而改变） */
  variant: Variants;
}

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

/**
 * 计算路由层入场/出场变体：
 * - 动画关闭（useAnimation）→ 空变体
 * - 方向新鲜（导航后 ROUTE_DIRECTION_FRESH_MS 内）且为左右方向 → 滑动变体
 * - 其余 → 淡入淡出
 */
const computeRouteVariant = (enabled: boolean): Variants => {
  if (!enabled) return { initial: {}, animate: {}, exit: {} };

  const { direction: dir, directionAt } = useNavStore.getState();
  const isFresh = dir !== null && Date.now() - directionAt < ROUTE_DIRECTION_FRESH_MS;

  if (isFresh && (dir === 'right' || dir === 'left')) {
    return createRouteSlideVariants(dir === 'right');
  }
  return routeFade;
};

/**
 * 退出层硬超时移除器：动画完成回调失效时由它兜底移除（setState 驱动，必然生效）。
 */
const ExitRemover = ({ entryId, onRemove }: { entryId: number; onRemove: (id: number) => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onRemove(entryId), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [entryId, onRemove]);
  return null;
};

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
 *
 * 退出机制说明：不使用 AnimatePresence 的 safeToRemove（framer-motion 12 + React 19
 * 下退出元素可能永不 unmount，导致残影/隐形层/后续入场冻结）。
 * 改为自管理双层切换：旧层播放 exit 动画后由 onAnimationComplete 或硬超时
 * （EXIT_FALLBACK_MS）触发 setState 移除，移除必然发生。
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
  const { enabled } = useAnimation();
  const route = findRouteByPath(currentPathname, routes);

  const Component = route?.component;
  const dragPreview = useNavStore((s) => s.dragPreview);
  const [dragProgress, setDragProgress] = useState(0);
  const setMountedPath = usePageLifecycleStore((s) => s.setMountedPath);

  const nextEntryId = useRef(1);

  const [layers, setLayers] = useState<RouteLayer[]>(() => {
    if (!route || !Component) return [];
    return [
      {
        entryId: nextEntryId.current++,
        path: currentPathname,
        component: Component,
        params: parseRouteParams(route.path, currentPathname),
        isExiting: false,
        variant: computeRouteVariant(enabled),
      },
    ];
  });

  /** 移除指定退出层（幂等，供动画完成回调与硬超时共用） */
  const removeLayer = useCallback((entryId: number) => {
    setLayers((prev) => prev.filter((layer) => layer.entryId !== entryId));
  }, []);

  useEffect(() => {
    if (!route) return;
    if (!Component && route.children?.length) {
      const firstChild = route.children[0].path;
      if (firstChild && firstChild !== currentPathname) {
        safeNavigate(navigate, firstChild, { replace: true, currentPath: currentPathname });
      } else {
        logger.warn(`[RouterRenderer] 父路由无可跳转子路由: ${currentPathname}`);
      }
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      useNavStore.getState().setDirection(null);
    }, ROUTE_DIRECTION_FRESH_MS);
    return () => window.clearTimeout(timer);
  }, [currentPathname]);

  /** 路径变化：旧层标记退出，新层追加到末尾（盖住旧层） */
  useEffect(() => {
    if (!route || !Component) return;

    setLayers((prev) => {
      if (prev.some((layer) => !layer.isExiting && layer.path === currentPathname)) return prev;
      const exiting = prev
        .filter((layer) => !layer.isExiting)
        .map((layer) => ({ ...layer, isExiting: true }));
      return [
        ...exiting,
        {
          entryId: nextEntryId.current++,
          path: currentPathname,
          component: Component,
          params: parseRouteParams(route.path, currentPathname),
          isExiting: false,
          variant: computeRouteVariant(enabled),
        },
      ];
    });
    setMountedPath(currentPathname);
  }, [currentPathname, route, Component, enabled, setMountedPath]);

  if (!route || !Component) {
    console.error(`[RouterRenderer] 路由 "${currentPathname}" 未挂载 component，且无子路由可跳转`);
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

  return (
    <div className="h-full relative overflow-hidden">
      {layers.map((layer) => (
        <motion.div
          key={layer.entryId}
          className="absolute inset-0 flex overflow-hidden"
          variants={layer.variant}
          initial={layer.isExiting ? false : 'initial'}
          animate={layer.isExiting ? 'exit' : 'animate'}
          onAnimationComplete={
            layer.isExiting ? () => removeLayer(layer.entryId) : undefined
          }
        >
          {layer.isExiting && <ExitRemover entryId={layer.entryId} onRemove={removeLayer} />}
          <div style={sidebarStyle}>{sidebar}</div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <RouteParamsContext.Provider value={layer.params}>
              <Suspense fallback={<PageFallback />}>
                <layer.component />
              </Suspense>
            </RouteParamsContext.Provider>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RouterRenderer;
