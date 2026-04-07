import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, LayoutGrid, List, Search, X } from 'lucide-react';
import { useInstanceStore } from '../stores/instanceStore';
import { openFolder } from '../helper/rustInvoke';
import { InstanceCard, EmptyState, useNotification, IconButton } from '../components/common';

const InstanceList: React.FC = () => {
  const { t } = useTranslation();
  const selectedFolderId = useInstanceStore(s => s.selectedFolderId);
  const knownFolders = useInstanceStore(s => s.knownFolders);
  const {
    instances,
    loading,
    error,
    instancesPath,
    viewMode,
    searchQuery,
    refresh,
    remove,
    rename,
    duplicate,
    setSearchQuery,
    setViewMode,
    getFilteredInstances,
  } = useInstanceStore();

  const { success, error: notifyError, info } = useNotification();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filteredInstances = getFilteredInstances();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('instances.confirmDelete', '确定要删除实例 "{{name}}" 吗？', { name }))) return;
    try {
      await remove(id);
      success(t('notification.instanceDeleted'), t('instances.deleteSuccess', '实例 "{{name}}" 已删除', { name }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.deleteFailed', '删除失败'), msg);
    }
  };

  const handleRename = async (id: string) => {
    const instance = instances.find((i) => i.id === id);
    if (!editingName.trim() || editingName === instance?.name) {
      setEditingId(null);
      return;
    }
    try {
      await rename(id, editingName);
      success(t('instances.renameSuccess', '重命名成功'), t('instances.renameSuccessMsg', '实例已更名为 "{{name}}"', { name: editingName }));
      setEditingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.renameFailed', '重命名失败'), msg);
    }
  };

  const handleLaunch = (_id: string) => {
    info(t('instances.launching', '启动'), t('instances.launchingMsg', '正在启动实例...'));
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.openFolderFailed', '打开目录失败'), msg);
    }
  };

  const handleDuplicate = (id: string) => {
    const instance = instances.find((i) => i.id === id);
    if (instance) {
      setDuplicateTargetId(id);
      setDuplicateName(`${instance.name} - ${t('instances.copy', '副本')}`);
      setShowDuplicateModal(true);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTargetId || !duplicateName.trim()) return;
    try {
      await duplicate(duplicateTargetId, duplicateName);
      success(t('instances.duplicateSuccess', '复制成功'), t('instances.duplicateSuccessMsg', '实例已复制为 "{{name}}"', { name: duplicateName }));
      setShowDuplicateModal(false);
      setDuplicateTargetId(null);
      setDuplicateName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.duplicateFailed', '复制失败'), msg);
    }
  };

  const handleExport = (_id: string) => {
    info(t('instances.export', '导出'), t('instances.exportNotReady', '导出整合包功能尚未集成'));
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

  const renderContent = () => {
    if (loading && instances.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="mt-3 text-text-tertiary">{t('instances.scanning', '正在扫描实例...')}</span>
        </div>
      );
    }

    if (filteredInstances.length === 0) {
      return (
        <EmptyState
          icon={searchQuery ? 'search' : 'folder'}
          title={searchQuery ? t('instances.noMatch', '未找到匹配的实例') : t('instances.noInstances', '暂无实例')}
          description={searchQuery ? t('instances.adjustSearch', '尝试调整搜索关键词') : t('instances.noInstancesDesc', '下载或创建新实例来开始游戏')}
        />
      );
    }

    if (viewMode === 'grid') {
      return (
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
                  onSelect={() => {}}
                  onLaunch={() => handleLaunch(instance.id)}
                  onRename={() => { setEditingId(instance.id); setEditingName(instance.name); }}
                  onDuplicate={() => handleDuplicate(instance.id)}
                  onDelete={() => handleDelete(instance.id, instance.name)}
                  onOpenFolder={() => handleOpenFolder(instance.path)}
                  onOpenConfigFolder={() => handleOpenFolder(instance.path)}
                  onExport={() => handleExport(instance.id)}
                  showPath
                  viewMode="grid"
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center px-4 py-3 bg-surface border-b border-border text-text-tertiary text-sm font-medium">
          <div className="w-10 mr-3"></div>
          <div className="flex-1">{t('instances.instanceName', '实例名称')}</div>
          <div className="w-24 mx-4">{t('instances.gameVersion', '游戏版本')}</div>
          <div className="w-28 mx-4">{t('instances.modLoader', '模组加载器')}</div>
          <div className="w-24 mx-4">{t('instances.lastPlayed', '最后运行')}</div>
          <div className="w-20 text-center">{t('instances.actions', '操作')}</div>
        </div>
        {filteredInstances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            onSelect={() => {}}
            onLaunch={() => handleLaunch(instance.id)}
            onRename={() => { setEditingId(instance.id); setEditingName(instance.name); }}
            onDuplicate={() => handleDuplicate(instance.id)}
            onDelete={() => handleDelete(instance.id, instance.name)}
            onOpenFolder={() => handleOpenFolder(instance.path)}
            onOpenConfigFolder={() => handleOpenFolder(instance.path)}
            onExport={() => handleExport(instance.id)}
            viewMode="list"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t('instances.title', '实例列表')}</h1>
            <p className="text-text-tertiary text-sm">{t('instances.subtitle', '查看和管理所有 Minecraft 游戏实例')}</p>
            {(() => {
              const folder = knownFolders.find(f => f.id === selectedFolderId);
              return folder ? (
                <p className="text-text-tertiary text-xs mt-1 font-mono truncate max-w-md" title={folder.path}>
                  {folder.name} u2192 {folder.path}
                </p>
              ) : null;
            })()}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
                title={t('instances.gridView', '网格视图')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
                title={t('instances.listView', '列表视图')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <IconButton
              onClick={() => refresh()}
              icon={Loader2}
              label={t('instances.refresh', '刷新')}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('instances.searchPlaceholder', '搜索实例 (支持名称、版本、加载器)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-text-tertiary text-sm whitespace-nowrap">
            {filteredInstances.length} / {instances.length} {t('instances.count', '个实例')}
          </span>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-error-bg border border-error rounded-lg">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>

      <div className="px-6 py-3 border-t border-border bg-surface">
        <div className="flex items-center justify-between">
          <p className="text-text-tertiary text-xs">
            {t('instances.instanceDir', '实例目录')}: <span className="font-mono">{instancesPath}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span>{t('instances.doubleClickLaunch', '双击启动')}</span>
            <span>{t('instances.rightClickMenu', '右键菜单')}</span>
            <span>ESC {t('instances.cancel', '取消')}</span>
          </div>
        </div>
      </div>

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
          <div className="bg-context-bg border border-border-hover rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">{t('instances.duplicateInstance', '复制实例')}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm mb-1 block">{t('instances.newInstanceName', '新实例名称')}</label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder={t('instances.enterNewName', '输入新实例名称...')}
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
                {t('common.cancel', '取消')}
              </button>
              <button
                onClick={handleConfirmDuplicate}
                disabled={!duplicateName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-lg transition-colors disabled:opacity-50"
              >
                {t('common.duplicate', '复制')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceList;
