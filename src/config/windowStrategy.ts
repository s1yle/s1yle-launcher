import { Window } from "@tauri-apps/api/window";

/** 窗口行为策略 */
export interface WindowStrategy {
  /** 是否需要保存位置 */
  shouldSave: boolean;
  /** 保存前的额外校验 */
  validateBeforeSave?: (win: Window) => Promise<boolean>;
}

/** 窗口策略配置表（当前仅主窗口） */
export const WINDOW_STRATEGIES: Record<string, WindowStrategy> = {
  main: {
    shouldSave: true,
    validateBeforeSave: async (win) => {
      const isMinimized = await win.isMinimized();
      const pos = await win.outerPosition();
      return !isMinimized && pos.x >= -10000 && pos.y >= -10000;
    },
  },
};

/** 获取当前窗口的策略 */
export const getWindowStrategy = (label: string): WindowStrategy => {
  return WINDOW_STRATEGIES[label] ?? { shouldSave: false };
};