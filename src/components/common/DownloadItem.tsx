import React from 'react';
import { ProgressBar } from '../common';
import { formatFileSize } from '../../hooks/useDownload';

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
      case 'downloading':
        return 'active';
      case 'completed':
        return 'completed';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  };

  const formatValue = (_value: number) => {
    return `${formatFileSize(downloaded)} / ${formatFileSize(total)}`;
  };

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            status === 'completed' ? 'bg-green-500/20' :
            status === 'error' ? 'bg-red-500/20' :
            status === 'downloading' ? 'bg-blue-500/20' :
            'bg-gray-500/20'
          }`}>
            {status === 'completed' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : status === 'error' ? (
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : status === 'downloading' ? (
              <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium truncate" title={filename}>
              {filename}
            </p>
            {sublabel && (
              <p className="text-gray-500 text-sm truncate">{sublabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {status === 'downloading' && showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
            >
              取消
            </button>
          )}
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm rounded border border-indigo-500/30 transition-colors"
            >
              重试
            </button>
          )}
          {status === 'completed' && (
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-sm rounded border border-green-500/30">
              完成
            </span>
          )}
        </div>
      </div>

      {status !== 'pending' && (
        <ProgressBar
          progress={progress}
          status={getStatus()}
          formatValue={formatValue}
          size="sm"
          showIcon={false}
        />
      )}

      {error && (
        <p className="mt-2 text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
};

export default DownloadItem;
