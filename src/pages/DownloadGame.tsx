import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, FolderOpen } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';
import { GameVersion, openFolder, openUrl } from '../helper/rustInvoke';
import { ProgressBar, DownloadItem, VersionListItem, VersionFilterDropdown, EmptyState, useNotification } from '../components/common';
import { useNavStore } from '../stores/navStore';
import { getWikiUrl, isAprilFoolVersion } from '../utils/modloaderCompat';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

type TabType = 'browse' | 'downloading' | 'installed';

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
  const [filter, setFilter] = useState<string>('release');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingVersions, setDownloadingVersions] = useState<Set<string>>(new Set());
  const [deployingVersions, setDeployingVersions] = useState<Set<string>>(new Set());

  const versionCounts = useMemo(() => {
    if (!manifest) return { release: 0, snapshot: 0, aprilFool: 0, old: 0 };
    const counts = { release: 0, snapshot: 0, aprilFool: 0, old: 0 };
    manifest.versions.forEach(v => {
      if (v.type_ === 'release') counts.release++;
      else if (v.type_ === 'snapshot') counts.snapshot++;
      else if (isAprilFoolVersion(v.id)) counts.aprilFool++;
      else counts.old++;
    });
    return counts;
  }, [manifest]);

  const filterOptions = useMemo(() => [
    { value: 'release', label: t('download.versionFilter.release'), count: versionCounts.release },
    { value: 'snapshot', label: t('download.versionFilter.snapshot'), count: versionCounts.snapshot },
    { value: 'aprilFool', label: t('download.versionFilter.aprilFool'), count: versionCounts.aprilFool },
    { value: 'old', label: t('download.versionFilter.old'), count: versionCounts.old },
  ], [t, versionCounts]);

  const filteredVersions = useCallback(() => {
    if (!manifest) return [];
    let versions = manifest.versions;

    if (filter === 'release') {
      versions = versions.filter(v => v.type_ === 'release');
    } else if (filter === 'snapshot') {
      versions = versions.filter(v => v.type_ === 'snapshot');
    } else if (filter === 'aprilFool') {
      versions = versions.filter(v => isAprilFoolVersion(v.id));
    } else if (filter === 'old') {
      versions = versions.filter(v => v.type_ === 'old_beta' || v.type_ === 'old_alpha');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      versions = versions.filter(v =>
        v.id.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(query)
      );
    }

    return versions;
  }, [manifest, filter, searchQuery]);

  const handleVersionClick = (version: GameVersion) => {
    navigate(`/download/game/${encodeURIComponent(version.id)}`);
    setCurrentPath(`/download/game/${encodeURIComponent(version.id)}`);
  };

  const handleWikiClick = (versionId: string) => {
    openUrl(getWikiUrl(versionId));
  };

  const handleDownload = async (version: GameVersion) => {
    if (downloadingVersions.has(version.id)) return;
    setDownloadingVersions(prev => new Set(prev).add(version.id));

    try {
      info(t('notification.downloadStarted'), `${version.id}...`);
      await downloadVersion(version);
      success(t('common.success'), `${version.id} ${t('notification.downloadCompleted')}`);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.downloadFailed'));
    } finally {
      setDownloadingVersions(prev => {
        const next = new Set(prev);
        next.delete(version.id);
        return next;
      });
    }
  };

  const handleDeploy = async (versionId: string) => {
    if (deployingVersions.has(versionId)) return;
    setDeployingVersions(prev => new Set(prev).add(versionId));

    try {
      info(t('download.deploying'), `${versionId}...`);
      await deployVersion(versionId);
      success(t('common.success'), `${versionId} ${t('notification.deployCompleted')}`);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.deployFailed'));
    } finally {
      setDeployingVersions(prev => {
        const next = new Set(prev);
        next.delete(versionId);
        return next;
      });
    }
  };

  const handleCancel = async (task: { id: string }) => {
    try {
      await cancelTask(task.id);
    } catch {
      notifyError(t('notification.error'), t('common.cancel'));
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
    } catch {
      notifyError(t('notification.error'), t('common.cancel'));
    }
  };

  const handleOpenDownloadFolder = async () => {
    if (!downloadPath) return;
    try {
      await openFolder(downloadPath);
    } catch (e) {
      notifyError(t('notification.error'), e instanceof Error ? e.message : t('notification.error'));
    }
  };

  const handleLaunch = (versionId: string) => {
    info('启动游戏', `正在启动 ${versionId}...`);
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'browse', label: t('download.browse') },
    { id: 'downloading', label: t('download.downloading'), count: downloadTasks.filter(t => t.status === 'downloading').length || categoryProgress.length },
    { id: 'installed', label: t('download.installed'), count: installedVersions.length },
  ];

  const totalProgress = categoryProgress.length > 0
    ? (categoryProgress.reduce((sum, c) => sum + c.completed, 0) / categoryProgress.reduce((sum, c) => sum + c.total, 0)) * 100
    : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-6 pb-4 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{t('download.gameTitle')}</h1>
        <p className="text-text-tertiary text-sm">{t('download.gameDesc')}</p>
      </div>

      <div className="flex gap-1 px-6 py-3 flex-shrink-0">
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

      <div className="flex-1 min-h-0 px-6 py-2 overflow-hidden">
        {activeTab === 'browse' && (
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('download.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <VersionFilterDropdown
                value={filter}
                onChange={setFilter}
                options={filterOptions}
              />
            </div>

            {manifest?.latest && (
              <div className="p-3 bg-primary-bg border border-primary/20 rounded-lg mb-4 flex-shrink-0">
                <p className="text-primary text-sm">
                  {t('download.latestRelease')}: <span className="font-mono font-bold">{manifest.latest.release}</span>
                  {manifest.latest.snapshot !== manifest.latest.release && (
                    <> | {t('download.latestSnapshot')}: <span className="font-mono font-bold">{manifest.latest.snapshot}</span></>
                  )}
                </p>
              </div>
            )}

            {loading && !manifest ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-text-tertiary">{t('common.loading')}</span>
              </div>
            ) : filteredVersions().length === 0 ? (
              <EmptyState
                icon="search"
                title={t('download.noVersion')}
                description={t('download.noVersionDesc')}
              />
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  div::-webkit-scrollbar { display: none; }
                `}</style>
                {filteredVersions().slice(0, 50).map(version => (
                  <VersionListItem
                    key={version.id}
                    version={version}
                    installed={installedVersions.includes(version.id)}
                    downloading={downloadingVersions.has(version.id)}
                    isDeploying={deployingVersions.has(version.id)}
                    onClick={() => handleVersionClick(version)}
                    onWikiClick={() => handleWikiClick(version.id)}
                    onDownload={() => handleDownload(version)}
                    onDeploy={() => handleDeploy(version.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloading' && (
          <div className="h-full min-h-0 flex flex-col">
            {categoryProgress.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex justify-between items-center">
                  <p className="text-text-tertiary text-sm">{t('download.downloadProgress')}</p>
                  {isDownloading && (
                    <button
                      onClick={() => cancelDownloadVersion()}
                      className="px-3 py-1 text-sm bg-error-bg hover:bg-red-500/30 border border-red-500/30 text-error rounded transition-colors"
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
                  <div key={cat.category} className="p-3 bg-surface border border-border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-primary text-sm font-medium">{cat.label}</span>
                      <span className="text-text-tertiary text-xs">
                        {cat.completed} / {cat.total}
                        {cat.failed > 0 && (
                          <span className="text-error ml-2">{cat.failed} {t('download.failed')}</span>
                        )}
                      </span>
                    </div>
                    <ProgressBar
                      progress={cat.total > 0 ? (cat.completed / cat.total) * 100 : 0}
                      status={cat.failed > 0 ? 'error' : cat.completed === cat.total ? 'completed' : 'active'}
                      size="sm"
                    />
                    {cat.error && (
                      <p className="text-error text-xs mt-1">{cat.error}</p>
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
              <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex justify-between items-center">
                  <p className="text-text-tertiary text-sm">
                    {t('download.totalTasks', { count: downloadTasks.length })}
                  </p>
                  <button
                    onClick={handleClearCompleted}
                    className="px-3 py-1 text-sm bg-surface hover:bg-surface-hover border border-border rounded transition-colors"
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
              <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {installedVersions.map(version => (
                  <div
                    key={version}
                    className="p-4 bg-surface border border-success/50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success-bg rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">{version}</p>
                        <p className="text-text-tertiary text-sm">{t('version.installed')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLaunch(version)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary text-sm rounded-lg transition-colors"
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

      <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between flex-shrink-0">
        <p className="text-text-tertiary text-xs truncate">
          {t('download.downloadDir')}: <span className="font-mono">{downloadPath}</span>
        </p>
        {downloadPath && (
          <button
            onClick={handleOpenDownloadFolder}
            className="text-text-secondary hover:text-primary text-xs transition-colors flex items-center gap-1 flex-shrink-0 ml-4"
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

export default DownloadGame;