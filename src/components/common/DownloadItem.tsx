import React from 'react';
import { ProgressBar } from '../common';
import { formatFileSize } from '../../utils/format';
import { Check, X, Download, Clock } from 'lucide-react';

export interface DownloadItemProps {
  filename: string;
  url?: string;
  downloaded: number;
  total: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  sublabel?: string;
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  filename,
  downloaded,
  total,
  status,
  error,
  showCancel = false,
  onCancel,
  onRetry,
  sublabel,
}) => {
  const progress = total > 0 ? (downloaded / total) * 100 : 0;

  const getStatus = (): 'idle' | 'active' | 'completed' | 'error' => {
    switch (status) {
      case 'downloading': return 'active';
      case 'completed': return 'completed';
      case 'error': return 'error';
      default: return 'idle';
    }
  };

  const formatValue = (_value: number) => {
    return `${formatFileSize(downloaded)} / ${formatFileSize(total)}`;
  };

  const iconConfig = {
    completed: { icon: <Check className="w-5 h-5 text-green-400" />, bg: 'bg-success-bg' },
    error: { icon: <X className="w-5 h-5 text-error" />, bg: 'bg-error-bg' },
    downloading: { icon: <Download className="w-5 h-5 text-info animate-pulse" />, bg: 'bg-info-bg' },
    pending: { icon: <Clock className="w-5 h-5 text-text-tertiary" />, bg: 'bg-surface' },
  };

  const { icon, bg } = iconConfig[status];

  return (
    <div className="p-4 bg-surface border border-border rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary font-medium truncate" title={filename}>
              {filename}
            </p>
            {sublabel && <p className="text-text-tertiary text-sm truncate">{sublabel}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {status === 'downloading' && showCancel && onCancel && (
            <button onClick={onCancel} className="px-3 py-1.5 bg-error-bg hover:bg-red-500/30 text-error text-sm rounded border border-red-500/30 transition-colors">
              取消
            </button>
          )}
          {status === 'error' && onRetry && (
            <button onClick={onRetry} className="px-3 py-1.5 bg-primary-bg hover:bg-indigo-500/30 text-primary text-sm rounded border border-indigo-500/30 transition-colors">
              重试
            </button>
          )}
          {status === 'completed' && (
            <span className="px-3 py-1.5 bg-success-bg text-green-400 text-sm rounded border border-green-500/30">
              完成
            </span>
          )}
        </div>
      </div>

      {status !== 'pending' && (
        <ProgressBar progress={progress} status={getStatus()} formatValue={formatValue} size="sm" showIcon={false} />
      )}

      {error && <p className="mt-2 text-error text-xs">{error}</p>}
    </div>
  );
};

export default DownloadItem;
