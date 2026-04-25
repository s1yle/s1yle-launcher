import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, X } from 'lucide-react';
import { useInstanceStore } from '../../stores/instanceStore';
import { openFolder } from '../../helper/rustInvoke';
import { InstanceListItem, EmptyState, useNotification, IconButton } from '../../components/common';
import Instance from './Instance';

const InstanceList: React.FC = () => {
  const { t } = useTranslation();
  const selectedFolderId = useInstanceStore(s => s.selectedFolderId);
  const knownFolders = useInstanceStore(s => s.knownFolders);
  const selectedInstanceId = useInstanceStore(s => s.selectedInstanceId);
  const {
    instances,
    loading,
    error,
    instancesPath,
    searchQuery,
    init,
    refresh,
    remove,
    duplicate,
    setSearchQuery,
    setSelectedInstance,
    getFilteredInstances,
  } = useInstanceStore();

  const { success, error: notifyError } = useNotification();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filteredInstances = getFilteredInstances();
  console.log("[filteredInstances] 扫描并过滤后的实力列表：", filteredInstances);

  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDuplicateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const handleSelect = (id: string) => {
    setSelectedInstance(id);
  };


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

  const handleOpenFolder = async (path: string) => {
    try {
      await openFolder(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('notification.error');
      notifyError(t('instances.openFolderFailed', '打开目录失败'), msg);
    }
  };



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
          icon="folder"
          title={searchQuery ? t('instances.noMatch', '未找到匹配的实例') : t('instances.noInstances', '暂无实例')}
          description={searchQuery ? t('instances.adjustSearch', '尝试调整搜索关键词') : t('instances.noInstancesDesc', '下载或创建新实例来开始游戏')}
        />
      );
    }

    return (
      <div className="h-full overflow-y-auto">
        {filteredInstances.map((instance) => (
          <InstanceListItem
            key={instance.id}
            instance={instance}
            selected={instance.id === selectedInstanceId}
            onSelect={() => handleSelect(instance.id)}
            onLaunch={() => { }}
            onRename={() => { }}
            onDuplicate={() => handleDuplicate(instance.id)}
            onDelete={() => handleDelete(instance.id, instance.name)}
            onOpenFolder={() => handleOpenFolder(instance.path)}
          />
        ))}
      </div>
    );
  };



  return (
    <div className="flex flex-col h-full">

      <Instance
        knownFolders={knownFolders}
        selectedFolderId={selectedFolderId}
        refresh={refresh}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredInstances={filteredInstances}
        instances={instances}
        error={error}
        renderContent={renderContent}
        instancesPath={instancesPath}
        showDuplicateModal = {showDuplicateModal}
        duplicateName = {duplicateName}
        setDuplicateName = {setDuplicateName}
        handleConfirmDuplicate = {handleConfirmDuplicate}
        setShowDuplicateModal = {setShowDuplicateModal}
        setDuplicateTargetId = {setDuplicateTargetId}
      />

    </div>
  );
};

export default InstanceList;
