import { IconButton } from "@/components/common";
import { GameInstance, KnownPath } from "@/helper/rustInvoke";
import { t } from "i18next";
import { Loader2, RefreshCcw, Search, X } from "lucide-react";
import { JSX, useRef } from "react";

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
    refresh,
    searchQuery,
    setSearchQuery,
    filteredInstances,
    instances,
    error,
    renderContent,
    instancesPath,
    showDuplicateModal,
    duplicateName,
    setDuplicateName,
    handleConfirmDuplicate,
    setShowDuplicateModal,
    setDuplicateTargetId,
}) => {

    const searchInputRef = useRef<HTMLInputElement>(null);


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
                                <p className="text-text-tertiary text-xs mt-1 font-mono truncate max-w-md" title={folder.path}>
                                    {folder.name} → {folder.path}
                                </p>
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
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-error-bg border border-error rounded-lg">
                    <p className="text-error text-sm">{error}</p>
                </div>
            )}

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

        </>

    )

}

export default Instance;