import { useParams } from 'react-router-dom';
import { createContext, useContext } from 'react';

/**
 * 解析路由路径中的 :param 动态段
 * @param routePath - 路由定义的路径（如 /instance-manage/:instanceId）
 * @param actualPath - 实际访问路径
 * @returns 参数映射 { instanceId: 'xxx' }
 */
export const parseRouteParams = (routePath: string, actualPath: string): Record<string, string> => {
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

/** 路由参数上下文（由 RouterRenderer 注入） */
export const RouteParamsContext = createContext<Record<string, string> | null>(null);

/**
 * 获取路由参数 Hook。
 * 优先使用自定义路由上下文（本项目自研路由），兜底 React Router 原生 useParams。
 */
export const useRouteParams = (): Record<string, string> => {
  const reactRouterParams = useParams();
  const contextParams = useContext(RouteParamsContext);
  const params = contextParams || reactRouterParams || {};

  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;
};