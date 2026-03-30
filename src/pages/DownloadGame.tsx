import { useState, useCallback } from 'react';
import { useDownload, formatDate, getVersionTypeLabel, getVersionTypeColor } from '../hooks/useDownload';
import { GameVersion } from '../helper/rustInvoke';
import { ProgressBar, DownloadItem, useNotification } from '../components/common';

type TabType = 'browse' | 'downloading' | 'installed';
type FilterType = 'all' | 'release' | 'snapshot' | 'old';

const DownloadGame: React.FC = () => {
  const {
    manifest,
    installedVersions,
    downloadTasks,
    downloadPath,
    loading,
    error,
    downloadQueue,
    isDownloading,
    downloadVersion,
    cancelTask,
    clearCompleted,
    loadInstalledVersions,
    deployVersion,
  } = useDownload();

  const { success, error: notifyError, info } = useNotification();

  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingVersions, setDownloadingVersions] = useState<Set<string>>(new Set());
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({});
  
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [deployProgress, setDeployProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  const filteredVersions = useCallback(() => {
    if (!manifest) return [];
    let versions = manifest.versions;

    if (filter !== 'all') {
      if (filter === 'old') {
        versions = versions.filter(v => v.type_ === 'old_beta' || v.type_ === 'old_alpha');
      } else {
        versions = versions.filter(v => v.type_ === filter);
      }
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

  const isInstalled = useCallback((versionId: string) => {
    return installedVersions.includes(versionId);
  }, [installedVersions]);

  const isDownloadingVersion = useCallback((versionId: string) => {
    return downloadingVersions.has(versionId);
  }, [downloadingVersions]);

  const handleDownload = async (version: GameVersion) => {
    setDownloadingVersions(prev => new Set(prev).add(version.id));
    setDownloadErrors(prev => ({ ...prev, [version.id]: '' }));

    try {
      info('开始下载', `正在下载 ${version.id}...`);
      await downloadVersion(version);
      success('下载完成', `${version.id} 下载成功`);
      setSelectedVersion(version.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '下载失败';
      setDownloadErrors(prev => ({
        ...prev,
        [version.id]: msg
      }));
      notifyError('下载失败', msg);
    } finally {
      setDownloadingVersions(prev => {
        const next = new Set(prev);
        next.delete(version.id);
        return next;
      });
    }
  };

  const handleDeploy = async (versionId: string) => {
    setIsDeploying(true);
    setDeployProgress(0);
    
    try {
      setDeployProgress(30);
      info('开始部署', `正在部署 ${versionId}...`);
      
      setDeployProgress(70);
      await deployVersion(versionId);
      
      setDeployProgress(100);
      success('部署完成', `${versionId} 部署成功`);
      await loadInstalledVersions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '部署失败';
      notifyError('部署失败', msg);
    } finally {
      setIsDeploying(false);
      setDeployProgress(0);
    }
  };

  const handleCancel = async (task: { id: string }) => {
    try {
      await cancelTask(task.id);
    } catch (e) {
      notifyError('取消失败', '无法取消下载任务');
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
    } catch (e) {
      notifyError('清理失败', '无法清理已完成任务');
    }
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'browse', label: '浏览版本' },
    { id: 'downloading', label: '下载中', count: downloadTasks.filter(t => t.status === 'downloading').length },
    { id: 'installed', label: '已安装', count: installedVersions.length },
  ];

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'release', label: '正式版' },
    { id: 'snapshot', label: '快照版' },
    { id: 'old', label: '旧版' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">游戏下载</h1>
        <p className="text-gray-400 text-sm">下载并管理 Minecraft 游戏版本</p>
      </div>

      <div className="flex gap-1 px-6 pt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索版本..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                {filters.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      filter === f.id
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {manifest?.latest && (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-indigo-300 text-sm">
                  最新正式版: <span className="font-mono font-bold">{manifest.latest.release}</span>
                  {manifest.latest.snapshot !== manifest.latest.release && (
                    <> | 最新快照: <span className="font-mono font-bold">{manifest.latest.snapshot}</span></>
                  )}
                </p>
              </div>
            )}

            {loading && !manifest ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-gray-400">加载中...</span>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredVersions().slice(0, 50).map(version => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    installed={isInstalled(version.id)}
                    downloading={isDownloadingVersion(version.id)}
                    error={downloadErrors[version.id]}
                    selected={selectedVersion === version.id}
                    onSelect={() => setSelectedVersion(version.id)}
                    onDownload={() => handleDownload(version)}
                    onDeploy={() => handleDeploy(version.id)}
                    isDeploying={isDeploying && selectedVersion === version.id}
                    deployProgress={deployProgress}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloading' && (
          <div className="space-y-4">
            {downloadQueue.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    下载队列: {downloadQueue.filter(d => d.status === 'completed').length} / {downloadQueue.length}
                  </p>
                  {isDownloading && (
                    <span className="text-blue-400 text-sm">下载中...</span>
                  )}
                </div>
                <ProgressBar
                  progress={(downloadQueue.filter(d => d.status === 'completed').length / downloadQueue.length) * 100}
                  status={isDownloading ? 'active' : 'completed'}
                  label="总体进度"
                  size="md"
                />
                <div className="grid gap-3">
                  {downloadQueue.map(item => (
                    <DownloadItem
                      key={item.id}
                      filename={item.filename}
                      downloaded={item.downloaded}
                      total={item.total}
                      status={item.status}
                      error={item.error}
                      onRetry={() => {}}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                {downloadTasks.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500">暂无下载任务</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-400 text-sm">
                        共 {downloadTasks.length} 个任务
                      </p>
                      <button
                        onClick={handleClearCompleted}
                        className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                      >
                        清理已完成
                      </button>
                    </div>
                    <div className="grid gap-3">
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
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="space-y-4">
            {installedVersions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">暂无已安装版本</p>
                <p className="text-gray-600 text-sm mt-2">从上方下载游戏版本</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {installedVersions.map(version => (
                  <div
                    key={version}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-green-400 text-lg">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{version}</p>
                        <p className="text-gray-500 text-sm">已安装</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
                      启动
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/10 bg-black/20">
        <p className="text-gray-500 text-xs">
          下载目录: <span className="font-mono">{downloadPath}</span>
        </p>
      </div>
    </div>
  );
};

interface VersionCardProps {
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
            <span className="text-indigo-400 text-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{version.id}</h3>
              <span className={`px-2 py-0.5 text-xs rounded border ${getVersionTypeColor(version.type_)}`}>
                {getVersionTypeLabel(version.type_)}
              </span>
              {installed && (
                <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  已安装
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              发布于 {formatDate(version.release_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installed ? (
            <div className="text-right">
              {isDeploying ? (
                <div className="w-32">
                  <ProgressBar
                    progress={deployProgress}
                    status="active"
                    showPercentage
                    size="sm"
                  />
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
            <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg">
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

export default DownloadGame;
