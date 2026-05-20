import {
  User,
  Gamepad2,
  Settings,
  Server,
  BarChart3,
  Upload,
  Crown,
  type LucideIcon,
  Home
} from 'lucide-react';
import { useUserRoleStore } from '@/stores/userRoleStore';
import { getSidebarGroups, SidebarMenuItem } from '@/router/config';
import { logger } from '@/helper/logger';

export interface NavItem {
  id: string;
  label: string;
  labelI18nKey?: string;
  icon: LucideIcon;
  path: string;
  action?: () => void;
  roles: ('player' | 'admin' | 'creator')[];
  badge?: number;
  isVisible?: boolean;
}

export const mainMenuNavItem: NavItem = {
  id: 'main',
  label: '主页',
  labelI18nKey: 'nav.main',
  icon: Home,
  path: '/',
  roles: ['player', 'admin'],
}

export const playerNavItems: NavItem[] = [
  mainMenuNavItem,
  {
    id: 'games',
    label: '游戏',
    labelI18nKey: 'nav.games',
    icon: Gamepad2,
    path: '/instance-list',
    roles: ['player', 'admin'],
  },
  {
    id: 'settings',
    label: '设置',
    labelI18nKey: 'nav.settings',
    icon: Settings,
    path: '/settings',
    roles: ['player', 'admin'],
  },
];

export const adminNavItems: NavItem[] = [
  mainMenuNavItem,
  {
    id: 'server-manage',
    label: '服务器管理',
    labelI18nKey: 'nav.serverManage',
    icon: Server,
    path: '/admin/servers',
    roles: ['admin'],
  },
  {
    id: 'analytics',
    label: '数据看板',
    labelI18nKey: 'nav.analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    roles: ['admin'],
    badge: 0,
  },
  {
    id: 'upload-config',
    label: '配置上传',
    labelI18nKey: 'nav.uploadConfig',
    icon: Upload,
    path: '/admin/upload',
    roles: ['admin'],
  },
];

// 通过组别获取 NavItems
function getNavItemsByGroup(group: SidebarMenuItem[]): NavItem[] {
  let navItems: NavItem[] = [];

  group.forEach((item) => {
    let nItems = item.navItem;
    logger.info("该 account item：", item);
    if (nItems) {
      nItems.forEach((ni) => {
        navItems.push(ni);
      });
    }
  });

  return navItems;
}

// 获取所有已知组别的 NavItems
function getAllGroupsOfNavItems(): NavItem[] {
  const groups = getSidebarGroups();

  let navItems: NavItem[] = [];
  // 获取主页
  navItems.push(mainMenuNavItem)

  let ni = getNavItemsByGroup(groups.account);
  ni.forEach((i) => {
    if (i.roles.includes("player")) {
      navItems.push(i);
    }
  })

  ni = getNavItemsByGroup(groups.game);
  ni.forEach((i) => {
    if (i.roles.includes("player")) {
      navItems.push(i);
    }
  })

  ni = getNavItemsByGroup(groups.common);
  ni.forEach((i) => {
    if (i.roles.includes("player")) {
      navItems.push(i);
    }
  })
  return navItems;
}

function getPlayerNavItems(): NavItem[] {
  let navItems = getAllGroupsOfNavItems();

  if (navItems.length<=0 || !navItems) return playerNavItems;
  return navItems;
}

function getAdminNavItems(): NavItem[] {
  let navItems = getAllGroupsOfNavItems();

  if (navItems.length<=0 || !navItems) return playerNavItems;
  return navItems;
}

export function getNavItemsByRole(role: 'player' | 'admin'): NavItem[] {
  return role === 'player' ? getPlayerNavItems() : getAdminNavItems();
}

export function getCurrentNavItems(): NavItem[] {
  const role = useUserRoleStore.getState().currentRole;
  return getNavItemsByRole(role as 'player' | 'admin');
}
