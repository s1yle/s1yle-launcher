import { useState, useCallback } from 'react';
import { useDownload, formatFileSize, formatDate, getVersionTypeLabel, getVersionTypeColor } from '../hooks/useDownload';
import { GameVersion, DownloadTask } from '../helper/rustInvoke';

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
    downloadVersion,
    cancelTask,
    clearCompleted,
  } = useDownload();

  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingVersions, setDownloadingVersions] = useState<Set<string>>(new Set());
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({});

  const filteredVersions = useCallback(() => {
    if (!manifest) return [];
    let versions = manifest.versions;

    if (filter !== 'all') {
      versions = versions.filter(v => v.type_ === filter);
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

  const isDownloading = useCallback((versionId: string) => {
    return downloadingVersions.has(versionId);
  }, [downloadingVersions]);

  const handleDownload = async (version: GameVersion) => {
    setDownloadingVersions(prev => new Set(prev).add(version.id));
    setDownloadErrors(prev => ({ ...prev, [version.id]: '' }));

    try {
      await downloadVersion(version);
    } catch (e) {
      setDownloadErrors(prev => ({
        ...prev,
        [version.id]: e instanceof Error ? e.message : '下载失败'
      }));
    } finally {
      setDownloadingVersions(prev => {
        const next = new Set(prev);
        next.delete(version.id);
        return next;
      });
    }
  };

  const handleCancel = async (task: DownloadTask) => {
    try {
      await cancelTask(task.id);
    } catch (e) {
      console.error('取消失败:', e);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
    } catch (e) {
      console.error('清理失败:', e);
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
      {/* 标题区域 */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">游戏下载</h1>
        <p className="text-gray-400 text-sm">下载并管理 Minecraft 游戏版本</p>
      </div>

      {/* 标签页切换 */}
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

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 浏览版本 */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {/* 搜索和筛选 */}
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

            {/* 最新版本提示 */}
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

            {/* 版本列表 */}
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
                    downloading={isDownloading(version.id)}
                    error={downloadErrors[version.id]}
                    onDownload={() => handleDownload(version)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 下载中 */}
        {activeTab === 'downloading' && (
          <div className="space-y-4">
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
                    <DownloadTaskCard
                      key={task.id}
                      task={task}
                      onCancel={() => handleCancel(task)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 已安装 */}
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
                        <span className="text-green-400 text-lg">✓</span>
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

      {/* 下载目录 */}
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
  onDownload: () => void;
}

const VersionCard: React.FC<VersionCardProps> = ({
  version,
  installed,
  downloading,
  error,
  onDownload,
}) => {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <span className="text-indigo-400 text-xl">🎮</span>
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
        <div>
          {installed ? (
            <button className="px-4 py-2 bg-green-600/50 text-white text-sm rounded-lg cursor-not-allowed">
              已安装
            </button>
          ) : downloading ? (
            <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg">
              下载中...
            </button>
          ) : error ? (
            <div className="text-right">
              <p className="text-red-400 text-xs mb-1">{error}</p>
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          ) : (
            <button
              onClick={onDownload}
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

interface DownloadTaskCardProps {
  task: DownloadTask;
  onCancel: () => void;
}

const DownloadTaskCard: React.FC<DownloadTaskCardProps> = ({ task, onCancel }) => {
  const progress = task.total_size > 0
    ? (task.downloaded_size / task.total_size) * 100
    : 0;

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            task.status === 'completed' ? 'bg-green-500/20' : 'bg-blue-500/20'
          }`}>
            <span className={task.status === 'completed' ? 'text-green-400' : 'text-blue-400'}>
              {task.status === 'completed' ? '✓' : '↓'}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{task.filename}</p>
            <p className="text-gray-500 text-sm">
              {formatFileSize(task.downloaded_size)} / {formatFileSize(task.total_size)}
            </p>
          </div>
        </div>
        {task.status === 'downloading' ? (
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
          >
            取消
          </button>
        ) : (
          <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-sm rounded border border-green-500/30">
            完成
          </span>
        )}
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-2 text-right">{progress.toFixed(1)}%</p>
    </div>
  );
};

export default DownloadGame;
