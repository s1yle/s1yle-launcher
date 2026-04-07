import React from 'react';
import { GameVersion } from '../../helper/rustInvoke';
import { formatDate } from '../../utils/format';
import StatusBadge from './StatusBadge';
import { ExternalLink, Package, CheckCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface VersionListItemProps {
  version: GameVersion;
  installed: boolean;
  wikiUrl?: string;
  downloading?: boolean;
  onClick: () => void;
  onWikiClick: () => void;
  onDownload?: () => void;
  onDeploy?: () => void;
  isDeploying?: boolean;
  deployProgress?: number;
}

const VersionListItem: React.FC<VersionListItemProps> = ({
  version,
  installed,
  downloading,
  onClick,
  onWikiClick,
  onDownload,
  onDeploy,
  isDeploying,
  deployProgress,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-surface border rounded-lg transition-all duration-200',
        'hover:border-primary/50 hover:bg-primary-bg hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5',
        'active:scale-[0.99]',
        installed ? 'border-success/60' : 'border-border'
      )}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        className="w-9 h-9 bg-primary-bg rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={onClick}
      >
        <Package className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          <h3 className="text-text-primary font-medium text-sm truncate">{version.id}</h3>
          <StatusBadge type={version.type_} />
          {installed && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-success-bg text-success border border-success">
              已安装
            </span>
          )}
        </div>
        <p className="text-text-tertiary text-xs mt-0.5">
          {formatDate(version.release_time)}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onWikiClick(); }}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-primary transition-colors rounded hover:bg-surface-hover flex-shrink-0"
        title="Minecraft Wiki"
      >
        <ExternalLink className="w-3 h-3" />
        <span className="hidden sm:inline">Wiki</span>
      </button>

      <div className="flex items-center gap-2 flex-shrink-0">
        {installed ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
        ) : downloading ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="px-2 py-1 text-[10px] rounded bg-surface-active text-text-secondary flex items-center gap-1"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            下载中
          </button>
        ) : isDeploying ? (
          <div className="w-16 text-[10px] text-text-tertiary">
            部署中 {deployProgress ?? 0}%
          </div>
        ) : onDownload ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="px-2 py-1 text-[10px] rounded bg-primary hover:bg-primary-hover text-text-primary transition-colors"
          >
            下载
          </button>
        ) : onDeploy ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDeploy(); }}
            className="px-2 py-1 text-[10px] rounded bg-success hover:bg-success text-text-primary transition-colors"
          >
            部署
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default VersionListItem;
