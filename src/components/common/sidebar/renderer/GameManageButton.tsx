import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Gamepad2, Hammer, Zap, Package, Image, Sun, FolderOpen, Trash2 } from 'lucide-react';
import { useGameStore } from '../../../../stores/gameStore';
import { ModLoaderType, type Game, openFolder } from '../../../../helper/rustInvoke';
import { SidebarMenuItem } from '@/router/models';
import { Portal } from '@/components/common/Portal';
import ContextMenu, { useContextMenu, ContextMenuItemData } from '@/components/common/ContextMenu';
import { useNotification } from '@/components/common';
import { useClickOutside } from '@/hooks/useClickOutside';
import { confirm } from '@tauri-apps/plugin-dialog';
import { Z_INDEX } from '@/utils/zIndex';
import { DURATION, EASING, dropdown, microInteractions } from '@/utils/animations';

interface GameManageButtonProps {
  item: SidebarMenuItem;
  isActive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: (path: string) => void;
}

const LOADER_ICONS: Record<ModLoaderType, React.ComponentType<{ className?: string }>> = {
  [ModLoaderType.Vanilla]: Gamepad2,
  [ModLoaderType.Forge]: Hammer,
  [ModLoaderType.NeoForge]: Image,
  [ModLoaderType.Fabric]: Zap,
  [ModLoaderType.Quilt]: Package,
  [ModLoaderType.OptiFine]: Sun,
};

/** 游戏管理按钮组件（侧边栏自定义渲染） */
const GameManageButton: React.FC<GameManageButtonProps> = ({
  item,
  isActive,
  onNavigate
}) => {
  const { t } = useTranslation();
  const game = useGameStore(s => s.getSelectedGame());
  const games = useGameStore(s => s.games);
  const setSelectedGame = useGameStore(s => s.setSelectedGame);
  const remove = useGameStore(s => s.remove);
  const { success, error: notifyError } = useNotification();
  const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useClickOutside<HTMLDivElement>(
    () => setShowDropdown(false),
    showDropdown,
    [dropdownRef],
  );

  const formatVersionInfo = (inst: Game): string => {
    const parts: string[] = [inst.version_id];

    if (inst.loader_type !== ModLoaderType.Vanilla) {
      if (inst.loader_version) {
        parts.push(`${inst.loader_type} ${inst.loader_version}`);
      } else {
        parts.push(inst.loader_type);
      }
    }

    return parts.join(' · ');
  };

  const getLoaderIcon = (inst: Game) => {
    const IconComponent = LOADER_ICONS[inst.loader_type] || Gamepad2;
    return <IconComponent className="w-5 h-5" />;
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!game) return;
    
    // 如果有子项，自动导航到第一个子项
    if (item.children && item.children.length > 0 && onNavigate) {
      const firstChild = item.children[0];
      if (firstChild.path) {
        // 不要提前替换 :gameId，让 React Router 自己处理
        onNavigate(firstChild.path);
      }
    } else if (item.path && onNavigate) {
      // 没有子项，直接导航到 path
      onNavigate(item.path);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setShowDropdown(false);
  };

  const handleContextMenuAction = async (id: string) => {
    if (id === 'openFolder') {
      if (!game) return;
      try {
        await openFolder(game.path);
      } catch (e) {
        notifyError(
          t('games.openFolderFailed', '打开目录失败'),
          e instanceof Error ? e.message : String(e),
        );
      }
      return;
    }

    if (id === 'delete') {
      if (!game) return;
      const confirmed = await confirm(
        t('games.confirmDelete', '确定要删除游戏 "{{name}}" 吗？', { name: game.name }),
        { title: t('games.confirmDeleteTitle', '删除游戏'), kind: 'warning' },
      );
      if (!confirmed) return;
      try {
        await remove(game.id);
        success(t('notification.gameDeleted', '游戏已删除'));
      } catch (e) {
        notifyError(
          t('games.deleteFailed', '删除失败'),
          e instanceof Error ? e.message : String(e),
        );
      }
    }
  };

  const contextMenuItems: ContextMenuItemData[] = [
    { id: 'openFolder', label: t('game.openFolder', '打开文件夹'), icon: FolderOpen },
    { id: 'divider', label: '', divider: true },
    { id: 'delete', label: t('common.delete', '删除'), icon: Trash2, danger: true },
  ];

  // 无游戏时的显示
  if (!game) {
    return (
      <div
        className={`w-full p-3 rounded-lg border transition-all duration-200 cursor-default ${
          isActive
            ? 'bg-[var(--color-surface-active)] border-l-[3px] border-l-[var(--color-primary)] border-[var(--color-border)]'
            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-10)] flex items-center justify-center">
            <span className="text-[var(--color-primary)]">
              <Gamepad2 className="w-5 h-5" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-tertiary)]">
              {t('gameInfo.noGame', '暂无游戏')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={buttonRef}>
      {/* 主体按钮 */}
      <motion.button
        className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex items-center justify-between gap-2 ${
          isActive
            ? 'bg-[var(--color-surface-active)] border-l-[3px] border-l-[var(--color-primary)] border-[var(--color-border)]'
            : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
        }`}
        onClick={handleMainClick}
        onContextMenu={showContextMenu}
        whileHover={microInteractions.secondaryButtonHover}
        whileTap={microInteractions.secondaryButtonTap}
      >
        {/* 左侧：图标 + 信息 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 游戏图标 */}
          <motion.div
            className="w-8 h-8 rounded-lg bg-[var(--color-primary-10)] flex items-center justify-center flex-shrink-0 overflow-hidden"
            whileHover={microInteractions.iconHover}
            transition={EASING.SPRING_STIFF}
          >
            {game.icon_path ? (
              <img
                src={game.icon_path}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[var(--color-primary)]">
                {getLoaderIcon(game)}
              </span>
            )}
          </motion.div>

          {/* 游戏信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {game.name}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
              {formatVersionInfo(game)}
            </div>
          </div>
        </div>

        {/* 右侧：展开箭头 */}
        <motion.div
          className="flex-shrink-0 cursor-pointer p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          onClick={handleToggleExpand}
          animate={{ rotate: showDropdown ? 180 : 0 }}
          transition={{ duration: DURATION.MEDIUM, ease: EASING.OUT_FLUENT }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* 下拉菜单 */}
      {showDropdown && games.length > 0 && (
        <Portal anchorTo={buttonRef} placement="bottom-start" zIndex={Z_INDEX.DROPDOWN}>
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              key="game-dropdown"
              variants={dropdown}
              initial="initial"
              animate="animate"
              exit="exit"
              className="py-1 bg-[var(--color-surface-solid)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
            >
              {games.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handleGameSelect(inst.id)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    inst.id === game.id
                      ? 'bg-[var(--color-primary-10)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-[var(--color-primary-10)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {inst.icon_path ? (
                      <img
                        src={inst.icon_path}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[var(--color-primary)]">
                        {React.createElement(
                          LOADER_ICONS[inst.loader_type] || Gamepad2,
                          { className: 'w-4 h-4' }
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{inst.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                      {formatVersionInfo(inst)}
                    </div>
                  </div>

                  {inst.id === game.id && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </Portal>
      )}

      <ContextMenu
        items={contextMenuItems}
        position={contextMenuState.position}
        visible={contextMenuState.visible}
        onClose={hideContextMenu}
        onItemClick={handleContextMenuAction}
      />
    </div>
  );
};

export default GameManageButton;
