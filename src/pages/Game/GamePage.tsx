import type { Game as GameModel } from "@/helper/rustInvoke";
import { t } from "i18next";
import { JSX } from "react";

/** 游戏列表组件的 Props */
export interface GameProps {
    refresh: () => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredGames: GameModel[];
    games: GameModel[];
    error: string | null;
    renderContent: () => JSX.Element;
    gameRoot: string;
    showDuplicateModal: boolean;
    duplicateName: string;
    setDuplicateName: (name: string) => void;
    handleConfirmDuplicate: () => {};
    setShowDuplicateModal: (show: boolean) => void;
    setDuplicateTargetId: (id: string | null) => void;
}

/** 游戏列表布局组件 - 封装搜索、筛选和复制弹窗 */
const GamePage: React.FC<GameProps> = ({
    renderContent,
    showDuplicateModal,
    duplicateName,
    setDuplicateName,
    handleConfirmDuplicate,
    setShowDuplicateModal,
    setDuplicateTargetId,
}) => {


    return (
        <>
            <div className="flex-1 overflow-hidden p-4">
                {renderContent()}
            </div>

            {showDuplicateModal && (
                <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
                    <div className="bg-context-bg border border-border-hover rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-text-primary mb-4">{t('games.duplicateGame', '复制游戏')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-text-secondary text-sm mb-1 block">{t('games.newGameName', '新游戏名称')}</label>
                                <input
                                    type="text"
                                    value={duplicateName}
                                    onChange={(e) => setDuplicateName(e.target.value)}
                                    placeholder={t('games.enterNewName', '输入新游戏名称...')}
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

export default GamePage;