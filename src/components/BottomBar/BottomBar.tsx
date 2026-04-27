import { openFolder } from "@/helper/rustInvoke";
import { FolderOpen } from "lucide-react";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../common";

interface BottomBarProps {
    dir: string;
    cmdOpen: string;
    title?: string;
    path: string;
    handleOpenDownloadFolder?: () => void;
}


const BottomBar: React.FC<BottomBarProps> = ({
    dir = "目录",
    cmdOpen = "打开",
    title = "打开目录",
    path = "未知路径",
    handleOpenDownloadFolder,
}) => {
    const { t } = useTranslation();
    const { error: notifyError } = useNotification();

    const openDownloadFolder = useCallback(async () => {
        if (!path) return;
        try {
            await openFolder(path);
        } catch (e) {
            (t('notification.error'), e instanceof Error ? e.message : t('notification.error'));
        }
    }, [path, notifyError, t]);

    return (
        <>
            {/* 底部栏 */}
            <div
                className="px-4 py-2 border-t border-border flex items-center justify-between flex-shrink-0"
                style={{ backgroundColor: 'var(--color-surface-solid)' }}
            >
                <p style={{ color: 'var(--color-text-tertiary)' }} className="text-xs truncate">
                    {t(dir)}: <span className="font-mono">{path}</span>
                </p>
                {path && (
                    <button
                        onClick={handleOpenDownloadFolder ? handleOpenDownloadFolder : openDownloadFolder}
                        className="text-xs transition-colors flex items-center gap-1 flex-shrink-0 ml-4"
                        style={{ color: 'var(--color-text-secondary)' }}
                        title={t(title)}
                    >
                        <FolderOpen className="w-3.5 h-3.5" />
                        {t(cmdOpen)}
                    </button>
                )}
            </div>
        </>
    )
}

export default BottomBar;