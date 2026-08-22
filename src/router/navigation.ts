import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { routes, findRouteByPath, getParentPath } from './config';
import { useNavStore } from '../stores/navStore';
import { useGameStore } from '../stores/gameStore';
import { usePageLifecycleStore } from '../stores/pageLifecycleStore';
import { logger } from '../helper/logger';

/** 安全导航选项 */
export interface SafeNavigateOptions {
  /** 是否替换当前历史记录 */
  replace?: boolean;
  /** 页面切换动画方向（传入则作为本次导航的滑动方向） */
  direction?: 'left' | 'right';
  /** 调用方当前所在路径（用于页面关闭检查；缺省时使用 location.pathname） */
  currentPath?: string;
}

/**
 * 解析目标路径：
 * - `:gameId` 自动替换为当前选中游戏（无游戏则拦截）
 * - 裸父路径（如 /game-manage）未匹配路由时兜底到首个子路由
 */
const resolveTargetPath = (path: string): string | null => {
  let target = path;

  if (target.includes(':gameId')) {
    const game = useGameStore.getState().getSelectedGame();
    if (!game) {
      logger.warn(`[safeNavigate] 未选中游戏，取消导航: ${target}`);
      return null;
    }
    target = target.split(':gameId').join(game.id);
  }

  if (!findRouteByPath(target, routes)) {
    const parentRoute = routes.find(r =>
      r.autoNavigateToFirstChild &&
      r.children?.length &&
      r.path !== target &&
      r.path.startsWith(target)
    );
    if (parentRoute?.path && parentRoute.children?.[0]?.path) {
      const firstChild = parentRoute.children[0].path;
      target = firstChild.includes(':gameId')
        ? (resolveTargetPath(firstChild) ?? target)
        : firstChild;
    }
  }

  return target;
};

/**
 * 安全导航（函数式，供非 Hook 场景使用）。
 *
 * 内置安全检查：
 * - 目标与当前页面相同 → no-op（防重复导航/双击）
 * - `:gameId` 自动替换，无选中游戏 → 拦截
 * - 目标路由不存在 → 兜底到父路由首个子路由
 * - 清理脏状态：拖拽预览（方向保留，陈旧方向由 RouterRenderer 的新鲜窗口自动失效）
 * - 页面关闭检查：location 与 DOM 实际挂载页面不一致时告警（僵尸页面，由 RouterRenderer
 *   自管理退出层保证最终收敛，此处仅作诊断）
 */
export function safeNavigate(
  navigate: NavigateFunction,
  path: string,
  options?: SafeNavigateOptions,
): boolean {
  const target = resolveTargetPath(path);
  if (!target) return false;

  const currentPath = options?.currentPath;
  if (target === currentPath) return false;

  useNavStore.getState().setDragPreview(null);
  if (options?.direction) {
    useNavStore.getState().setDirection(options.direction);
  }

  const { mountedPath } = usePageLifecycleStore.getState();
  if (mountedPath && currentPath && mountedPath !== currentPath) {
    logger.warn(
      `[safeNavigate] 检测到页面已切换/未完全关闭（mounted=${mountedPath}, current=${currentPath}）: ${target}`,
    );
  }

  // 记录导航历史（replace 时替换栈顶，否则入栈），供返回按钮回退到上次访问的路径
  useNavStore.getState().recordNavigation(target, options?.replace);

  navigate(target, { replace: options?.replace });
  return true;
}

/**
 * 安全导航 Hook：组件内统一导航入口，所有页面跳转都应经过它。
 *
 * @example
 * const safeNavigate = useSafeNavigate();
 * safeNavigate('/game-list');
 * safeNavigate('/game-manage/:gameId/game-settings', { direction: 'right' });
 */
export function useSafeNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (path: string, options?: SafeNavigateOptions) => {
      safeNavigate(navigate, path, { ...options, currentPath: options?.currentPath ?? location.pathname });
    },
    [navigate, location.pathname],
  );
}

/**
 * 跳过“重定向型”路由：若路径对应路由没有 component 但有子路由（会自动跳转到首个子路由），
 * 继续向上取父路径，避免返回时落到一个会立即再次重定向的容器页（防止死循环）。
 */
const skipRedirectors = (path: string): string => {
  let cur = path;
  for (let i = 0; i < 10; i++) {
    const route = findRouteByPath(cur, routes);
    if (route && !route.component && route.children?.length) {
      cur = getParentPath(cur);
    } else {
      break;
    }
  }
  return cur;
};

/** 判断两条路径是否为同级页面（拥有相同的 parentPath） */
const sameParentPath = (a: string, b: string): boolean => {
  const pa = findRouteByPath(a, routes)?.parentPath;
  const pb = findRouteByPath(b, routes)?.parentPath;
  return pa != null && pb != null && pa === pb;
};

/**
 * 返回上一页：优先回退到历史栈中的上一项（上次实际访问的路径），
 * 历史栈为空时回退到 routes 配置的父路径（parentPath）。
 *
 * 同级页面（如设置下的 外观 / 全局游戏设置，或下载下的 游戏下载 / 整合包下载）
 * 之间不互相回退，直接回到它们共同的上一级，避免“同级之间来回 back”。
 */
export function useGoBack() {
  const navigate = useSafeNavigate();

  return useCallback(() => {
    const state = useNavStore.getState();
    const current = state.history[state.history.length - 1] ?? '/';
    const popped = state.popHistory();
    let target: string;
    if (!popped) {
      target = getParentPath(current);
    } else if (sameParentPath(popped, current)) {
      target = getParentPath(current);
    } else {
      target = popped;
    }
    target = skipRedirectors(target);
    navigate(target, { replace: true });
  }, [navigate]);
}

