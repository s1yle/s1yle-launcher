import React from 'react';
import { GameVersion } from '../../helper/rustInvoke';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/format';
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
      className={`p-4 bg-white/5 border rounded-lg transition-all cursor-pointer ${
        selected ? 'border-indigo-500/50' : 'border-white/10 hover:border-white/20'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{version.id}</h3>
              <StatusBadge type={version.type_} />
              {installed && (
                <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  已安装
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm mt-1">
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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  部署
                </button>
              )}
            </div>
          ) : downloading ? (
            <button className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg">
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                下载中
              </span>
            </button>
          ) : error ? (
            <div className="text-right">
              <p className="text-red-400 text-xs mb-1">{error}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
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
