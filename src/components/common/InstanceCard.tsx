import React, { useRef, useState } from 'react';
import { GameInstance, ModLoaderType } from '../../helper/rustInvoke';

export interface InstanceCardProps {
  instance: GameInstance;
  selected?: boolean;
  onSelect?: () => void;
  onLaunch?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onExport?: () => void;
  onOpenConfigFolder?: () => void;
  isRunning?: boolean;
  showPath?: boolean;
  viewMode?: 'grid' | 'list';
}

const InstanceCard: React.FC<InstanceCardProps> = ({
  instance,
  selected = false,
  onSelect,
  onLaunch,
  onEdit,
  onDelete,
  onOpenFolder,
  onDuplicate,
  onRename,
  onExport,
  onOpenConfigFolder,
  isRunning = false,
  showPath = false,
  viewMode = 'grid',
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getLoaderLabel = (type: ModLoaderType): string => {
    const labels: Record<string, string> = {
      Vanilla: 'Vanilla',
      Fabric: 'Fabric',
      Forge: 'Forge',
      NeoForge: 'NeoForge',
    };
    return labels[type] || type.toString();
  };

  const getLoaderColor = (type: ModLoaderType): string => {
    switch (type) {
      case ModLoaderType.Fabric:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case ModLoaderType.Forge:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case ModLoaderType.NeoForge:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN');
  };

  const getInstanceFolderName = (path: string): string => {
    const parts = path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || path;
  };

  const handleDoubleClick = () => {
    if (!isRunning && instance.enabled) {
      onLaunch?.();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleContextAction = (action: string) => {
    setShowContextMenu(false);
    switch (action) {
      case 'launch':
        onLaunch?.();
        break;
      case 'rename':
        onRename?.();
        break;
      case 'duplicate':
        onDuplicate?.();
        break;
      case 'delete':
        onDelete?.();
        break;
      case 'openFolder':
        onOpenFolder?.();
        break;
      case 'openConfigFolder':
        onOpenConfigFolder?.();
        break;
      case 'export':
        onExport?.();
        break;
      case 'edit':
        onEdit?.();
        break;
    }
  };

  React.useEffect(() => {
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

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center px-4 py-3 border-b border-white/10 transition-all cursor-pointer ${
          selected ? 'bg-indigo-500/10' : isHovered ? 'bg-white/5' : ''
        } ${!instance.enabled ? 'opacity-60' : ''}`}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
          <span className="text-xl">🎮</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{instance.name}</h3>
            {isRunning && (
              <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                运行中
              </span>
            )}
            {!instance.enabled && (
              <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">
                已损坏
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mx-4">
          <span className="text-gray-400 text-sm">{instance.version}</span>
          <span className={`px-2 py-0.5 text-xs rounded border ${getLoaderColor(instance.loader_type)}`}>
            {getLoaderLabel(instance.loader_type)}
            {instance.loader_version && ` ${instance.loader_version}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {instance.last_played && (
            <span className="text-gray-500 text-xs">{formatTimestamp(instance.last_played)}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
            disabled={isRunning || !instance.enabled}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isRunning || !instance.enabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? '运行中' : '启动'}
          </button>
        </div>

        {showContextMenu && (
          <div ref={contextMenuRef} className="fixed z-50 bg-gray-800 border border-white/20 rounded-lg shadow-xl py-1 min-w-[180px]">
            <ContextMenuItem icon="🚀" label="启动游戏" action={() => handleContextAction('launch')} />
            <ContextMenuItem icon="⚙️" label="管理" action={() => handleContextAction('edit')} />
            <ContextMenuDivider />
            <ContextMenuItem icon="✏️" label="重命名" action={() => handleContextAction('rename')} />
            <ContextMenuItem icon="📋" label="复制实例" action={() => handleContextAction('duplicate')} />
            <ContextMenuItem icon="🗑️" label="删除" action={() => handleContextAction('delete')} danger />
            <ContextMenuDivider />
            <ContextMenuItem icon="📁" label="打开游戏目录" action={() => handleContextAction('openFolder')} />
            <ContextMenuItem icon="⚙️" label="打开配置文件夹" action={() => handleContextAction('openConfigFolder')} />
            <ContextMenuItem icon="📦" label="导出整合包" action={() => handleContextAction('export')} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-white/5 border rounded-lg transition-all cursor-pointer group ${
        selected
          ? 'border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
          : 'border-white/10 hover:border-white/30 hover:bg-white/8'
      } ${!instance.enabled ? 'opacity-60' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
          <span className="text-2xl">🎮</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">{instance.name}</h3>
            {isRunning && (
              <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                运行中
              </span>
            )}
            {!instance.enabled && (
              <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">
                已损坏
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">{instance.version}</span>
            <span className={`px-2 py-0.5 text-xs rounded border ${getLoaderColor(instance.loader_type)}`}>
              {getLoaderLabel(instance.loader_type)}
              {instance.loader_version && ` ${instance.loader_version}`}
            </span>
          </div>

          {showPath && (
            <p className="text-gray-500 text-xs mt-1 font-mono truncate" title={instance.path}>
              📁 {getInstanceFolderName(instance.path)}
            </p>
          )}

          {instance.last_played && !showPath && (
            <p className="text-gray-500 text-xs mt-1">
              最后运行: {formatTimestamp(instance.last_played)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <button
          onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
          disabled={isRunning || !instance.enabled}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isRunning || !instance.enabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? '运行中' : '启动'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="编辑"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenFolder?.(); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="打开目录"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowContextMenu(true); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="更多操作"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {showContextMenu && (
        <div ref={contextMenuRef} className="absolute right-0 top-full mt-1 z-50 bg-gray-800 border border-white/20 rounded-lg shadow-xl py-1 min-w-[180px]">
          <ContextMenuItem icon="🚀" label="启动游戏" action={() => handleContextAction('launch')} />
          <ContextMenuItem icon="⚙️" label="管理" action={() => handleContextAction('edit')} />
          <ContextMenuDivider />
          <ContextMenuItem icon="✏️" label="重命名" action={() => handleContextAction('rename')} />
          <ContextMenuItem icon="📋" label="复制实例" action={() => handleContextAction('duplicate')} />
          <ContextMenuItem icon="🗑️" label="删除" action={() => handleContextAction('delete')} danger />
          <ContextMenuDivider />
          <ContextMenuItem icon="📁" label="打开游戏目录" action={() => handleContextAction('openFolder')} />
          <ContextMenuItem icon="⚙️" label="打开配置文件夹" action={() => handleContextAction('openConfigFolder')} />
          <ContextMenuItem icon="📦" label="导出整合包" action={() => handleContextAction('export')} />
        </div>
      )}
    </div>
  );
};

const ContextMenuItem: React.FC<{
  icon: string;
  label: string;
  action: () => void;
  danger?: boolean;
}> = ({ icon, label, action, danger = false }) => (
  <button
    onClick={action}
    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-gray-300 hover:bg-white/10'
    }`}
  >
    <span className="w-4 text-center">{icon}</span>
    <span>{label}</span>
  </button>
);

const ContextMenuDivider = () => (
  <div className="my-1 border-t border-white/10" />
);

export default InstanceCard;