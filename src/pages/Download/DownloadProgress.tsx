import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Check,  Loader, XCircle } from 'lucide-react';
import { useDownloadStore } from '../../stores/downloadStore';
import { refreshAll } from '../../stores/refreshStore';

/**
 * 下载进度全屏页 - 展示所有版本下载任务的实时进度
 */
const DownloadProgress: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const downloadingVersions = useDownloadStore((s) => s.downloadingVersions);
  const completedVersions = useDownloadStore((s) => s.completedVersions);

  useEffect(() => {
    void refreshAll();
  }, []);

  const activeList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter((v) => v.status !== 'error');
  }, [downloadingVersions]);

  const errorList = useMemo(() => {
    return Array.from(downloadingVersions.values()).filter((v) => v.status === 'error');
  }, [downloadingVersions]);

  const totalProgress = useMemo(() => {
    if (activeList.length === 0) return 0;
    return activeList.reduce((acc, v) => acc + v.progress, 0) / activeList.length;
  }, [activeList]);

  const handleBack = useCallback(() => {
    navigate('/download/game');
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg-primary)] relative">
      {/* 顶部拖曳栏 */}
      <div
        className="h-12 flex-shrink-0 flex items-center gap-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-solid)]"
        data-tauri-drag-region="true"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleBack}
          className="p-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-active)] transition-colors cursor-pointer"
          title={t('download.install.back')}
          data-tauri-drag-region="false"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <span className="text-sm font-semibold text-[var(--color-text-primary)] select-none">
          {t('download.progressTitle')}
        </span>
        <div className="flex-1" data-tauri-drag-region="true" />
        {activeList.length > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)] select-none" data-tauri-drag-region="true">
            {t('download.overallProgress')}: {totalProgress.toFixed(1)}%
          </span>
        )}
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 pb-10">
          {activeList.length > 0 && (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {t('download.downloading')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
                  {activeList.length}
                </span>
              </div>

              {activeList.map((item) => (
                <div key={item.versionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Minecraft {item.versionId}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {item.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[var(--color-surface-tertiary)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {errorList.length > 0 && (
            <section className="rounded-xl border border-[var(--color-danger-border, var(--color-border))] bg-[var(--color-surface)] p-5 space-y-2">
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
            </section>
          )}

          {completedVersions.length > 0 && (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-2">
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
            </section>
          )}

          {activeList.length === 0 && errorList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-tertiary)]">
              <Loader className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">{t('download.noTasks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadProgress;