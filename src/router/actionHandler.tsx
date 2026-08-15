// src/router/config.tsx
import { useGameStore } from "@/stores/gameStore";

/** 刷新游戏列表 */
export const handleRefreshGames = async () => {
    const refresh = useGameStore.getState().refresh;
    await refresh();
};
