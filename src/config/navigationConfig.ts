import {
  Gamepad2,
  Settings,
  Server,
  BarChart3,
  Upload,
  type LucideIcon,
  Home
} from 'lucide-react';
import { useUserRoleStore } from '@/stores/userRoleStore';
import { getSidebarGroups, SidebarMenuItem } from '@/router/config';
import { logger } from '@/helper/logger';

import { UserRole } from '@/stores/userRoleStore';

/** 导航项配置 */
export interface NavItem {
  id: string;
  label: string;
  labelI18nKey?: string;
  icon: LucideIcon;
  path: string;
  action?: () => void;
  roles: UserRole[];
  badge?: number;
  isVisible?: boolean;
}

/** 主菜单导航项（首页） */
export const mainMenuNavItem: NavItem = {
  id: 'main',
  label: '主页',
  labelI18nKey: 'nav.main',
  icon: Home,
  path: '/',
  roles: [UserRole.PLAYER, UserRole.ADMIN],
}

// 备用 player / admin NavItems
/** 默认玩家角色导航项列表 */
export const defaultPlayerNavItems: NavItem[] = [
  mainMenuNavItem,
  {
    id: 'games',
    label: '游戏',
    labelI18nKey: 'nav.games',
    icon: Gamepad2,
    path: '/instance-list',
    roles: [UserRole.PLAYER, UserRole.ADMIN],
  },
  {
    id: 'settings',
    label: '设置',
    labelI18nKey: 'nav.settings',
    icon: Settings,
    path: '/settings',
    roles: [UserRole.PLAYER, UserRole.ADMIN],
  },
];

/** 默认管理员角色导航项列表 */
export const defaultAdminNavItems: NavItem[] = [
  mainMenuNavItem,
  {
    id: 'server-manage',
    label: '服务器管理',
    labelI18nKey: 'nav.serverManage',
    icon: Server,
    path: '/admin/servers',
    roles: [UserRole.ADMIN],
  },
  {
    id: 'analytics',
    label: '数据看板',
    labelI18nKey: 'nav.analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    roles: [UserRole.ADMIN],
    badge: 0,
  },
  {
    id: 'upload-config',
    label: '配置上传',
    labelI18nKey: 'nav.uploadConfig',
    icon: Upload,
    path: '/admin/upload',
    roles: [UserRole.ADMIN],
  },
];

// 通过组别获取 NavItems
function getNavItemsByGroup(group: SidebarMenuItem[]): NavItem[] {
  let navItems: NavItem[] = [];

  group.forEach((item) => {
    let nItems = item.navItem;
    if (nItems) {
      nItems.forEach((ni) => {
        navItems.push(ni);
      });
    }
  });

  return navItems;
}

// 获取所有已知组别的 NavItems
function getAllGroupsOfNavItems(role: UserRole): NavItem[] {
  const groups = getSidebarGroups();

  let navItems: NavItem[] = [];
  // 获取主页
  navItems.push(mainMenuNavItem)

  let ni = getNavItemsByGroup(groups.account);
  ni.forEach((i) => {
    if (i.roles.includes(role)) {
      navItems.push(i);
    }
  })

  ni = getNavItemsByGroup(groups.game);
  ni.forEach((i) => {
    if (i.roles.includes(role)) {
      navItems.push(i);
    }
  })

  ni = getNavItemsByGroup(groups.common);
  ni.forEach((i) => {
    if (i.roles.includes(role)) {
      navItems.push(i);
    }
  })
  return navItems;
}

function getPlayerNavItems(): NavItem[] {
  let navItems = getAllGroupsOfNavItems(UserRole.PLAYER);

  if (navItems.length<=0 || !navItems) return defaultPlayerNavItems;
  return navItems;
}

function getAdminNavItems(): NavItem[] {
  let navItems = getAllGroupsOfNavItems(UserRole.ADMIN);

  if (navItems.length<=0 || !navItems) return defaultAdminNavItems;
  return navItems;
}

/**
 * 根据角色获取导航项列表
 * @param role - 用户角色
 * @returns 导航项列表
 */
export function getNavItemsByRole(role: UserRole): NavItem[] {
  return role === UserRole.PLAYER ? getPlayerNavItems() : getAdminNavItems();
}

/**
 * 获取当前角色的导航项列表
 * @returns 导航项列表
 */
export function getCurrentNavItems(): NavItem[] {
  const role = useUserRoleStore.getState().currentRole;
  return getNavItemsByRole(role);
}
