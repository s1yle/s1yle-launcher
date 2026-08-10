import { routes } from './routes';
import { LayoutMode, RouteConfig, SidebarGroup, SidebarMenuItem } from './models';

/** 侧边栏分组头部元数据 */
const GROUP_META: Record<SidebarGroup, { id: string; title: string; titleI18nKey: string }> = {
  [SidebarGroup.ACCOUNT]: { id: 'account', title: 'Account', titleI18nKey: 'sidebar.group.account' },
  [SidebarGroup.GAME]: { id: 'game', title: 'Game', titleI18nKey: 'sidebar.group.game' },
  [SidebarGroup.COMMON]: { id: 'common', title: 'Common', titleI18nKey: 'sidebar.group.common' },
  [SidebarGroup.NONE]: { id: 'none', title: '', titleI18nKey: '' },
};

/** 由路由元数据构建单个侧边栏菜单项（递归） */
function buildMenuItem(route: RouteConfig, group: SidebarGroup): SidebarMenuItem {
  const menu = route.menu;
  const children: SidebarMenuItem[] = [];
  for (const child of route.children ?? []) {
    if (!child.menu || child.layoutMode === LayoutMode.FULLSCREEN) continue;
    children.push(buildMenuItem(child, group));
  }
  children.push(...(menu?.extras ?? []));
  return {
    id: menu?.id ?? route.path,
    type: 'route',
    title: menu?.title ?? route.header.title,
    titleI18nKey: menu?.titleI18nKey ?? route.header.titleI18nKey ?? '',
    icon: menu?.icon,
    path: menu?.path ?? route.path,
    group,
    customRender: menu?.customRender,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * 侧边栏菜单（由 routes.tsx 派生，非独立路由表）。
 * 仅声明了 menu 元数据的路由参与侧边栏，按 sidebarGroup 分组，组内保持路由声明顺序。
 */
export const sidebarMenuItems: SidebarMenuItem[] = (() => {
  const byGroup = new Map<SidebarGroup, SidebarMenuItem[]>();
  for (const route of routes) {
    if (!route.menu) continue;
    if (!route.sidebarGroup || route.sidebarGroup === SidebarGroup.NONE) continue;
    if (route.layoutMode === LayoutMode.FULLSCREEN) continue;
    const group = route.sidebarGroup;
    const list = byGroup.get(group) ?? [];
    list.push(buildMenuItem(route, group));
    byGroup.set(group, list);
  }
  const result: SidebarMenuItem[] = [];
  for (const group of [SidebarGroup.ACCOUNT, SidebarGroup.GAME, SidebarGroup.COMMON]) {
    const items = byGroup.get(group);
    if (!items?.length) continue;
    const meta = GROUP_META[group];
    result.push({
      id: meta.id,
      type: 'header',
      title: meta.title,
      titleI18nKey: meta.titleI18nKey,
      group,
      children: items,
    });
  }
  return result;
})();
