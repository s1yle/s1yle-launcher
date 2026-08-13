// src/router/config.tsx
import { useInstanceStore } from "@/stores/instanceStore";

/** 刷新实例列表 */
export const handleRefreshInstances = async () => {
    const refresh = useInstanceStore.getState().refresh;
    await refresh();
};
