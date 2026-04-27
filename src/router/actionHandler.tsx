// src/router/config.tsx
import { useInstanceStore } from "@/stores/instanceStore";
import { open } from "@tauri-apps/plugin-dialog";

// 在组件中（或创建一个小 hook）
export const handleAddGameFolder = async () => {
    const addKnownFolder = useInstanceStore.getState().addKnownFolder;

    const file = await open({
        multiple: false,
        directory: true,
    });
    console.log(file);

    if (file) addKnownFolder(file);

};
