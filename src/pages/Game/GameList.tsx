import { useState, useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { motion, AnimatePresence } from 'framer-motion';

import { Heart, Puzzle, Box, Archive, AlertTriangle, LucideIcon } from 'lucide-react';

import { confirm } from '@tauri-apps/plugin-dialog';

import { useGameStore } from '../../stores/gameStore';
import { openFolder } from '../../helper/rustInvoke';
import { useSafeNavigate } from '../../router/navigation';
import { GameListItem, EmptyState, useNotification, Skeleton, Page, PageSection } from '../../components/common';
import { getErrorMessage } from '../../utils/errorUtils';
import BottomBar from '@/components/common/BottomBar/BottomBar';
import type { Game } from '../../helper/rustInvoke';
import { ModLoaderType } from '../../helper/rustInvoke';
import GamePage from './GamePage';

type GroupKey = 'favorites' | 'mods' | 'regular' | 'uncommon' | 'broken';

interface GameGroup {
  key: GroupKey;
  titleKey: string;
  icon: LucideIcon;
  items: Game[];
}

const GROUP_DEFS: Omit<GameGroup, 'items'>[] = [
  { key: 'favorites', titleKey: 'games.groupFavorites', icon: Heart },
  { key: 'mods', titleKey: 'games.groupMods', icon: Puzzle },
  { key: 'regular', titleKey: 'games.groupRegular', icon: Box },
  { key: 'uncommon', titleKey: 'games.groupUncommon', icon: Archive },
  { key: 'broken', titleKey: 'games.groupBroken', icon: AlertTriangle },
];

/** 判定游戏所属分组（收藏优先，损坏次之） */
const categorizeGame = (game: Game, favoriteIds: string[]): GroupKey => {
  if (favoriteIds.includes(game.id)) return 'favorites';
  if (game.broken) return 'broken';
  if (game.loader_type !== ModLoaderType.Vanilla) return 'mods';
  if (/^1\.\d+(\.\d+)?$/.test(game.version_id.toLowerCase())) return 'regular';
  return 'uncommon';
};

/** 游戏列表页面 - 展示所有已安装的游戏 */
const GameList: React.FC = () => {
  const { t } = useTranslation();
  const safeNavigate = useSafeNavigate();
  const selectedGameId = useGameStore(s => s.selectedGameId);
  const {
    games,
    loading,
    error,
    gameRoot,
    searchQuery,
    refresh,
    remove,
    duplicate,
    setSearchQuery,
    setSelectedGame,
    getFilteredGames,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    validations,
  } = useGameStore();

  const { success, error: notifyError } = useNotification();

  const currentPath = gameRoot;

  const filteredGames = getFilteredGames();

  // 游戏分组
  const groupedGames = useMemo(() => {
    const map: Record<GroupKey, Game[]> = {
      favorites: [], mods: [], regular: [], uncommon: [], broken: [],
    };
    for (const game of filteredGames) {
      // 空壳游戏（除记录外无任何文件）直接不显示：
      // 优先用扫描阶段标记（game.empty，避免等待校验造成先显示后隐藏），
      // 校验结果 empty 作为兜底（旧数据/边界情况）
      if (game.empty || validations[game.id]?.empty) continue;
      map[categorizeGame(game, favoriteIds)].push(game);
    }
    return GROUP_DEFS
      .map((def) => ({ ...def, items: map[def.key] }))
      .filter((group) => group.items.length > 0);
  }, [filteredGames, favoriteIds, validations]);

  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // 处理复制成功
  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetId || !duplicateName.trim()) return;
    try {
      await duplicate(duplicateTargetId, duplicateName);
      success(t('games.duplicateSuccess', '复制成功'), t('games.duplicateSuccessMsg', '游戏已复制为 "{{name}}"', { name: duplicateName }));
      setShowDuplicateModal(false);
      setDuplicateTargetId(null);
      setDuplicateName('');
    } catch (e) {
      const msg = getErrorMessage(e);
      notifyError(t('games.duplicateFailed', '复制失败'), msg);
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

  const handleSelect = (id: string) => {
    setSelectedGame(id);
    safeNavigate('/');
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm(t('games.confirmDelete', '确定要删除游戏 "{{name}}" 吗？', { name }), {
      title: t('games.confirmDeleteTitle', '删除游戏'),
      kind: 'warning',
    });
    if (!confirmed) return;
    try {
      await remove(id);
      success(t('notification.gameDeleted'), t('games.deleteSuccess', '游戏 "{{name}}" 已删除', { name }));
    } catch (e) {
      const msg = getErrorMessage(e);
      notifyError(t('games.deleteFailed', '删除失败'), msg);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = getErrorMessage(e);
      notifyError(t('games.openFolderFailed', '打开目录失败'), msg);
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
          title={searchQuery ? t('games.noMatch', '未找到匹配的游戏') : t('games.noGames', '暂无游戏')}
          description={searchQuery ? t('games.adjustSearch', '尝试调整搜索关键词') : t('games.noGamesDesc', '下载或创建新游戏来开始游戏')}
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
                {group.items.map((game) => (
                  <motion.div
                    key={game.id}
                    layout
                  >
                      <GameListItem
                        className='rounded-r-(--radius-sm)'
                        game={game}
                        selected={game.id === selectedGameId}
                        isFavorite={isFavorite(game.id)}
                        onSelect={() => handleSelect(game.id)}
                        onRename={() => { }}
                        onDelete={() => handleDelete(game.id, game.name)}
                        onOpenFolder={() => handleOpenFolder(game.path)}
                        onSettings={() => safeNavigate(`/game-manage/${game.id}/game-settings`)}
                        onFavorite={() => toggleFavorite(game.id)}
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
      <GamePage
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
        dir='games.gameDir'
        cmdOpen='common.open'
        path={currentPath}
      />
    </Page>
  );
};

export default GameList;
