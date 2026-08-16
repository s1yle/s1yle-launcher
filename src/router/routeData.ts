import { createContext, useContext } from 'react';

/**
 * 路由级数据上下文：由 RouterRenderer 按路由层注入 loader 结果，
 * 页面组件经 useRouteData<T>() 同步读取，挂载时数据已就绪。
 */
export const RouteDataContext = createContext<unknown>(null);

/**
 * 读取当前路由 loader 的返回数据。
 * 无 loader 或 loader 尚未完成时返回 null。
 */
export function useRouteData<T>(): T | null {
  return useContext(RouteDataContext) as T | null;
}