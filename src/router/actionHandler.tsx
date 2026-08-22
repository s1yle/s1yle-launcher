// src/router/actionHandler.tsx
import { open, confirm } from '@tauri-apps/plugin-dialog';
import i18n from '@/helper/i18n';
import { useGameStore } from "@/stores/gameStore";
import { addGameFolder, setGameRoot, removeGameFolder } from '@/helper/rustInvoke';
import { notify } from '@/components/common/NotificationProvider';
import { prompt } from '@/components/common/popup/InputDialogProvider';
import { getErrorMessage } from '@/utils/errorUtils';

/** 刷新游戏列表 */
export const handleRefreshGames = async () => {
    const refresh = useGameStore.getState().refresh;
    await refresh();
};

/** 添加游戏文件夹：选择目录后在应用内命名（不可重名），保存到 wecraft.json 列表（不切换当前根目录） */
export const handleAddGameFolder = async () => {
    const t = i18n.t.bind(i18n);
    try {
        const selected = await open({
            directory: true,
            multiple: false,
            title: t('games.selectFolder', '选择游戏目录'),
        });
        if (!selected || typeof selected !== 'string') return;

        const existingNames = useGameStore
            .getState()
            .gameFolders.map((f) => f.name.toLowerCase());

        const defaultName = selected.split(/[\\/]/).filter(Boolean).pop() ?? selected;
        const name = await prompt({
            title: t('games.nameGameFolder', '命名游戏文件夹'),
            message: t('games.nameGameFolderDesc', '为该文件夹设置一个显示名称（侧边栏展示，不可重复）'),
            initialValue: defaultName,
            validate: (value) => {
                const v = value.trim();
                if (!v) return t('games.folderNameEmpty', '名称不能为空');
                if (existingNames.includes(v.toLowerCase())) {
                    return t('games.folderNameDuplicate', '名称已存在: {{name}}', { name: v });
                }
                return null;
            },
        });
        // 用户取消
        if (name === null) return;

        const list = await addGameFolder(selected, name);
        useGameStore.getState().setGameFolders(list);
        notify.success(t('games.addGameFolderSuccess', '已添加游戏文件夹'), name);

    } catch (e) {
        notify.error(t('games.addGameFolderFailed', '添加失败'), getErrorMessage(e));
    }
};

/** 选择（切换）游戏文件夹：调用 set_game_root 切换到对应根目录并刷新 */
export const handleSelectGameFolder = async (path: string) => {
    const t = i18n.t.bind(i18n);
    try {
        await setGameRoot(path);
        await useGameStore.getState().refresh();

    } catch (e) {
        notify.error(t('games.switchGameFolderFailed', '切换失败'), getErrorMessage(e));
    }
};

/** 移除游戏文件夹：仅从列表移除记录，不删除实际文件 */
export const handleRemoveGameFolder = async (path: string) => {
    const t = i18n.t.bind(i18n);
    try {
        const name =
            useGameStore.getState().gameFolders.find((f) => f.path === path)?.name ?? path;
        const confirmed = await confirm(
            t('games.confirmRemoveFolderDesc', '确定要移除文件夹 "{{name}}" 吗？此操作仅从列表中移除记录，不会删除实际文件。', { name }),
            { title: t('games.removeGameFolder', '移除游戏文件夹'), kind: 'warning' },
        );
        if (!confirmed) return;

        const list = await removeGameFolder(path);
        useGameStore.getState().setGameFolders(list);
        notify.success(t('games.removeFolderSuccess', '已移除游戏文件夹'), name);

    } catch (e) {
        notify.error(t('games.removeFolderFailed', '移除失败'), getErrorMessage(e));
    }
};
