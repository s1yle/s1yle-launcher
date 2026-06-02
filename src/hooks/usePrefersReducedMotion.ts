import { useState, useEffect } from 'react';

/**
 * ## usePrefersReducedMotion — 系统减弱动效偏好检测
 *
 * 响应 `prefers-reduced-motion: reduce` CSS 媒体查询。
 * 初始值通过 `window.matchMedia` 同步获取（无闪烁），
 * 通过 `change` 事件监听后续变化（如用户切换系统偏好）。
 *
 * @returns `true` 表示用户开启了系统级"减弱动效"，应禁用或降级动画
 *
 * @example
 * ```tsx
 * const reduced = usePrefersReducedMotion();
 * const enabled = !reduced && animation.enabled;
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
