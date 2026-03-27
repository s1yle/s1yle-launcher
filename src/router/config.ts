export enum SidebarType {
  MAIN = 'main',
  SUB = 'sub',
  SECONDARY = 'secondary'
}

// Header配置类型
export interface HeaderConfig {
  type: SidebarType;
  title: string;
} 

export enum RoutePosition {
  TOP = 'top',  // 默认项，贴近顶部显示
  BOTTOM = 'bottom',
  HIDDEN = 'hidden'
}

// 路由配置接口
export interface RouteConfig {
  path: string;
  componentName: string;
  header: HeaderConfig;
  position?: RoutePosition;
  children?: RouteConfig[]; // 可选的子路由
  sidebarGroup?: 'account' | 'game' | 'common' | 'none'; // 新增：指定侧边栏组
}

// 路由配置表
export const routes: RouteConfig[] = [
  {
    path: '/',
    componentName: 'Home',
    header: {
      type: SidebarType.MAIN,
      title: 'Hello Minecraft! Launcher'
    },
    sidebarGroup: 'none'
  },
  {
    path: '/account',
    componentName: 'AccountListWithSidebar',
    header: {
      type: SidebarType.SUB,
      title: '账户列表'
    },
    sidebarGroup: 'account',
    children:[
      {
        path: '/account/microsoft',
        componentName: 'MicrosoftAccount',
        header: {
          type: SidebarType.SECONDARY,
          title: '微软账户'
        },
        sidebarGroup: 'account'
      },
      {
        path: '/account/offline',
        componentName: 'OfflineAccount',
        header: {
          type: SidebarType.SECONDARY,
          title: '离线账户'
        },
        sidebarGroup: 'account'
      },
    ]
  },
  {
    path: '/instance-manage',
    componentName: 'InstanceManage',
    header: {
      type: SidebarType.SUB,
      title: '实例管理'
    },
    sidebarGroup: 'game'
  },
  {
    path: '/instance-list',
    componentName: 'InstanceList',
    header: {
      type: SidebarType.SUB,
      title: '实例列表'
    },
    sidebarGroup: 'game'
  },
  {
    path: '/download',
    componentName: 'Download',
    header: {
      type: SidebarType.SUB,
      title: '下载'
    },
    sidebarGroup: 'game',
    children:[
      {
        path: '/download/game',
        componentName: 'DownloadGame',
        header: {
          type: SidebarType.SECONDARY,
          title: '游戏'
        },
        sidebarGroup: 'game'
      },
      {
        path: '/download/modpack',
        componentName: 'DownloadModpack',
        header: {
          type: SidebarType.SECONDARY,
          title: '整合包'
        },
        sidebarGroup: 'game'
      },
    ]
  },
  {
    path: '/settings',
    componentName: 'Settings',
    header: {
      type: SidebarType.SUB,
      title: '设置'
    },
    sidebarGroup: 'common'
  },
  {
    path: '/multiplayer',
    componentName: 'Multiplayer',
    header: {
      type: SidebarType.SUB,
      title: '多人联机'
    },
    sidebarGroup: 'common'
  },
  {
    path: '/feedback',
    componentName: 'Feedback',
    header: {
      type: SidebarType.SUB,
      title: '反馈与群组'
    },
    sidebarGroup: 'common'
  },
  {
    path: '/hint',
    componentName: 'Hint',
    header: {
      type: SidebarType.SUB,
      title: '启动器说明'
    },
    sidebarGroup: 'common'
  },
];

// 侧边栏菜单配置
export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  group: 'account' | 'game' | 'common';
  children?: SidebarMenuItem[]; // 可选的子菜单项
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  // 账户分组
  {
    id: 'account',
    title: '账户列表',
    icon: '👤',
    path: '/account',
    group: 'account',
    children: [
      {
        id: 'microsoft-account',
        title: '微软账户',
        icon: '🪟',
        path: '/account/microsoft',
        group: 'account'
      },
      {
        id: 'offline-account',
        title: '离线账户',
        icon: '👤',
        path: '/account/offline',
        group: 'account'
      }
    ]
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
    group: 'game',
    children: [
      {
        id: 'download-game',
        title: '游戏下载',
        icon: '🎮',
        path: '/download/game',
        group: 'game'
      },
      {
        id: 'download-modpack',
        title: '整合包下载',
        icon: '📦',
        path: '/download/modpack',
        group: 'game'
      }
    ]
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

  // console.log('Sidebar groups:', groups); // 调试输出分组结果
  
  return groups;
};