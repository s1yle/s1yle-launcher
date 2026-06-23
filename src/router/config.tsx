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

export const pagesWithOwnSidebar = [
  '/account',
  '/download',
  '/game-settings',
  '/instance-list',
  '/settings'
];

export const getParentPath = (path: string): string => {
  const route = findRouteByPath(path, routes);
  return route?.parentPath || '/';
};

// 获取到所有的 SidebarMenuItems
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