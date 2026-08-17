import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Game, ModLoaderType } from '@/helper/rustInvoke'
import {
  Settings,
  Trash2,
  FolderOpen,
  Edit3,
  Gamepad2,
  Heart,
  LucideIcon,
} from 'lucide-react';
import ContextMenu, { useContextMenu, ContextMenuItemData } from "@/components/common/ContextMenu"
import { transitions } from "@/utils/animations"
import { inferVersionType } from "@/utils/format"
import IconButton from '../IconButton';
import { PageSection } from '../Page';
import { getLoaderBlockIcon } from '@/utils/iconFactory';
import BlockIcon from '../BlockIcon';

/** 游戏列表项组件 Props */
interface GameListItemProps {
  game: Game;
  selected?: boolean;
  isFavorite?: boolean;
  onSelect?: () => void;
  onLaunch?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
  onSettings?: () => void;
  onFavorite?: () => void;
  className?: string;
}

const getLoaderLabel = (type: ModLoaderType): string => {
  const labels: Record<string, string> = {
    Vanilla: 'Vanilla',
    Fabric: 'Fabric',
    Forge: 'Forge',
    NeoForge: 'NeoForge',
  };
  return labels[type] || type.toString();
};

/** 游戏列表项组件，显示游戏图标、名称、版本信息，支持右键菜单 */
const GameListItem = ({
  game,
  selected = false,
  isFavorite = false,
  onSelect,
  onDelete,
  onOpenFolder,
  onRename,
  onSettings,
  onFavorite,
  className,
}: GameListItemProps) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();

  useEffect(() => {
    setIconError(false);
    if (game.icon_path) {
      setIconSrc(`asset://localhost/${game.icon_path}`);
      return;
    }
    setIconSrc(getLoaderBlockIcon(game.loader_type));
  }, [game]);

  const handleClick = () => {
    onSelect?.();
  };

  const handleContextMenuAction = (id: string) => {
    switch (id) {
      case 'settings': onSettings?.(); break;
      case 'rename': onRename?.(); break;
      case 'delete': onDelete?.(); break;
      case 'openFolder': onOpenFolder?.(); break;
    }
  };

  const contextMenuItems: ContextMenuItemData[] = [
    { id: 'settings', label: '游戏管理', icon: Settings },
    { id: 'divider1', label: '', divider: true },
    { id: 'rename', label: '重命名', icon: Edit3 },
    { id: 'delete', label: '删除', icon: Trash2, danger: true },
    { id: 'divider2', label: '', divider: true },
    { id: 'openFolder', label: '打开所在文件夹', icon: FolderOpen },
  ];

  const renderIconButton = (icon: LucideIcon, title: string, onClick: (() => void) | undefined, danger = false, rotate = -5) => (
    <IconButton
      icon={icon}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`cursor-pointer transition-colors ${danger
        ? 'text-(--color-text-secondary) hover:text-(--color-error)'
        : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
        }`}
      whileHover={{ scale: 1.15, rotate }}
      whileTap={{ scale: 0.9 }}
      transition={transitions.fast}
    />
  );

  const actionButtons: [LucideIcon, string, (() => void) | undefined, boolean, number][] = [
    [Trash2, '删除', onDelete, true, -5],
    [Settings, '设置', onSettings, false, 5],
  ];

  return (
    <>
      <PageSection>
        <div
          className={`
          flex items-center pl-1.5 pr-3 py-1
          cursor-pointer transition-all border-l-3
          ${selected
              ? 'border-l-primary shadow-md shadow-primary/15'
              : 'border-l-transparent hover:shadow-sm'
            }
          ${selected
              ? 'bg-(--color-primary-20) hover:bg-(--color-primary-hover)/30'
              : 'bg-(--color-surface) hover:bg-(--color-surface-hover)'
            }
          ${className}
        `}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          onClick={handleClick}
          onContextMenu={(e) => {
            showContextMenu(e);
          }}
        >

          {/* 图标 */}
          <motion.div
            className="flex-shrink-0 mr-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={transitions.spring}
          >
            <div className="w-10 h-10 overflow-hidden 
              bg-primary-bg flex items-center justify-center"
            >
              {iconSrc && !iconError ? (
                <BlockIcon
                  src={iconSrc}
                  alt={game.name}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br 
                  from-primary/20 to-primary/40 flex items-center justify-center"
                >
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col">
            {/* 游戏名称 */}
            <motion.span className='font-light text-base/5 text-(--color-text-secondary)'>
              {game.name}
            </motion.span>
            <div className="flex items-center gap-2">
              {/* 版本类型 + 版本id */}
              <span
                className="rounded text-xs bg-surface-active text-(--color-text-tertiary)"
                style={{ whiteSpace: "pre" }}
              >
                {inferVersionType(game.version_id) + `\x20`}  {game.version_id}
              </span>

              {/* modloader */}
              {game.loader_type !== ModLoaderType.Vanilla && (
                <motion.span
                  className="text-sm bg-primary-bg text-secondary flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <BlockIcon
                    src={getLoaderBlockIcon(game.loader_type)}
                    w={3}
                    h={3}
                  />
                  {getLoaderLabel(game.loader_type)}
                  {game.loader_version && ` ${game.loader_version}`}
                </motion.span>
              )}
            </div>
          </div>

          {/* 收藏 / 删除 / 设置 */}
          <motion.div
            className="flex flex-row items-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0.0, x: 0 }}
            transition={transitions.normal}
          >
            <motion.button
              title={isFavorite ? '取消收藏' : '收藏'}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className={`cursor-pointer transition-colors rounded-lg p-2 flex items-center justify-center
              ${isFavorite
                  ? 'text-(--color-primary)'
                  : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                }`}
              whileHover={{ scale: 1.15, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              transition={transitions.fast}
            >
              <Heart
                className="w-5 h-5"
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </motion.button>
            {actionButtons.map(([icon, title, onClick, danger, rotate]) => (
              renderIconButton(icon, title, onClick, danger, rotate)
            ))}
          </motion.div>
        </div>
      </PageSection>

      <ContextMenu
        items={contextMenuItems}
        position={contextMenuState.position}
        visible={contextMenuState.visible}
        onClose={hideContextMenu}
        onItemClick={handleContextMenuAction}
      />

    </>
  );
};

export default GameListItem;
