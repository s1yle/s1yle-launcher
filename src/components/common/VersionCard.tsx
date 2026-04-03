import React from 'react';
import { GameVersion } from '../../helper/rustInvoke';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/format';
import { Loader2 } from 'lucide-react';
import { Package } from 'lucide-react';

export interface VersionCardProps {
  version: GameVersion;
  installed: boolean;
  downloading: boolean;
  error?: string;
  selected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
  deployProgress: number;
}

const VersionCard: React.FC<VersionCardProps> = ({
  version,
  installed,
  downloading,
  error,
  selected,
  onSelect,
  onDownload,
  onDeploy,
  isDeploying,
  deployProgress,
}) => {
  return (
    <div
      className={`p-4 bg-surface border rounded-lg transition-all cursor-pointer ${
        selected ? 'border-primary' : 'border-border hover:border-border-hover'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-bg rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-text-primary font-medium">{version.id}</h3>
              <StatusBadge type={version.type_} />
              {installed && (
                <span className="px-2 py-0.5 text-xs rounded bg-success-bg text-success border border-success">
                  已安装
                </span>
              )}
            </div>
            <p className="text-text-tertiary text-sm mt-1">
              发布于 {formatDate(version.release_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installed ? (
            <div className="text-right">
              {isDeploying ? (
                <div className="w-32">
                  <ProgressBar progress={deployProgress} status="active" showPercentage size="sm" />
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeploy(); }}
                  className="px-4 py-2 bg-success hover:bg-success text-text-primary text-sm rounded-lg transition-colors"
                >
                  部署
                </button>
              )}
            </div>
          ) : downloading ? (
            <button className="px-4 py-2 bg-surface text-text-primary text-sm rounded-lg">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-text-primary" />
                下载中
              </span>
            </button>
          ) : error ? (
            <div className="text-right">
              <p className="text-error text-xs mb-1">{error}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm rounded-lg transition-colors"
            >
              下载
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
