import { FolderTree, FolderPlus, Download, Package, RefreshCw } from 'lucide-react';
import { type SidebarMenuItem, SidebarGroup } from '../router/config';
import { useInstanceStore } from '../stores/instanceStore';
import { registerSidebar, type SidebarConfig } from './registry';
import { logger } from '../helper/logger';

const createInstanceListSidebar = (): SidebarConfig => {
  return {
    match: (path) => path.startsWith('/instance-list'),
    items: () => {
      const { knownFolders } = useInstanceStore.getState();

      const items: SidebarMenuItem[] = [
        ...knownFolders.map(folder => ({
          id: folder.id,
          type: 'route' as const,
          title: folder.name,
          titleI18nKey: `instances.folder.${folder.id}`,
          icon: <FolderTree className="w-4 h-4" />,
          path: '/instance-list',
          group: SidebarGroup.GAME,
        })),
        {
          id: 'add-game-folder',
          type: 'action' as const,
          title: '添加游戏文件夹',
          titleI18nKey: 'instances.addGameFolder',
          icon: <FolderPlus className="w-4 h-4" />,
          path: '/instance-list',
          group: SidebarGroup.GAME,
          action: () => {
            logger.info('添加游戏文件夹 - 待实现');
          },
        },
        {
          id: 'divider-instances',
          type: 'divider' as const,
          title: '',
          titleI18nKey: '',
          group: SidebarGroup.GAME,
        },
        {
          id: 'install-new-game',
          type: 'action' as const,
          title: '安装新游戏',
          titleI18nKey: 'instances.installNewGame',
          icon: <Download className="w-4 h-4" />,
          path: '/instance-list',
          group: SidebarGroup.GAME,
          action: () => {
            logger.info('安装新游戏 - 待实现');
          },
        },
        {
          id: 'install-modpack',
          type: 'action' as const,
          title: '安装整合包',
          titleI18nKey: 'instances.installModpack',
          icon: <Package className="w-4 h-4" />,
          path: '/instance-list',
          group: SidebarGroup.GAME,
          action: () => {
            logger.info('安装整合包 - 待实现');
          },
        },
        {
          id: 'refresh-instances',
          type: 'action' as const,
          title: '刷新',
          titleI18nKey: 'instances.refresh',
          icon: <RefreshCw className="w-4 h-4" />,
          path: '/instance-list',
          group: SidebarGroup.GAME,
          action: () => {
            const store = useInstanceStore.getState();
            store.refresh();
            store.refreshKnownFolders();
          },
        },
      ];
      return items;
    },
    onItemClick: (item) => {
      const { setSelectedSidebarItem, setSelectedFolder, knownFolders } = useInstanceStore.getState();
      setSelectedSidebarItem(item.id);

      if (item.type === 'action') {
        item.action?.();
      } else if (item.id && knownFolders.find(f => f.id === item.id)) {
        setSelectedFolder(item.id);
      }
    },
    groupTitle: '实例列表',
    groupTitleI18nKey: 'instances.title',
    isActive: () => false,
    isParentActive: () => false,
    hasChildrenItems: () => false,
  };
};

registerSidebar(createInstanceListSidebar());
