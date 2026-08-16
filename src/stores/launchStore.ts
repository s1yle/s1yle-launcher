import { create } from 'zustand';
import type { Game } from '@/api';

/** 启动覆盖层内容：会话 ID + 游戏详情 */
export interface LaunchOverlayState {
  gameId: string;
  game: Game;
}

interface LaunchState {
  /** 当前展示的启动覆盖层（null 表示未展示） */
  overlay: LaunchOverlayState | null;
  /** 打开启动覆盖层 */
  openOverlay: (overlay: LaunchOverlayState) => void;
  /** 关闭启动覆盖层 */
  closeOverlay: () => void;
}

/**
 * 启动覆盖层 Store。
 *
 * 将启动会话从 Home/RunningGamesCard 的局部 state 提升为全局状态，
 * 使启动按钮、运行中卡片与覆盖层渲染解耦（不再通过 props 层层传递）。
 */
export const useLaunchStore = create<LaunchState>((set) => ({
  overlay: null,
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: null }),
}));
