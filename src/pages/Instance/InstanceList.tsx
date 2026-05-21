import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, X } from 'lucide-react';
import { useInstanceStore } from '../../stores/instanceStore';
import { openFolder } from '../../helper/rustInvoke';
import { InstanceListItem, EmptyState, useNotification, IconButton } from '../../components/common';
import Instance from './Instance';
import BottomBar from '@/components/common/BottomBar/BottomBar';
import { logger } from '@/helper/logger';
import { staggerContainer, staggerItem } from '../../utils/animations';

const InstanceList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const selectedFolder = knownFolders.find(f => f.id === selectedFolderId);
  const currentPath = selectedFolder?.path || instancesPath;

  const filteredInstances = getFilteredInstances();
  console.log("[filteredInstances] 扫描并过滤后的实力列表：", filteredInstances);

  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  useEffect(() => {
    const unlisten = listen('deploy-complete', async (event) => {
      if ((event.payload as any).status === 'success') {
        logger.info('下载完成，刷新实例列表');
        await refresh();
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [refresh]);

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
    logger.info("选中的 Game Folder ID 为：", selectedFolderId);
  }, [init]);

  const handleSelect = (id: string) => {
    setSelectedInstance(id);
    navigate('/');
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
    if (loading) {
      console.log('[renderContent] 加载中...', { loading, instances: instances.length });
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="mt-3 text-text-tertiary">{t('instances.scanning', '正在扫描实例...')}</span>
        </div>
      );
    }

    if (filteredInstances.length === 0) {
      console.log('[renderContent] 没有实例', { 
        filteredInstances: filteredInstances.length,
        instances: instances.length,
        searchQuery,
      });
      return (
        <EmptyState
          icon="folder"
          title={searchQuery ? t('instances.noMatch', '未找到匹配的实例') : t('instances.noInstances', '暂无实例')}
          description={searchQuery ? t('instances.adjustSearch', '尝试调整搜索关键词') : t('instances.noInstancesDesc', '下载或创建新实例来开始游戏')}
        />
      );
    }

    console.log('[renderContent] 渲染实例列表', { count: filteredInstances.length });

    return (
      <motion.div 
        className="h-full overflow-y-auto scrollbar-hide-x space-y-2"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AnimatePresence mode="popLayout">
          {filteredInstances.map((instance, index) => (
            <motion.div
              key={instance.id}
              variants={staggerItem}
              layout
            >
              <InstanceListItem
                instance={instance}
                selected={instance.id === selectedInstanceId}
                onSelect={() => handleSelect(instance.id)}
                onRename={() => {}}
                onDelete={() => handleDelete(instance.id, instance.name)}
                onOpenFolder={() => handleOpenFolder(instance.path)}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
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
        showDuplicateModal={showDuplicateModal}
        duplicateName={duplicateName}
        setDuplicateName={setDuplicateName}
        handleConfirmDuplicate={handleConfirmDuplicate}
        setShowDuplicateModal={setShowDuplicateModal}
        setDuplicateTargetId={setDuplicateTargetId}
      />

      <BottomBar
        dir='instances.instanceDir'
        cmdOpen='common.open'
        path={currentPath}
      />
    </div>
  );
};

export default InstanceList;
