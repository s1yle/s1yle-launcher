import {
  User,
  Gamepad2,
  Settings,
  Server,
  BarChart3,
  Upload,
  Crown,
  type LucideIcon
} from 'lucide-react';
import { useUserRoleStore } from '@/stores/userRoleStore';

export interface NavItem {
  id: string;
  label: string;
  labelI18nKey?: string;
  icon: LucideIcon;
  path?: string;
  action?: () => void;
  roles: ('player' | 'admin' | 'creator')[];
  badge?: number;
  isVisible?: boolean;
}

export const playerNavItems: NavItem[] = [
  {
    id: 'account',
    label: '账户',
    labelI18nKey: 'nav.account',
    icon: User,
    path: '/account',
    roles: ['player', 'admin'],
  },
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

export function getNavItemsByRole(role: 'player' | 'admin'): NavItem[] {
  return role === 'player' ? playerNavItems : adminNavItems;
}

export function getCurrentNavItems(): NavItem[] {
  const role = useUserRoleStore.getState().currentRole;
  return getNavItemsByRole(role as 'player' | 'admin');
}
