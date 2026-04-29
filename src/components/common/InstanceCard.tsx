import React, { useRef, useState } from 'react';
import { GameInstance, ModLoaderType } from '../../helper/rustInvoke';
import {
  Gamepad2,
  Pencil,
  FolderOpen,
  MoreVertical,
  Rocket,
  Settings,
  Copy,
  Trash2,
  Package,
  FileText,
} from 'lucide-react';

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
  onOpenConfig?: () => void;
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
  onOpenConfig,
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
        return 'bg-info-bg text-info border-info';
      case ModLoaderType.Forge:
        return 'bg-warning-bg text-warning border-warning';
      case ModLoaderType.NeoForge:
        return 'bg-error-bg text-error border-error';
      default:
        return 'bg-success-bg text-success border-success';
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
      case 'launch': onLaunch?.(); break;
      case 'rename': onRename?.(); break;
      case 'duplicate': onDuplicate?.(); break;
      case 'delete': onDelete?.(); break;
      case 'openFolder': onOpenFolder?.(); break;
      case 'openConfigFolder': onOpenConfigFolder?.(); break;
      case 'export': onExport?.(); break;
      case 'openConfig': onOpenConfig?.(); break;
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
        className={`flex items-center px-4 py-3 border-b border-border transition-all cursor-pointer ${
          selected ? 'bg-primary-bg' : isHovered ? 'bg-surface' : ''
        } ${!instance.enabled ? 'opacity-60' : ''}`}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-10 h-10 bg-primary-bg rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-text-primary font-medium truncate">{instance.name}</h3>
            {isRunning && (
              <span className="px-2 py-0.5 text-xs rounded bg-success-bg text-success border border-success animate-pulse">
                运行中
              </span>
            )}
            {!instance.enabled && (
              <span className="px-2 py-0.5 text-xs rounded bg-error-bg text-error border border-error">
                已损坏
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mx-4">
          <span className="text-text-secondary text-sm">{instance.version}</span>
          <span className={`px-2 py-0.5 text-xs rounded border ${getLoaderColor(instance.loader_type)}`}>
            {getLoaderLabel(instance.loader_type)}
            {instance.loader_version && ` ${instance.loader_version}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {instance.last_played && (
            <span className="text-text-tertiary text-xs">{formatTimestamp(instance.last_played)}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
            disabled={isRunning || !instance.enabled}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isRunning || !instance.enabled
                ? 'bg-surface text-text-disabled cursor-not-allowed'
                : 'bg-success hover:bg-success text-text-primary'
            }`}
          >
            {isRunning ? '运行中' : '启动'}
          </button>
        </div>

        {showContextMenu && (
          <div ref={contextMenuRef} className="fixed z-50 bg-context-bg border border-context-border rounded-lg shadow-xl py-1 min-w-[180px]">
            <ContextMenuItem icon={<Rocket className="w-4 h-4" />} label="启动游戏" action={() => handleContextAction('launch')} />
            <ContextMenuItem icon={<Settings className="w-4 h-4" />} label="管理" action={() => handleContextAction('edit')} />
            <ContextMenuDivider />
            <ContextMenuItem icon={<Pencil className="w-4 h-4" />} label="重命名" action={() => handleContextAction('rename')} />
            <ContextMenuItem icon={<Copy className="w-4 h-4" />} label="复制实例" action={() => handleContextAction('duplicate')} />
            <ContextMenuItem icon={<Trash2 className="w-4 h-4" />} label="删除" action={() => handleContextAction('delete')} danger />
            <ContextMenuDivider />
            <ContextMenuItem icon={<FolderOpen className="w-4 h-4" />} label="打开游戏目录" action={() => handleContextAction('openFolder')} />
            <ContextMenuItem icon={<FileText className="w-4 h-4" />} label="打开配置文件夹" action={() => handleContextAction('openConfigFolder')} />
            <ContextMenuItem icon={<Package className="w-4 h-4" />} label="导出整合包" action={() => handleContextAction('export')} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-surface border rounded-lg transition-all cursor-pointer group ${
        selected
          ? 'border-primary bg-primary-bg shadow-lg shadow-primary/10'
          : 'border-border hover:border-border-hover hover:bg-surface-hover-hover'
      } ${!instance.enabled ? 'opacity-60' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary-bg rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
          <Gamepad2 className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-text-primary font-medium truncate">{instance.name}</h3>
            {isRunning && (
              <span className="px-2 py-0.5 text-xs rounded bg-success-bg text-success border border-success animate-pulse">
                运行中
              </span>
            )}
            {!instance.enabled && (
              <span className="px-2 py-0.5 text-xs rounded bg-error-bg text-error border border-error">
                已损坏
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">{instance.version}</span>
            <span className={`px-2 py-0.5 text-xs rounded border ${getLoaderColor(instance.loader_type)}`}>
              {getLoaderLabel(instance.loader_type)}
              {instance.loader_version && ` ${instance.loader_version}`}
            </span>
          </div>

          {showPath && (
            <p className="text-text-tertiary text-xs mt-1 font-mono truncate" title={instance.path}>
              {getInstanceFolderName(instance.path)}
            </p>
          )}

          {instance.last_played && !showPath && (
            <p className="text-text-tertiary text-xs mt-1">
              最后运行: {formatTimestamp(instance.last_played)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <button
          onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
          disabled={isRunning || !instance.enabled}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isRunning || !instance.enabled
              ? 'bg-surface text-text-disabled cursor-not-allowed'
              : 'bg-success hover:bg-success text-text-primary'
          }`}
        >
          {isRunning ? '运行中' : '启动'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenConfig?.(); }}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            title="配置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenFolder?.(); }}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            title="打开目录"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowContextMenu(true); }}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            title="更多操作"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showContextMenu && (
        <div ref={contextMenuRef} className="absolute right-0 top-full mt-1 z-50 bg-context-bg border border-context-border rounded-lg shadow-xl py-1 min-w-[180px]">
          <ContextMenuItem icon={<Rocket className="w-4 h-4" />} label="启动游戏" action={() => handleContextAction('launch')} />
          <ContextMenuItem icon={<Settings className="w-4 h-4" />} label="实例配置" action={() => handleContextAction('openConfig')} />
          <ContextMenuDivider />
          <ContextMenuItem icon={<Pencil className="w-4 h-4" />} label="重命名" action={() => handleContextAction('rename')} />
          <ContextMenuItem icon={<Copy className="w-4 h-4" />} label="复制实例" action={() => handleContextAction('duplicate')} />
          <ContextMenuItem icon={<Trash2 className="w-4 h-4" />} label="删除" action={() => handleContextAction('delete')} danger />
          <ContextMenuDivider />
          <ContextMenuItem icon={<FolderOpen className="w-4 h-4" />} label="打开游戏目录" action={() => handleContextAction('openFolder')} />
          <ContextMenuItem icon={<FileText className="w-4 h-4" />} label="打开配置文件夹" action={() => handleContextAction('openConfigFolder')} />
          <ContextMenuItem icon={<Package className="w-4 h-4" />} label="导出整合包" action={() => handleContextAction('export')} />
        </div>
      )}
    </div>
  );
};

const ContextMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  action: () => void;
  danger?: boolean;
}> = ({ icon, label, action, danger = false }) => (
  <button
    onClick={action}
    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
      danger
        ? 'text-error hover:bg-error-bg'
        : 'text-text-secondary hover:bg-surface-hover'
    }`}
  >
    <span className="w-4 h-4 flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </button>
);

const ContextMenuDivider = () => (
  <div className="my-1 border-t border-border" />
);

export default InstanceCard;
