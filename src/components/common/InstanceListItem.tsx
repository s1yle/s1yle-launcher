import React, { useState, useRef } from 'react';
import { GameInstance, ModLoaderType } from '../../helper/rustInvoke';
import {
  Rocket,
  MoreVertical,
  Pencil,
  FolderOpen,
  Copy,
  Trash2,
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
}

const ICONS = [
  '🧱', '🪵', '💎', '🗡️', '🛡️', '🏹', '🔥', '❄️', '⚡', '🧪',
  '🍎', '🍞', '🥩', '🥛', '🍪', '🎂', '🍕', '🍗', '🥕', '🌾',
  '🪨', '🌱', '🌿', '🍄', '🌺', '🌻', '🌲', '🌳', '🌴', '🌵',
  '💧', '🌊', '☀️', '🌙', '⭐', '⚔️', '🛠️', '📦', '🗺️', '📜',
];

const getIconForInstance = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ICONS[Math.abs(hash) % ICONS.length];
};

const getLoaderLabel = (type: ModLoaderType): string => {
  const labels: Record<string, string> = {
    Vanilla: 'Vanilla',
    Fabric: 'Fabric',
    Forge: 'Forge',
    NeoForge: 'NeoForge',
  };
  return labels[type] || type.toString();
};

const InstanceListItem: React.FC<InstanceListItemProps> = ({
  instance,
  selected = false,
  onSelect,
  onLaunch,
  onRename,
  onDuplicate,
  onDelete,
  onOpenFolder,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const icon = getIconForInstance(instance.name);

  const handleContextAction = (action: string) => {
    setShowMenu(false);
    switch (action) {
      case 'launch': onLaunch?.(); break;
      case 'rename': onRename?.(); break;
      case 'duplicate': onDuplicate?.(); break;
      case 'delete': onDelete?.(); break;
      case 'openFolder': onOpenFolder?.(); break;
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      className={`flex items-center px-4 py-3 border-b border-border cursor-pointer transition-all ${
        selected 
          ? 'bg-primary-bg border-l-4 border-l-primary' 
          : 'hover:bg-surface-hover'
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0 mr-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected 
            ? 'border-primary bg-primary' 
            : 'border-text-tertiary'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-text-primary" />}
        </div>
      </div>

      <div className="flex-shrink-0 mr-4 text-2xl">
        {icon}
      </div>

      <div className="flex-1 min-w-0 mr-4">
        <h3 className="text-text-primary font-medium truncate">{instance.name}</h3>
        <p className="text-text-tertiary text-sm truncate">
          {instance.version}
          {instance.loader_type !== ModLoaderType.Vanilla && (
            <span className="ml-1">
              , {getLoaderLabel(instance.loader_type)}: {instance.loader_version}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
          className="p-2 rounded-lg bg-success hover:bg-success text-text-primary transition-colors"
          title="启动"
        >
          <Rocket className="w-4 h-4" />
        </button>
        
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary transition-colors"
            title="更多操作"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              ref={menuRef}
              className="absolute right-0 top-full mt-1 z-50 bg-context-bg border border-context-border rounded-lg shadow-xl py-1 min-w-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleContextAction('launch')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
              >
                <Rocket className="w-4 h-4" />
                <span>启动游戏</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => handleContextAction('rename')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
              >
                <Pencil className="w-4 h-4" />
                <span>重命名</span>
              </button>
              <button
                onClick={() => handleContextAction('duplicate')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
              >
                <Copy className="w-4 h-4" />
                <span>复制实例</span>
              </button>
              <button
                onClick={() => handleContextAction('openFolder')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-text-secondary hover:bg-surface-hover"
              >
                <FolderOpen className="w-4 h-4" />
                <span>打开目录</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => handleContextAction('delete')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-error hover:bg-error-bg"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstanceListItem;