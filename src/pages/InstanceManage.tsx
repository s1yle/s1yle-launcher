import { useState } from 'react';
import { useInstances } from '../hooks/useInstances';
import { ModLoaderType, openFolder } from '../helper/rustInvoke';
import { InstanceCard, EmptyState, useNotification } from '../components/common';

const InstanceManage: React.FC = () => {
  const {
    instances,
    selectedInstance,
    loading,
    error,
    instancesPath,
    selectInstance,
    createNewInstance,
    removeInstance,
    renameInstanceById,
  } = useInstances();

  const { success, error: notifyError, info } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceVersion, setNewInstanceVersion] = useState('1.20.4');
  const [newInstanceLoader, setNewInstanceLoader] = useState<ModLoaderType>(ModLoaderType.Vanilla);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filteredInstances = instances.filter((instance) =>
    instance.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newInstanceName.trim()) {
      notifyError('创建失败', '请输入实例名称');
      return;
    }

    setIsCreating(true);
    try {
      await createNewInstance(
        newInstanceName,
        newInstanceVersion,
        newInstanceLoader
      );
      success('创建成功', `实例 "${newInstanceName}" 已创建`);
      setShowCreateModal(false);
      setNewInstanceName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '创建失败';
      notifyError('创建失败', msg);
    } finally {
      setIsCreating(false);
    }
  };

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
    if (!editingName.trim() || editingName === selectedInstance?.name) {
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

  const handleLaunch = (_id: string) => {
    info('启动', '启动功能尚未集成');
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '打开目录失败';
      notifyError('打开目录失败', msg);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">实例管理</h1>
            <p className="text-gray-400 text-sm">创建、编辑和管理 Minecraft 游戏实例</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建实例
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索实例..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-gray-400 text-sm">
            共 {instances.length} 个实例
          </span>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {loading && instances.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-400">加载中...</span>
          </div>
        ) : filteredInstances.length === 0 ? (
          <EmptyState
            icon="folder"
            title="暂无实例"
            description="创建一个新实例来开始游戏"
            action={{
              label: '创建实例',
              onClick: () => setShowCreateModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInstances.map((instance) => (
              <div key={instance.id} className="relative">
                {editingId === instance.id ? (
                  <div className="p-4 bg-white/10 border border-indigo-500/50 rounded-lg">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(instance.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(instance.id)}
                      autoFocus
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none"
                    />
                  </div>
                ) : (
                  <InstanceCard
                    instance={instance}
                    selected={selectedInstance?.id === instance.id}
                    onSelect={() => selectInstance(instance.id)}
                    onLaunch={() => handleLaunch(instance.id)}
                    onDelete={() => handleDelete(instance.id, instance.name)}
                    onOpenFolder={() => handleOpenFolder(instance.path)}
                    showPath
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/10 bg-black/20">
        <p className="text-gray-500 text-xs">
          实例目录: <span className="font-mono">{instancesPath}</span>
        </p>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">创建新实例</h2>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">实例名称</label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="例如：生存服务器"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">游戏版本</label>
                <select
                  value={newInstanceVersion}
                  onChange={(e) => setNewInstanceVersion(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.20.1">1.20.1</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="1.19.2">1.19.2</option>
                  <option value="1.18.2">1.18.2</option>
                  <option value="1.16.5">1.16.5</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">模组加载器</label>
                <select
                  value={newInstanceLoader}
                  onChange={(e) => setNewInstanceLoader(e.target.value as ModLoaderType)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={ModLoaderType.Vanilla}>Vanilla (纯净版)</option>
                  <option value={ModLoaderType.Fabric}>Fabric</option>
                  <option value={ModLoaderType.Forge}>Forge</option>
                  <option value={ModLoaderType.NeoForge}>NeoForge</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newInstanceName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceManage;