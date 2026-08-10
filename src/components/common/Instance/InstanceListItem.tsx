import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameInstance, ModLoaderType } from '@/helper/rustInvoke'
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
import { listItem, transitions } from "@/utils/animations"
import { inferVersionType } from "@/utils/format"
import IconButton from '../IconButton';

/** 实例列表项组件 Props */
interface InstanceListItemProps {
  instance: GameInstance;
  selected?: boolean;
  onSelect?: () => void;
  onLaunch?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
  onSettings?: () => void;
  onFavorite?: () => void;
  index?: number;
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

const getLoaderIconPath = (type: ModLoaderType): string => {
  const iconMap: Record<string, string> = {
    [ModLoaderType.Vanilla]: 'vanilla.png',
    [ModLoaderType.Fabric]: 'fabric.png',
    [ModLoaderType.Forge]: 'forge.png',
    [ModLoaderType.NeoForge]: 'neoforge.png',
  };
  return iconMap[type] || 'grass.png';
};

/** 实例列表项组件，显示实例图标、名称、版本信息，支持右键菜单 */
const InstanceListItem = ({
  instance,
  selected = false,
  onSelect,
  onDelete,
  onOpenFolder,
  onRename,
  onSettings,
  onFavorite,
  index = 0,
}: InstanceListItemProps) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { contextMenuState, showContextMenu, hideContextMenu } = useContextMenu();

  useEffect(() => {
    const loadIcon = async () => {
      if (instance.icon_path) {
        setIconSrc(`asset://localhost/${instance.icon_path}`);
        return;
      }

      const customIconPaths = [
        `${instance.path}/icon.png`,
        `${instance.path}/icon.jpg`,
        `${instance.path}/icon.jpeg`,
        `${instance.path}/icon.gif`,
      ];

      for (const iconPath of customIconPaths) {
        try {
          const response = await fetch(`asset://localhost/${iconPath}`);
          if (response.ok) {
            setIconSrc(`asset://localhost/${iconPath}`);
            return;
          }
        } catch {
          continue;
        }
      }

      const loaderIconPath = `.smcl/assets/icons/${getLoaderIconPath(instance.loader_type)}`;
      setIconSrc(`asset://localhost/${loaderIconPath}`);
    };

    loadIcon();
  }, [instance]);

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
    { id: 'settings', label: '实例管理', icon: Settings },
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
    [Heart, '收藏', onFavorite, false, -5],
    [Trash2, '删除', onDelete, true, -5],
    [Settings, '设置', onSettings, false, 5],
  ];

  return (
    <>
      <motion.div
        variants={listItem}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ ...transitions.normal, delay: index * 0.03 }}
        className={`
          flex items-center px-3 py-1.5 
          cursor-pointer transition-all border-l-3
          ${selected
            ? 'border-l-primary shadow-md shadow-primary/15'
            : 'border-l-transparent hover:shadow-sm'
          }
          ${selected
            ? 'bg-(--color-primary-20) hover:bg-(--color-primary-hover)/30'
            : 'bg-(--color-surface) hover:bg-(--color-surface-hover)'
          }
        `}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onClick={handleClick}
        onContextMenu={showContextMenu}
      >

        {/* 图标 */}
        <motion.div
          className="flex-shrink-0 mr-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={transitions.spring}
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden 
            bg-primary-bg flex items-center justify-center border border-(--color-border)"
          >
            {iconSrc && !iconError ? (
              <img
                src={iconSrc}
                alt={instance.name}
                className="w-full h-full object-cover"
                onError={() => setIconError(true)}
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

        <div className="flex-1 min-w-0">
          {/* 实例名称 */}
          <motion.span>
            {instance.name}
          </motion.span>
          <div className="flex items-center gap-2 text-text-tertiary text-sm">

            <span
              className="rounded text-xs bg-surface-active text-(--color-text-tertiary)"
              style={{ whiteSpace: "pre" }}
            >
              {inferVersionType(instance.version_id) + `\x20`}  {instance.version_id}
            </span>

            {instance.loader_type !== ModLoaderType.Vanilla && (
              <motion.span
                className="text-sm bg-primary-bg text-secondary"
                whileHover={{ scale: 1.05 }}
              >
                {getLoaderLabel(instance.loader_type)}
                {instance.loader_version && ` ${instance.loader_version}`}
              </motion.span>
            )}
          </div>
        </div>

        {/* 收藏 / 删除 / 设置 */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isHovered ? 1 : 0.0, x: 0 }}
          transition={transitions.normal}
        >
          {actionButtons.map(([icon, title, onClick, danger, rotate]) => (
            renderIconButton(icon, title, onClick, danger, rotate)
          ))}
        </motion.div>
      </motion.div>

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

export default InstanceListItem;
