import { routes } from './routes';
import { NavItem, SidebarGroup } from './models';
import { UserRole } from '@/stores/userRoleStore';

/** 导航分组排序（main 单独置顶） */
const GROUP_ORDER: Record<SidebarGroup, number> = {
  [SidebarGroup.ACCOUNT]: 0,
  [SidebarGroup.GAME]: 1,
  [SidebarGroup.COMMON]: 2,
  [SidebarGroup.NONE]: 3,
};

/**
 * 根据角色获取灵动岛导航项列表（由 routes.tsx 的 nav 元数据派生）。
 * main 置顶，其余按导航分组 + 组内 order 排序。
 */
export function getNavItemsByRole(role: UserRole): NavItem[] {
  const items: NavItem[] = [];
  for (const route of routes) {
    const nav = route.nav;
    if (!nav || !nav.roles.includes(role)) continue;
    items.push({
      id: nav.id,
      label: nav.label,
      labelI18nKey: nav.labelI18nKey,
      icon: nav.icon,
      path: route.path,
      roles: nav.roles,
      group: nav.group ?? route.sidebarGroup ?? SidebarGroup.NONE,
      order: nav.order ?? 0,
      badge: nav.badge,
    });
  }
  return items.sort((a, b) => {
    if (a.id === 'main') return -1;
    if (b.id === 'main') return 1;
    const ga = GROUP_ORDER[a.group] ?? 3;
    const gb = GROUP_ORDER[b.group] ?? 3;
    if (ga !== gb) return ga - gb;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}
