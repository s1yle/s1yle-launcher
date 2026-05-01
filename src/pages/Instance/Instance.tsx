import { IconButton, useNotification, ConfirmPopup } from "@/components/common";
import { GameInstance, KnownPath } from "@/helper/rustInvoke";
import { useInstanceStore } from "@/stores/instanceStore";
import AddFolderDialog from "@/components/instance/AddFolderDialog";
import { t } from "i18next";
import { Loader2, RefreshCcw, Search, X, Trash2, Star, FolderPlus } from "@/icons";
import { JSX, useRef, useState } from "react";

export interface InstanceProps {
    knownFolders: KnownPath[];
    selectedFolderId: string | null;
    refresh: () => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredInstances: GameInstance[];
    instances: GameInstance[];
    error: string | null;
    renderContent: () => JSX.Element;
    instancesPath: string;
    showDuplicateModal: boolean;
    duplicateName: string;
    setDuplicateName: (name: string) => void;
    handleConfirmDuplicate: () => {};
    setShowDuplicateModal: (show: boolean) => void;
    setDuplicateTargetId: (id: string | null) => void;
}

const Instance: React.FC<InstanceProps> = ({
    knownFolders,
    selectedFolderId,
    searchQuery,
    setSearchQuery,
    filteredInstances,
    instances,
    renderContent,
    showDuplicateModal,
    duplicateName,
    setDuplicateName,
    handleConfirmDuplicate,
    setShowDuplicateModal,
    setDuplicateTargetId,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const removeKnownFolder = useInstanceStore(s => s.removeKnownFolder);
  const setDefaultFolder = useInstanceStore(s => s.setDefaultFolder);
  const { success, error: notifyError } = useNotification();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingFolderName, setDeletingFolderName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);

    const confirmDeleteFolder = (id: string, name: string) => {
        setDeletingFolderId(id);
        setDeletingFolderName(name);
        setShowDeleteConfirm(true);
    };

    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultFolder(id);
            success(t('instances.setDefaultSuccess', '设置成功'), t('instances.setDefaultSuccessMsg', '已设为默认游戏文件夹'));
        } catch (e) {
            const msg = e instanceof Error ? e.message : t('notification.error');
            notifyError(t('instances.setDefaultFailed', '设置失败'), msg);
        }
    };


    return (
        <>
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{t('instances.title', '实例列表')}</h1>
                        <p className="text-text-tertiary text-sm">{t('instances.subtitle', '选择和管理 Minecraft 游戏实例')}</p>
                        {(() => {
                            const folder = knownFolders.find(f => f.id === selectedFolderId);
                            return folder ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-text-tertiary text-xs font-mono truncate max-w-md" title={folder.path}>
                                        {folder.name} → {folder.path}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {!folder.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(folder.id)}
                                                className="p-1 text-text-tertiary hover:text-primary rounded transition-colors"
                                                title={t('instances.setAsDefault', '设为默认')}
                                            >
                                                <Star className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => confirmDeleteFolder(folder.id, folder.name)}
                                            className="p-1 text-text-tertiary hover:text-error rounded transition-colors"
                                            title={t('instances.removeGameFolder', '删除游戏文件夹')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 relative max-w-md">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('instances.searchPlaceholder', '搜索实例 (支持名称、版本)...')}
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
                    <IconButton
                        icon={FolderPlus}
                        onClick={() => setShowAddFolderDialog(true)}
                        variant="primary"
                        size="sm"
                        iconSize={16}
                        tooltip={t('instances.addFolder', '添加文件夹')}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6">
                {renderContent()}
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

            {showDeleteConfirm && (
                <ConfirmPopup
                    isOpen={showDeleteConfirm}
                    title={t('instances.confirmRemoveFolder', '删除游戏文件夹')}
                    message={t('instances.confirmRemoveFolderDesc', '确定要删除文件夹 "{{name}}" 吗？此操作仅从列表中移除记录，不会删除实际文件。', { name: deletingFolderName })}
                    confirmText={t('common.delete', '删除')}
                    cancelText={t('common.cancel', '取消')}
                    confirmType="danger"
                    showIcon
                    iconType="warning"
                    loading={isDeleting}
                    onConfirm={async () => {
                        if (!deletingFolderId) return;
                        setIsDeleting(true);
                        try {
                            await removeKnownFolder(deletingFolderId);
                            success(t('instances.folderRemoved', '文件夹已移除'), t('instances.folderRemovedMsg', '"{{name}}" 已从列表中移除', { name: deletingFolderName }));
                            setShowDeleteConfirm(false);
                            setDeletingFolderId(null);
                            setDeletingFolderName('');
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : t('notification.error');
                            notifyError(t('instances.removeFolderFailed', '删除失败'), msg);
                        } finally {
                            setIsDeleting(false);
                        }
                    }}
                    onCancel={() => {
                        setShowDeleteConfirm(false);
                        setDeletingFolderId(null);
                    }}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setDeletingFolderId(null);
                    }}
                />
            )}

            <AddFolderDialog
                isOpen={showAddFolderDialog}
                onClose={() => setShowAddFolderDialog(false)}
            />

        </>

    )

}

export default Instance;