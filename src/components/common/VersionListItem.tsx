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
        'flex items-center gap-4 p-4 bg-surface border rounded-lg transition-all duration-200',
        'hover:border-primary/50 hover:bg-surface-hover hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01]',
        'active:scale-[0.99]',
        installed ? 'border-success/60' : 'border-border'
      )}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        className="w-10 h-10 bg-primary-bg rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={onClick}
      >
        <Package className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          <h3 className="text-text-primary font-medium truncate">{version.id}</h3>
          <StatusBadge type={version.type_} />
          {installed && (
            <span className="px-2 py-0.5 text-xs rounded bg-success-bg text-success border border-success">
              已安装
            </span>
          )}
        </div>
        <p className="text-text-tertiary text-sm mt-0.5">
          {formatDate(version.release_time)}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onWikiClick(); }}
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-secondary hover:text-primary transition-colors rounded hover:bg-surface-hover flex-shrink-0"
        title="Minecraft Wiki"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Wiki</span>
      </button>

      <div className="flex items-center gap-2 flex-shrink-0">
        {installed ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        ) : downloading ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="px-3 py-1.5 text-xs rounded bg-surface-active text-text-secondary flex items-center gap-1.5"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            下载中
          </button>
        ) : isDeploying ? (
          <div className="w-20 text-xs text-text-tertiary">
            部署中 {deployProgress ?? 0}%
          </div>
        ) : onDownload ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="px-3 py-1.5 text-xs rounded bg-primary hover:bg-primary-hover text-text-primary transition-colors"
          >
            下载
          </button>
        ) : onDeploy ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDeploy(); }}
            className="px-3 py-1.5 text-xs rounded bg-success hover:bg-success text-text-primary transition-colors"
          >
            部署
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default VersionListItem;
