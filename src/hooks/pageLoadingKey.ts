import { createContext, useContext } from 'react';

/**
 * 页面级加载 key 上下文：由 RouterRenderer 按路由层实例注入（page:{entryId}），
 * 确保每个页面实例的加载状态相互隔离，避免全局单一 key 的跨页面竞态。
 */
export const PageLoadingKeyContext = createContext<string | null>(null);

/**
 * 获取当前页面实例的加载 key。
 * 不在路由层内（无上下文）时回退到全局 'page:loading'，保证非路由组件可用。
 */
export function usePageLoadingKey(): string {
  const key = useContext(PageLoadingKeyContext);
  return key ?? 'page:loading';
}