import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameInstance, ModLoaderType } from '../../helper/rustInvoke';
import {
  Settings,
  Trash2,
  FolderOpen,
  Edit3,
  Gamepad2,
} from 'lucide-react';
import ContextMenu, { useContextMenu, ContextMenuItemData } from './ContextMenu';
import { listItem, transitions } from '../../utils/animations';
import { inferVersionType } from '../../utils/format';

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

const InstanceListItem: React.FC<InstanceListItemProps> = ({
  instance,
  selected = false,
  onSelect,
  onDelete,
  onOpenFolder,
  onRename,
  onSettings,
  index = 0,
}) => {
  const navigate = useNavigate();
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
      case 'settings':
        onSettings?.();
        navigate(`/instance/${instance.id}/settings`);
        break;
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

  return (
    <>
      <motion.div
        variants={listItem}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        whileTap="tap"
        transition={{ ...transitions.normal, delay: index * 0.03 }}
        className={`flex items-center px-4 py-3 cursor-pointer transition-all border-l-4 ${
          selected
            ? 'border-l-primary shadow-md shadow-primary/15'
            : 'border-l-transparent hover:shadow-sm'
        }`}
        style={{
          backgroundColor: selected ? 'var(--color-primary-15)' : 'var(--color-surface-solid)',
        }}
        onMouseEnter={(e) => {
          if (!selected) {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-10)';
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          if (!selected) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-solid)';
          }
          setIsHovered(false);
        }}
        onClick={handleClick}
        onContextMenu={showContextMenu}
      >
        <motion.div 
          className="flex-shrink-0 mr-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={transitions.spring}
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-bg flex items-center justify-center shadow-md">
            {iconSrc && !iconError ? (
              <img
                src={iconSrc}
                alt={instance.name}
                className="w-full h-full object-cover"
                onError={() => setIconError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 mr-4">
          <motion.h3 
            className="text-text-primary font-medium truncate text-base"
            animate={{ x: isHovered ? 4 : 0 }}
            transition={transitions.fast}
          >
            {instance.name}
          </motion.h3>
          <div className="flex items-center gap-2 text-text-tertiary text-sm">
            <span className="px-2 py-0.5 rounded text-xs bg-surface-active text-text-secondary">
              {inferVersionType(instance.version)}
            </span>
            <span>{instance.version}</span>
            {instance.loader_type !== ModLoaderType.Vanilla && (
              <motion.span 
                className="px-2 py-0.5 rounded text-xs bg-primary-bg text-primary"
                whileHover={{ scale: 1.05 }}
              >
                {getLoaderLabel(instance.loader_type)}
                {instance.loader_version && ` ${instance.loader_version}`}
              </motion.span>
            )}
          </div>
        </div>

        <motion.div 
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isHovered ? 1 : 0.7, x: 0 }}
          transition={transitions.fast}
        >
          <motion.button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 rounded-lg hover:bg-error-bg text-text-tertiary hover:text-error transition-colors"
            title="删除"
            whileHover={{ scale: 1.15, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={transitions.spring}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.();
              navigate(`/instance/${instance.id}/settings`);
            }}
            className="p-2 rounded-lg hover:bg-primary-bg text-text-tertiary hover:text-primary transition-colors"
            title="设置"
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={transitions.spring}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
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
