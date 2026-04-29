import React from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadItem, ProgressBar } from '../common';
import { useDownload } from '../../hooks/useDownload';
import { X, Download, Check } from 'lucide-react';

interface DownloadProgressPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const DownloadProgressPanel: React.FC<DownloadProgressPanelProps> = ({
  visible = true,
  onClose,
}) => {
  const { t } = useTranslation();
  const { downloadQueue, cancelDownload } = useDownload();

  if (!visible) return null;

  const activeDownloads = downloadQueue.filter(item => 
    item.status === 'downloading' || item.status === 'pending'
  );
  
  const completedDownloads = downloadQueue.filter(item => 
    item.status === 'completed'
  );
  
  const errorDownloads = downloadQueue.filter(item => 
    item.status === 'error'
  );

  const totalProgress = downloadQueue.length > 0
    ? downloadQueue.reduce((acc, item) => acc + (item.downloaded / item.total) * 100, 0) / downloadQueue.length
    : 0;

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-surface border-l border-t border-border rounded-tl-lg shadow-2xl z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="text-text-primary font-semibold">
            {t('download.progress', '下载进度')}
          </h3>
          {downloadQueue.length > 0 && (
            <span className="px-2 py-0.5 bg-primary-bg text-primary text-xs rounded-full">
              {downloadQueue.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {completedDownloads.length > 0 && (
            <button
              onClick={() => {}}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors"
              title={t('download.clearCompleted', '清除已完成')}
            >
              <Check className="w-4 h-4 text-success" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors"
              title={t('common.close', '关闭')}
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      {activeDownloads.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              {t('download.overallProgress', '总进度')}
            </span>
            <span className="text-sm text-text-primary font-medium">
              {totalProgress.toFixed(1)}%
            </span>
          </div>
          <ProgressBar
            progress={totalProgress}
            status="active"
            size="sm"
            showIcon={false}
          />
          <p className="text-xs text-text-tertiary mt-1">
            {activeDownloads.length} {t('download.active', '个进行中')} · 
            {completedDownloads.length} {t('download.completed', '个已完成')} · 
            {errorDownloads.length} {t('download.error', '个错误')}
          </p>
        </div>
      )}

      {/* Download List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {downloadQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <Download className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">{t('download.noTasks', '暂无下载任务')}</p>
          </div>
        ) : (
          <>
            {/* Active Downloads */}
            {activeDownloads.map((item, index) => (
              <DownloadItem
                key={item.id}
                filename={item.filename}
                url={item.url}
                downloaded={item.downloaded}
                total={item.total}
                status={item.status}
                error={item.error}
                showCancel
                onCancel={() => cancelDownload(item.id)}
                sublabel={item.sha1 ? `SHA1: ${item.sha1.substring(0, 16)}...` : undefined}
              />
            ))}

            {/* Error Downloads */}
            {errorDownloads.map((item) => (
              <DownloadItem
                key={item.id}
                filename={item.filename}
                url={item.url}
                downloaded={item.downloaded}
                total={item.total}
                status={item.status}
                error={item.error}
                onRetry={() => {}}
              />
            ))}

            {/* Completed Downloads (collapsed) */}
            {completedDownloads.length > 0 && (
              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-surface-hover rounded-lg cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-text-secondary font-medium">
                      {t('download.completed', '已完成')} ({completedDownloads.length})
                    </span>
                  </div>
                  <span className="text-text-tertiary transform group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {completedDownloads.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-success-bg border border-green-500/20 rounded-lg"
                    >
                      <p className="text-sm text-success truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {(item.total / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadProgressPanel;
