// src/router/config.tsx
import { useGameStore } from "@/stores/gameStore";

/** 刷新实例列表 */
export const handleRefreshInstances = async () => {
    const refresh = useGameStore.getState().refresh;
    await refresh();
};
