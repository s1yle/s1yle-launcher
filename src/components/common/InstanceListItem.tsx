import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameInstance, ModLoaderType } from '../../helper/rustInvoke';
import {
  Settings,
  Trash2,
  FolderOpen,
  Edit3,
} from 'lucide-react';

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
}) => {
  const navigate = useNavigate();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  const handleClick = () => {
    onSelect?.();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleContextAction = (action: string) => {
    setShowContextMenu(false);
    switch (action) {
      case 'settings':
        onSettings?.();
        navigate(`/instance/${instance.id}/settings`);
        break;
      case 'rename': onRename?.(); break;
      case 'delete': onDelete?.(); break;
      case 'openFolder': onOpenFolder?.(); break;
    }
  };

  return (
    <>
      <div
        className={`flex items-center px-4 py-3 cursor-pointer transition-all border-l-4 ${
          selected
            ? 'bg-primary/15 border-l-primary shadow-md'
            : 'bg-surface hover:bg-surface-hover border-l-transparent'
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-bg flex items-center justify-center">
            {iconSrc && !iconError ? (
              <img
                src={iconSrc}
                alt={instance.name}
                className="w-full h-full object-cover"
                onError={() => setIconError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-text-primary font-medium truncate text-base">{instance.name}</h3>
          <p className="text-text-tertiary text-sm truncate">
            {instance.version}
            {instance.loader_type !== ModLoaderType.Vanilla && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-primary-bg text-primary">
                {getLoaderLabel(instance.loader_type)}
                {instance.loader_version && ` ${instance.loader_version}`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 rounded-lg hover:bg-error-bg text-text-tertiary hover:text-error transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.();
              navigate(`/instance/${instance.id}/settings`);
            }}
            className="p-2 rounded-lg hover:bg-primary-bg text-text-tertiary hover:text-primary transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-context-bg border border-context-border rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextAction('settings')}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
          >
            <Settings className="w-4 h-4" />
            <span>实例管理</span>
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => handleContextAction('rename')}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
          >
            <Edit3 className="w-4 h-4" />
            <span>重命名</span>
          </button>
          <button
            onClick={() => handleContextAction('delete')}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-error hover:bg-error-bg"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => handleContextAction('openFolder')}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
          >
            <FolderOpen className="w-4 h-4" />
            <span>打开所在文件夹</span>
          </button>
        </div>
      )}
    </>
  );
};

export default InstanceListItem;
