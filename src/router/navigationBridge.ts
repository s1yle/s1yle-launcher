import type { NavigateFunction } from 'react-router-dom';

let navigateFn: NavigateFunction | null = null;

/** 注册路由导航函数（在 Router 内部调用一次） */
export function registerNavigator(fn: NavigateFunction) {
  navigateFn = fn;
}

/** 供非组件（store/helper）调用的路由跳转 */
export function navigateTo(path: string, replace = false) {
  navigateFn?.(path, { replace });
}