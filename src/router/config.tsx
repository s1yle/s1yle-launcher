// 基础类型
export type {
  HeaderConfig,
  SidebarItemType,
  ContextMenuChildItem,
  RouteConfig,
  SidebarMenuItem,
} from './models'

export {
  SidebarGroup,
  RoutePosition,
  LayoutMode,
  SidebarType
} from './models'

// routes
export { routes } from './routes'

// sidebarMenus
export { sidebarMenuItems } from './sidebarMenus'

// 工具函数和依赖数据的函数
import { routes } from './routes';
import { sidebarMenuItems } from './sidebarMenus';
import type { RouteConfig, SidebarMenuItem } from './models';
import { SidebarGroup } from './models';
import { useLastVisitedStore } from '../stores/lastVisitedStore';

/** 拥有自己独立侧边栏的页面路径列表 */
export const pagesWithOwnSidebar = [
  '/account',
  '/download',
  '/game-settings',
  '/instance-list',
  '/settings'
];

/**
 * 获取指定路径的父路径
 * @param path - 当前路径
 * @returns 父路径
 */
export const getParentPath = (path: string): string => {
  const route = findRouteByPath(path, routes);
  return route?.parentPath || '/';
};

/**
 * 获取按组归类后的所有侧边栏菜单项
 * @returns 按 SidebarGroup 分组的菜单项
 */
export const getSidebarGroups = (): Record<SidebarGroup, SidebarMenuItem[]> => {
  const groups: Record<string, SidebarMenuItem[]> = {
    [SidebarGroup.ACCOUNT]: [],
    [SidebarGroup.GAME]: [],
    [SidebarGroup.COMMON]: [],
    [SidebarGroup.NONE]: []
  };

  sidebarMenuItems.forEach(item => {
    groups[item.group].push(item);
  });

  return groups as Record<SidebarGroup, SidebarMenuItem[]>;
};

/**
 * 根据路径递归查找路由配置
 * @param path - 目标路径
 * @param routeList - 路由配置列表
 * @returns 匹配的路由配置，未找到返回 undefined
 */
export const findRouteByPath = (path: string, routeList: RouteConfig[]): RouteConfig | undefined => {
  for (const route of routeList) {
    if (matchRoutePath(route.path, path)) return route;
    if (route.children) {
      const found = findRouteByPath(path, route.children);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * 匹配路由路径（支持 :param 动态段）
 * @param routePath - 路由定义的路径
 * @param actualPath - 实际请求的路径
 * @returns 是否匹配
 */
export const matchRoutePath = (routePath: string, actualPath: string): boolean => {
  const routeSegments = routePath.split('/');
  const actualSegments = actualPath.split('/');

  if (routeSegments.length !== actualSegments.length) return false;

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const actualSegment = actualSegments[i];

    if (routeSegment.startsWith(':')) continue;
    if (routeSegment !== actualSegment) return false;
  }

  return true;
};


/**
 * 自动跳转到路由的第一个子路由（记忆上次访问的子路由）
 * @param route - 父路由配置
 * @param onMenuClick - 导航回调
 */
export const autoJumpToFirstChild = (route: RouteConfig, onMenuClick: (path: string) => any) => {
  if (!route.path || !route.children?.length) return;

  const lastVisited = useLastVisitedStore.getState().getLastVisited(route.path);
  const validChildren = route.children.map(c => c.path);
  const targetPath = (lastVisited && validChildren.includes(lastVisited))
    ? lastVisited
    : route.children[0].path;

  if (targetPath !== location.pathname && onMenuClick) {
    onMenuClick(targetPath);
  }
}