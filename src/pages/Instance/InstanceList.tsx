import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Puzzle, Box, Archive, AlertTriangle, LucideIcon } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import { openFolder } from '../../helper/rustInvoke';
import { useSafeNavigate } from '../../router/navigation';
import { InstanceListItem, EmptyState, useNotification, Skeleton, Page, PageSection } from '../../components/common';
import Instance from './Instance';
import BottomBar from '@/components/common/BottomBar/BottomBar';
import type { Game } from '../../helper/rustInvoke'; import { ModLoaderType } from '../../helper/rustInvoke';

type GroupKey = 'favorites' | 'mods' | 'regular' | 'uncommon' | 'broken';

interface InstanceGroup {
  key: GroupKey;
  titleKey: string;
  icon: LucideIcon;
  items: Game[];
}

const GROUP_DEFS: Omit<InstanceGroup, 'items'>[] = [
  { key: 'favorites', titleKey: 'instances.groupFavorites', icon: Heart },
  { key: 'mods', titleKey: 'instances.groupMods', icon: Puzzle },
  { key: 'regular', titleKey: 'instances.groupRegular', icon: Box },
  { key: 'uncommon', titleKey: 'instances.groupUncommon', icon: Archive },
  { key: 'broken', titleKey: 'instances.groupBroken', icon: AlertTriangle },
];

/** 判定实例所属分组（收藏优先，损坏次之） */
const categorizeInstance = (instance: Game, favoriteIds: string[]): GroupKey => {
  if (favoriteIds.includes(instance.id)) return 'favorites';
  if (instance.broken) return 'broken';
  if (instance.loader_type !== ModLoaderType.Vanilla) return 'mods';
  if (/^1\.\d+(\.\d+)?$/.test(instance.version_id.toLowerCase())) return 'regular';
  return 'uncommon';
};

/** 实例列表页面 - 展示所有已安装的游戏实例 */
const InstanceList: React.FC = () => {
  const { t } = useTranslation();
  const safeNavigate = useSafeNavigate();
  const selectedGameId = useGameStore(s => s.selectedGameId);
  const {
    games,
    loading,
    error,
    gameRoot,
    searchQuery,
    init,
    refresh,
    remove,
    duplicate,
    setSearchQuery,
    setSelectedGame,
    getFilteredGames,
    favoriteIds,
    toggleFavorite,
    isFavorite,
  } = useGameStore();

  const { success, error: notifyError } = useNotification();

  const currentPath = gameRoot;

  const filteredGames = getFilteredGames();

  const groupedGames = useMemo(() => {
    const map: Record<GroupKey, Game[]> = {
      favorites: [], mods: [], regular: [], uncommon: [], broken: [],
    };
    for (const game of filteredGames) {
      map[categorizeInstance(game, favoriteIds)].push(game);
    }
    return GROUP_DEFS
      .map((def) => ({ ...def, items: map[def.key] }))
      .filter((group) => group.items.length > 0);
  }, [filteredGames, favoriteIds]);

  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);


  // 处理复制成功
  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetId || !duplicateName.trim()) return;
    try {
      await duplicate(duplicateTargetId, duplicateName);
      success(t('instances.duplicateSuccess', '复制成功'), t('instances.duplicateSuccessMsg', '实例已复制为 "{{name}}"', { name: duplicateName }));
      setShowDuplicateModal(false);
      setDuplicateTargetId(null);
      setDuplicateName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.duplicateFailed', '复制失败'), msg);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDuplicateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const handleSelect = (id: string) => {
    setSelectedGame(id);
    safeNavigate('/');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('instances.confirmDelete', '确定要删除实例 "{{name}}" 吗？', { name }))) return;
    try {
      await remove(id);
      success(t('notification.instanceDeleted'), t('instances.deleteSuccess', '实例 "{{name}}" 已删除', { name }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.deleteFailed', '删除失败'), msg);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.openFolderFailed', '打开目录失败'), msg);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-6 px-4">
          <Skeleton.Card count={6} />
        </div>
      );
    }

    if (filteredGames.length === 0) {
      return (
        <EmptyState
          icon="folder"
          title={searchQuery ? t('instances.noMatch', '未找到匹配的实例') : t('instances.noInstances', '暂无实例')}
          description={searchQuery ? t('instances.adjustSearch', '尝试调整搜索关键词') : t('instances.noInstancesDesc', '下载或创建新实例来开始游戏')}
        />
      );
    }

    return (
      <div className="h-full overflow-y-auto scrollbar-hide-x space-y-3 px-5">
        {groupedGames.map((group) => (
          <PageSection>
            <div className="max-w-2xl mx-auto space-y-1 bg-(--color-surface) px-3 pb-3 rounded-(--radius-md)">
              {/* 类型说明 */}
              <div className="flex items-center gap-1.5 pb-2 pt-2">
                <group.icon className="w-3.5 h-3.5 text-(--color-text-secondary)" />
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t(group.titleKey)}
                </span>
                <span className="text-xs text-(--color-text-secondary)/60">{group.items.length}</span>
              </div>

              <AnimatePresence mode="popLayout">
                {group.items.map((instance) => (
                  <motion.div
                    key={instance.id}
                    layout
                  >
                      <InstanceListItem
                        className='rounded-r-(--radius-sm)'
                        instance={instance}
                        selected={instance.id === selectedGameId}
                        isFavorite={isFavorite(instance.id)}
                        onSelect={() => handleSelect(instance.id)}
                        onRename={() => { }}
                        onDelete={() => handleDelete(instance.id, instance.name)}
                        onOpenFolder={() => handleOpenFolder(instance.path)}
                        onSettings={() => safeNavigate(`/instance-manage/${instance.id}/game-settings`)}
                        onFavorite={() => toggleFavorite(instance.id)}
                      />
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </PageSection>
        ))}
      </div>
    );
  };

  return (
    <Page className="flex flex-col h-full">
      <Instance
        refresh={refresh}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredGames={filteredGames}
        games={games}
        error={error}
        renderContent={renderContent}
        gameRoot={gameRoot}
        showDuplicateModal={showDuplicateModal}
        duplicateName={duplicateName}
        setDuplicateName={setDuplicateName}
        handleConfirmDuplicate={handleConfirmDuplicate}
        setShowDuplicateModal={setShowDuplicateModal}
        setDuplicateTargetId={setDuplicateTargetId}
      />

      <BottomBar
        dir='instances.instanceDir'
        cmdOpen='common.open'
        path={currentPath}
      />
    </Page>
  );
};

export default InstanceList;
