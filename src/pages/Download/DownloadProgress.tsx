import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader2 } from 'lucide-react';
import { useDownloadStore } from '../../stores/downloadStore';
import { refreshAll } from '../../stores/refreshStore';
import { EmptyState, Page, PageSection, ProgressBar, ProgressBarProps, SettingsPanel } from '../../components/common';

/** 字节数格式化（KB/MB） */
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 KB/s';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
  return `${(bytes / 1024).toFixed(1)} KB/s`;
};

/** 分段步骤状态 */
type StepState = 'done' | 'active' | 'pending';

/** 每个分段的阶段归属（顺序即 UI 展示顺序） */
const SEGMENT_PHASES: string[][] = [
  ['downloading_client'],
  ['downloading_libraries', 'downloading_natives'],
  ['downloading_assets', 'downloading_index', 'downloading_log_config'],
  ['validating'],
];

/** 阶段 → 分段索引 */
const PHASE_SEGMENT = new Map<string, number>();
SEGMENT_PHASES.forEach((phases, idx) => phases.forEach((p) => PHASE_SEGMENT.set(p, idx)));

/** 根据当前阶段推导某分段的状态 */
const segmentState = (step: string | undefined, idx: number): StepState => {
  if (!step) return 'pending';
  const current = PHASE_SEGMENT.get(step);
  if (current === undefined) return 'pending';
  if (current > idx) return 'done';
  if (current === idx) return 'active';
  return 'pending';
};

/** 分段步骤指示器图标 */
const StepIcon = ({ state }: { state: StepState }) => {
  if (state === 'done') {
    return <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />;
  }
  if (state === 'active') {
    return <Loader2 className="w-3.5 h-3.5 text-[var(--color-primary)] animate-spin shrink-0" />;
  }
  return <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] shrink-0" />;
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

  const empty = activeList.length === 0 && errorList.length === 0 && completedVersions.length === 0;

  return (
    <Page className="p-6 max-w-2xl mx-auto">
      {empty && (
        <EmptyState
          icon="download"
          title={t('download.noTasks')}
        />
      )}

      {activeList.length > 0 && (
        <PageSection>
          <SettingsPanel label={t('download.downloading')}>
            {activeList.map((item) => {
              const status: ProgressBarProps['status'] =
                item.status === 'completed' ? 'completed' : 'active';
              const segments = [
                { key: 'client', label: `${item.versionId}.jar` },
                { key: 'libraries', label: t('download.steps.libraries') },
                { key: 'assets', label: t('download.steps.assets') },
                { key: 'validating', label: t('download.steps.validating') },
              ];
              const subParts = [
                item.file,
                item.filesTotal ? `${item.filesDone ?? 0}/${item.filesTotal}` : undefined,
                formatBytes(item.speed),
              ].filter(Boolean);

              return (
                <SettingsPanel.Item key={item.versionId}>
                  <SettingsPanel.Row label={`Minecraft ${item.versionId}`}>
                    <button
                      onClick={() => cancelVersionDownloadAction(item.versionId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('common.cancel')}
                    </button>
                  </SettingsPanel.Row>

                  <div className="flex flex-col gap-1.5 py-1">
                    {segments.map((seg, idx) => {
                      const state = segmentState(item.step, idx);
                      return (
                        <div
                          key={seg.key}
                          className={`flex items-center gap-2 text-xs ${state === 'pending' ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}
                        >
                          <StepIcon state={state} />
                          <span className={state === 'active' ? 'text-[var(--color-primary)]' : ''}>
                            {seg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <ProgressBar
                    progress={item.progress}
                    status={status}
                    showIcon
                    size="md"
                    sublabel={subParts.join(' · ')}
                  />
                </SettingsPanel.Item>
              );
            })}
          </SettingsPanel>
        </PageSection>
      )}

      {errorList.length > 0 && (
        <PageSection>
          <SettingsPanel label={t('download.failed')}>
            {errorList.map((item) => (
              <SettingsPanel.Item key={item.versionId}>
                <SettingsPanel.Row label={`Minecraft ${item.versionId}`}>
                  <span className="text-xs text-red-400 truncate max-w-[60%]">{item.error}</span>
                </SettingsPanel.Row>
              </SettingsPanel.Item>
            ))}
          </SettingsPanel>
        </PageSection>
      )}

      {completedVersions.length > 0 && (
        <PageSection>
          <SettingsPanel label={t('download.completed')}>
            {completedVersions.map((version, index) => (
              <SettingsPanel.Item key={`${version}-${index}`}>
                <SettingsPanel.Row label={`Minecraft ${version}`}>
                  <Check className="w-4 h-4 text-green-500" />
                </SettingsPanel.Row>
              </SettingsPanel.Item>
            ))}
          </SettingsPanel>
        </PageSection>
      )}
    </Page>
  );
};

export default DownloadProgress;
