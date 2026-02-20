// Header配置类型
export interface HeaderConfig {
  type: 'main' | 'sub';
  title: string;
}

// 路由配置接口
export interface RouteConfig {
  path: string;
  componentName: string;
  header: HeaderConfig;
}

// 路由配置表
export const routes: RouteConfig[] = [
  {
    path: '/',
    componentName: 'Home',
    header: {
      type: 'main',
      title: 'Hello Minecraft! Launcher'
    }
  },
  {
    path: '/account',
    componentName: 'AccountList',
    header: {
      type: 'sub',
      title: '账户列表'
    }
  },
  {
    path: '/instance-manage',
    componentName: 'InstanceManage',
    header: {
      type: 'sub',
      title: '实例管理'
    }
  },
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: {
      type: 'sub',
      title: '实例列表'
    }
  },
  {
    path: '/download',
    componentName: 'Download',
    header: {
      type: 'sub',
      title: '下载'
    }
  },
  {
    path: '/settings',
    componentName: 'Settings',
    header: {
      type: 'sub',
      title: '设置'
    }
  },
  {
    path: '/multiplayer',
    componentName: 'Multiplayer',
    header: {
      type: 'sub',
      title: '多人联机'
    }
  },
  {
    path: '/feedback',
    componentName: 'Feedback',
    header: {
      type: 'sub',
      title: '反馈与群组'
    }
  },
  {
    path: '/hint',
    componentName: 'Hint',
    header: {
      type: 'sub',
      title: '启动器说明'
    }
  },
];

// 侧边栏菜单配置
export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  group: 'account' | 'game' | 'common';
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  // 账户分组
  {
    id: 'account',
    title: '账户列表',
    icon: '👤',
    path: '/account',
    group: 'account'
  },
  // 游戏分组
  {
    id: 'instance-manage',
    title: '实例管理',
    icon: '📁',
    path: '/instance-manage',
    group: 'game'
  },
  {
    id: 'instance-list',
    title: '实例列表',
    icon: '📋',
    path: '/instance-list',
    group: 'game'
  },
  {
    id: 'download',
    title: '下载',
    icon: '⬇️',
    path: '/download',
    group: 'game'
  },
  // 通用分组
  {
    id: 'settings',
    title: '设置',
    icon: '⚙️',
    path: '/settings',
    group: 'common'
  },
  {
    id: 'multiplayer',
    title: '多人联机',
    icon: '🌐',
    path: '/multiplayer',
    group: 'common'
  },
  {
    id: 'feedback',
    title: '反馈与群组',
    icon: '💬',
    path: '/feedback',
    group: 'common'
  },
  {
    id: 'hint',
    title: '启动器说明',
    icon: '❕',
    path: '/hint',
    group: 'common'
  },

];

// 获取侧边栏分组
export const getSidebarGroups = () => {
  const groups = {
    account: [] as SidebarMenuItem[],
    game: [] as SidebarMenuItem[],
    common: [] as SidebarMenuItem[]
  };
  
  sidebarMenuItems.forEach(item => {
    groups[item.group].push(item);
  });
  
  return groups;
};