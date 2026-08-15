import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { routes, findRouteByPath } from './config';
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
