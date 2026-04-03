import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useInstances } from '../hooks/useInstances';
import { openFolder } from '../helper/rustInvoke';
import { InstanceCard, EmptyState, useNotification } from '../components/common';

type ViewMode = 'grid' | 'list';

const InstanceList: React.FC = () => {
  const {
    instances,
    selectedInstance,
    loading,
    error,
    instancesPath,
    selectInstance,
    removeInstance,
    renameInstanceById,
    duplicateInstance,
    refresh,
  } = useInstances();

  const { success, error: notifyError, info } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredInstances = instances.filter((instance) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      instance.name.toLowerCase().includes(query) ||
      instance.version.toLowerCase().includes(query) ||
      instance.loader_type.toString().toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除实例 "${name}" 吗？`)) return;
    try {
      await removeInstance(id, false);
      success('删除成功', `实例 "${name}" 已删除`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      notifyError('删除失败', msg);
    }
  };

  const handleRename = async (id: string) => {
    const instance = instances.find((i) => i.id === id);
    if (!editingName.trim() || editingName === instance?.name) {
      setEditingId(null);
      return;
    }
    try {
      await renameInstanceById(id, editingName);
      success('重命名成功', `实例已更名为 "${editingName}"`);
      setEditingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '重命名失败';
      notifyError('重命名失败', msg);
    }
  };

  const handleLaunch = (id: string) => {
    info('启动', `正在启动实例 ${id}...`);
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '打开目录失败';
      notifyError('打开目录失败', msg);
    }
  };

  const handleOpenConfigFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '打开目录失败';
      notifyError('打开目录失败', msg);
    }
  };

  const handleDuplicate = (id: string) => {
    const instance = instances.find((i) => i.id === id);
    if (instance) {
      setDuplicateTargetId(id);
      setDuplicateName(`${instance.name} - 副本`);
      setShowDuplicateModal(true);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetId || !duplicateName.trim()) return;
    try {
      await duplicateInstance(duplicateTargetId, duplicateName);
      success('复制成功', `实例已复制为 "${duplicateName}"`);
      setShowDuplicateModal(false);
      setDuplicateTargetId(null);
      setDuplicateName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '复制失败';
      notifyError('复制失败', msg);
    }
  };

  const handleExport = (_id: string) => {
    info('导出', '导出整合包功能尚未集成');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingId(null);
        setShowDuplicateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">实例列表</h1>
            <p className="text-text-tertiary text-sm">查看和管理所有 Minecraft 游戏实例</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="网格视图"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="列表视图"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            {/* Refresh button */}
            <button
              onClick={refresh}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title="刷新"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索实例 (支持名称、版本、加载器)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="text-text-tertiary text-sm whitespace-nowrap">
            {filteredInstances.length} / {instances.length} 个实例
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-error-bg border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="mt-3 text-text-tertiary">正在扫描实例...</span>
          </div>
        ) : filteredInstances.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'search' : 'folder'}
            title={searchQuery ? '未找到匹配的实例' : '暂无实例'}
            description={searchQuery ? '尝试调整搜索关键词' : '下载或创建新实例来开始游戏'}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInstances.map((instance) => (
              <div key={instance.id} className="relative">
                {editingId === instance.id ? (
                  <div className="p-4 bg-surface border border-primary rounded-lg">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(instance.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(instance.id)}
                      autoFocus
                      className="w-full px-2 py-1 bg-surface border border-border-hover rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <InstanceCard
                    instance={instance}
                    selected={selectedInstance?.id === instance.id}
                    onSelect={() => selectInstance(instance.id)}
                    onLaunch={() => handleLaunch(instance.id)}
                    onRename={() => { setEditingId(instance.id); setEditingName(instance.name); }}
                    onDuplicate={() => handleDuplicate(instance.id)}
                    onDelete={() => handleDelete(instance.id, instance.name)}
                    onOpenFolder={() => handleOpenFolder(instance.path)}
                    onOpenConfigFolder={() => handleOpenConfigFolder(instance.path)}
                    onExport={() => handleExport(instance.id)}
                    showPath
                    viewMode="grid"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="flex items-center px-4 py-3 bg-surface border-b border-border text-text-tertiary text-sm font-medium">
              <div className="w-10 mr-3"></div>
              <div className="flex-1">实例名称</div>
              <div className="w-24 mx-4">游戏版本</div>
              <div className="w-28 mx-4">模组加载器</div>
              <div className="w-24 mx-4">最后运行</div>
              <div className="w-20 text-center">操作</div>
            </div>
            {/* Table body */}
            {filteredInstances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                selected={selectedInstance?.id === instance.id}
                onSelect={() => selectInstance(instance.id)}
                onLaunch={() => handleLaunch(instance.id)}
                onRename={() => { setEditingId(instance.id); setEditingName(instance.name); }}
                onDuplicate={() => handleDuplicate(instance.id)}
                onDelete={() => handleDelete(instance.id, instance.name)}
                onOpenFolder={() => handleOpenFolder(instance.path)}
                onOpenConfigFolder={() => handleOpenConfigFolder(instance.path)}
                onExport={() => handleExport(instance.id)}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-surface">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">
            实例目录: <span className="font-mono">{instancesPath}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>双击启动</span>
            <span>右键菜单</span>
            <span>ESC 取消</span>
          </div>
        </div>
      </div>

      {/* Duplicate modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
          <div className="bg-context-bg border border-border-hover rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">复制实例</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm mb-1 block">新实例名称</label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="输入新实例名称..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmDuplicate()}
                  className="w-full px-4 py-2 bg-surface border border-border-hover rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDuplicateModal(false); setDuplicateTargetId(null); }}
                className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDuplicate}
                disabled={!duplicateName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-lg transition-colors disabled:opacity-50"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceList;
