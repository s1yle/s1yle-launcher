import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, FolderOpen } from 'lucide-react';
import { useDownload } from '../../hooks/useDownload';
import { GameVersion, openFolder, openUrl } from '../../helper/rustInvoke';
import { ProgressBar, DownloadItem, VersionListItem, VersionFilterDropdown, EmptyState, useNotification, VirtualList } from '../../components/common';
import { useNavStore } from '../../stores/navStore';
import { getWikiUrl } from '../../utils/modloaderCompat';
import { VersionCategory, filterVersionsByCategory, debugVersionTypes } from '../../utils/versionFilter';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

type TabType = 'browse' | 'downloading' | 'installed';

const ITEM_HEIGHT = 72;

const DownloadGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentPath } = useNavStore();
  const {
    manifest,
    installedVersions,
    downloadTasks,
    downloadPath,
    loading,
    error,
    categoryProgress,
    isDownloading,
    cancelDownloadVersion,
    cancelTask,
    clearCompleted,
    downloadVersion,
    deployVersion,
  } = useDownload();

  const { error: notifyError, success, info } = useNotification();

  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [filter, setFilter] = useState<VersionCategory>('release');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingVersions] = useState(() => new Set<string>());
  const [deployingVersions] = useState(() => new Set<string>());

  // Debug: Log version type distribution
  useMemo(() => {
    if (manifest?.versions) {
      console.log('=== Version Types Debug ===');
      debugVersionTypes(manifest.versions);
    }
  }, [manifest?.versions]);

  // Memoized version list to avoid unnecessary recalculations
  const versionsToShow = useMemo(() => {
    if (!manifest?.versions) return [];
    let versions = filterVersionsByCategory(manifest.versions, filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      versions = versions.filter(v =>
        v.id.toLowerCase().includes(query) ||
        (v.name && v.name.toLowerCase().includes(query))
      );
    }

    return versions;
  }, [manifest?.versions, filter, searchQuery]);

  // Memoized installed versions set for O(1) lookup
  const installedSet = useMemo(() => 
    new Set(installedVersions),
  [installedVersions]);

  const handleVersionClick = useCallback((version: GameVersion) => {
    navigate(`/download/game/${encodeURIComponent(version.id)}`);
    setCurrentPath(`/download/game/${encodeURIComponent(version.id)}`);
  }, [navigate, setCurrentPath]);

  const handleWikiClick = useCallback((versionId: string) => {
    openUrl(getWikiUrl(versionId));
  }, []);

  const handleDownload = useCallback(async (version: GameVersion) => {
    if (downloadingVersions.has(version.id)) return;
    downloadingVersions.add(version.id);

    try {
      info(t('notification.downloadStarted'), `${version.id}...`);
      await downloadVersion(version);
      success(t('common.success'), `${version.id} ${t('notification.downloadCompleted')}`);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.downloadFailed'));
    } finally {
      downloadingVersions.delete(version.id);
    }
  }, [downloadVersion, info, notifyError, success, t, downloadingVersions]);

  const handleDeploy = useCallback(async (versionId: string) => {
    if (deployingVersions.has(versionId)) return;
    deployingVersions.add(versionId);

    try {
      info(t('download.deploying'), `${versionId}...`);
      await deployVersion(versionId);
      success(t('common.success'), `${versionId} ${t('notification.deployCompleted')}`);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.deployFailed'));
    } finally {
      deployingVersions.delete(versionId);
    }
  }, [deployVersion, info, notifyError, success, t, deployingVersions]);

  const handleCancel = useCallback(async (task: { id: string }) => {
    try {
      await cancelTask(task.id);
    } catch {
      notifyError(t('notification.error'), t('common.cancel'));
    }
  }, [cancelTask, notifyError, t]);

  const handleClearCompleted = useCallback(async () => {
    try {
      await clearCompleted();
    } catch {
      notifyError(t('notification.error'), t('common.cancel'));
    }
  }, [clearCompleted, notifyError, t]);

  const handleOpenDownloadFolder = useCallback(async () => {
    if (!downloadPath) return;
    try {
      await openFolder(downloadPath);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.error'));
    }
  }, [downloadPath, notifyError, t]);

  const handleLaunch = useCallback((versionId: string) => {
    info('启动游戏', `正在启动 ${versionId}...`);
  }, [info]);

  const tabs: { id: TabType; label: string; count?: number }[] = useMemo(() => [
    { id: 'browse', label: t('download.browse') },
    { id: 'downloading', label: t('download.downloading'), count: downloadTasks.filter(task => task.status === 'downloading').length || categoryProgress.length },
    { id: 'installed', label: t('download.installed'), count: installedVersions.length },
  ], [t, downloadTasks, categoryProgress.length, installedVersions.length]);

  const totalProgress = useMemo(() => {
    if (categoryProgress.length === 0) return 0;
    const total = categoryProgress.reduce((sum, c) => sum + c.total, 0);
    const completed = categoryProgress.reduce((sum, c) => sum + c.completed, 0);
    return total > 0 ? (completed / total) * 100 : 0;
  }, [categoryProgress]);

  const renderVersionItem = useCallback((version: GameVersion) => (
    <VersionListItem
      version={version}
      installed={installedSet.has(version.id)}
      downloading={downloadingVersions.has(version.id)}
      isDeploying={deployingVersions.has(version.id)}
      onClick={() => handleVersionClick(version)}
      onWikiClick={() => handleWikiClick(version.id)}
      onDownload={() => handleDownload(version)}
      onDeploy={() => handleDeploy(version.id)}
    />
  ), [installedSet, downloadingVersions, deployingVersions, handleVersionClick, handleWikiClick, handleDownload, handleDeploy]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 pb-2 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{t('download.gameTitle')}</h1>
        <p className="text-text-tertiary text-sm">{t('download.gameDesc')}</p>
      </div>

      <div className="flex gap-1 px-4 py-2 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-primary text-text-primary'
                : 'bg-surface text-text-tertiary hover:bg-surface-hover hover:text-text-primary'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-surface-active">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-6 my-2 p-4 bg-error-bg border border-red-500/30 rounded-lg flex-shrink-0">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 min-h-0 px-0 py-2 overflow-hidden">
        {activeTab === 'browse' && (
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-3 mb-3 flex-shrink-0 px-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('download.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-surface-solid)', 
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <VersionFilterDropdown
                value={filter}
                onChange={setFilter}
                versions={manifest?.versions || []}
              />
            </div>

            {manifest?.latest && (
              <div className="p-2 rounded-lg mb-2 flex-shrink-0 px-4"
                style={{ backgroundColor: 'var(--color-primary-bg)', borderColor: 'var(--color-primary)', borderWidth: '1px', borderStyle: 'solid' }}
              >
                <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                  {t('download.latestRelease')}: <span className="font-mono font-bold">{manifest.latest.release}</span>
                  {manifest.latest.snapshot !== manifest.latest.release && (
                    <> | {t('download.latestSnapshot')}: <span className="font-mono font-bold">{manifest.latest.snapshot}</span></>
                  )}
                </p>
              </div>
            )}

            {loading && !manifest ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
                <span className="ml-3" style={{ color: 'var(--color-text-tertiary)' }}>{t('common.loading')}</span>
              </div>
            ) : versionsToShow.length === 0 ? (
              <EmptyState
                icon="search"
                title={t('download.noVersion')}
                description={t('download.noVersionDesc')}
              />
            ) : (
              <div className="flex-1 min-h-0">
                <VirtualList
                  items={versionsToShow}
                  height="100%"
                  itemHeight={ITEM_HEIGHT}
                  overscan={5}
                  className="h-full"
                  renderItem={renderVersionItem}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloading' && (
          <div className="h-full min-h-0 flex flex-col">
            {categoryProgress.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-custom">
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm">{t('download.downloadProgress')}</p>
                  {isDownloading && (
                    <button
                      onClick={() => cancelDownloadVersion()}
                      className="px-3 py-1 text-sm rounded transition-colors"
                      style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
                <ProgressBar
                  progress={totalProgress}
                  status={isDownloading ? 'active' : 'completed'}
                  label={t('download.overallProgress')}
                  size="md"
                />
                {categoryProgress.map(cat => (
                  <div key={cat.category} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-solid)', borderColor: 'var(--color-border)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ color: 'var(--color-text-primary)' }} className="text-sm font-medium">{cat.label}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }} className="text-xs">
                        {cat.completed} / {cat.total}
                        {cat.failed > 0 && (
                          <span className="ml-2" style={{ color: 'var(--color-error)' }}>{cat.failed} {t('download.failed')}</span>
                        )}
                      </span>
                    </div>
                    <ProgressBar
                      progress={cat.total > 0 ? (cat.completed / cat.total) * 100 : 0}
                      status={cat.failed > 0 ? 'error' : cat.completed === cat.total ? 'completed' : 'active'}
                      size="sm"
                    />
                    {cat.error && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{cat.error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : downloadTasks.length === 0 ? (
              <EmptyState
                icon="download"
                title={t('download.noDownload')}
                description={t('download.noDownloadDesc')}
              />
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-custom">
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm">
                    {t('download.totalTasks', { count: downloadTasks.length })}
                  </p>
                  <button
                    onClick={handleClearCompleted}
                    className="px-3 py-1 text-sm rounded transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-solid)', borderColor: 'var(--color-border)' }}
                  >
                    {t('download.clearCompleted')}
                  </button>
                </div>
                {downloadTasks.map(task => (
                  <DownloadItem
                    key={task.id}
                    filename={task.filename}
                    downloaded={task.downloaded_size}
                    total={task.total_size}
                    status={task.status === 'completed' ? 'completed' : task.status === 'downloading' ? 'downloading' : 'pending'}
                    onCancel={() => handleCancel(task)}
                    showCancel={task.status === 'downloading'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="h-full min-h-0 flex flex-col">
            {installedVersions.length === 0 ? (
              <EmptyState
                icon="default"
                title={t('download.noInstalled')}
                description={t('download.noInstalledDesc')}
              />
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-custom">
                {installedVersions.map(version => (
                  <div
                    key={version}
                    className="p-4 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: 'var(--color-surface-solid)', borderColor: 'var(--color-success)', borderWidth: '1px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                        <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">{version}</p>
                        <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm">{t('version.installed')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLaunch(version)}
                      className="px-4 py-2 text-sm rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-primary)' }}
                    >
                      {t('common.launch')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border flex items-center justify-between flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-solid)' }}>
        <p style={{ color: 'var(--color-text-tertiary)' }} className="text-xs truncate">
          {t('download.downloadDir')}: <span className="font-mono">{downloadPath}</span>
        </p>
        {downloadPath && (
          <button
            onClick={handleOpenDownloadFolder}
            className="text-xs transition-colors flex items-center gap-1 flex-shrink-0 ml-4"
            style={{ color: 'var(--color-text-secondary)' }}
            title={t('download.openFolder')}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {t('common.open')}
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(DownloadGame);