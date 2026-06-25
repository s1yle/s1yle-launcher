// src/router/config.tsx
import { useInstanceStore } from "@/stores/instanceStore";
import { open } from "@tauri-apps/plugin-dialog";

/** 添加游戏目录 - 弹出系统文件选择对话框 */
export const handleAddGameFolder = async () => {
    const addKnownFolder = useInstanceStore.getState().addKnownFolder;

    const file = await open({
        multiple: false,
        directory: true,
    });
    console.log(file);

    if (file) addKnownFolder(file);

};

/** 刷新实例列表 */
export const handleRefreshInstances = async () => {
    const refresh = useInstanceStore.getState().refresh;
    await refresh();
};
