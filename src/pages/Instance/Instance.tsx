import { GameInstance, KnownPath } from "@/helper/rustInvoke";
import { t } from "i18next";
import { Search, X } from "lucide-react";
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


    return (
        <>
            <div className="flex-1 overflow-hidden">
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