import { useGameStore } from './gameStore';
import { useDownloadStore } from './downloadStore';

/**
 * 统一刷新协议（Single Source of Truth）
 *
 * 游戏列表 + 已安装版本 + 下载任务三份状态一次对齐。
 * 页面挂载 / 部署完成事件 / 徽标点击三条路径统一走此入口，
 * 避免"某个页面记得才刷新"导致的状态漂移。
 */
export const refreshAll = async (): Promise<void> => {
  await Promise.allSettled([
    useGameStore.getState().refresh(),
    useDownloadStore.getState().loadInstalledVersions(),
    useDownloadStore.getState().loadDownloadTasks(),
  ]);
};
