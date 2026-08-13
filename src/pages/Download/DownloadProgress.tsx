import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, XCircle, X } from 'lucide-react';
import { useDownloadStore } from '../../stores/downloadStore';
import { refreshAll } from '../../stores/refreshStore';
import { EmptyState, Page, PageSection, ProgressBar, ProgressBarProps } from '../../components/common';

/** 字节数格式化（KB/MB） */
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 KB/s';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
  return `${(bytes / 1024).toFixed(1)} KB/s`;
};

/** 下载进度全屏页 - 展示所有版本下载任务的实时进度（字节级，统一 download-progress 事件驱动） */
const DownloadProgress: React.FC = () => {
  const { t } = useTranslation();
  const downloadingVersions = useDownloadStore((s) => s.downloadingVersions);
  const completedVersions = useDownloadStore((s) => s.completedVersions);
  const cancelVersionDownloadAction = useDownloadStore((s) => s.cancelVersionDownloadAction);

  useEffect(() => {
    void refreshAll();
  }, []);

  const activeList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter((v) => v.status !== 'error');
  }, [downloadingVersions]);

  const errorList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter((v) => v.status === 'error');
  }, [downloadingVersions]);

  const empty = activeList.length === 0 && errorList.length === 0;

  return (
    <Page className="h-full flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 pb-10">
          {empty && (
            <EmptyState
              icon="download"
              title={t('download.noTasks')}
            />
          )}

          {activeList.length > 0 && (
            <PageSection className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {t('download.downloading')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
                  {activeList.length}
                </span>
              </div>

              {activeList.map((item) => {
                const status: ProgressBarProps['status'] =
                  item.status === 'completed' ? 'completed' : 'active';
                const stepLabel = item.step ? t(`download.phase.${item.step}`, item.step) : '';
                const subParts = [
                  stepLabel,
                  item.file,
                  item.filesTotal ? `${item.filesDone ?? 0}/${item.filesTotal}` : undefined,
                  formatBytes(item.speed),
                ].filter(Boolean);

                return (
                  <div key={item.versionId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        Minecraft {item.versionId}
                      </span>
                      <button
                        onClick={() => cancelVersionDownloadAction(item.versionId)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--color-text-secondary)] hover:text-red-500 bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t('common.cancel')}
                      </button>
                    </div>
                    <ProgressBar
                      progress={item.progress}
                      status={status}
                      showIcon
                      size="md"
                      sublabel={subParts.join(' · ')}
                    />
                  </div>
                );
              })}
            </PageSection>
          )}

          {errorList.length > 0 && (
            <PageSection className="rounded-xl border border-[var(--color-danger-border, var(--color-border))] bg-[var(--color-surface)] p-5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {t('download.failed')}
                </h2>
              </div>
              {errorList.map((item) => (
                <div key={item.versionId} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">
                    Minecraft {item.versionId}
                  </span>
                  <span className="text-xs text-red-400 truncate max-w-[60%]">{item.error}</span>
                </div>
              ))}
            </PageSection>
          )}

          {completedVersions.length > 0 && (
            <PageSection className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-2">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
                {t('download.completed')}
              </h2>
              {completedVersions.map((version, index) => (
                <div
                  key={`${version}-${index}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[var(--color-success-10)] border border-[var(--color-success-20)]"
                >
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text-primary)]">Minecraft {version}</span>
                </div>
              ))}
            </PageSection>
          )}
        </div>
      </div>
    </Page>
  );
};

export default DownloadProgress;
