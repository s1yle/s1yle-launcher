import { Window } from "@tauri-apps/api/window";

/** 窗口行为策略 */
export interface WindowStrategy {
  /** 是否需要保存位置 */
  shouldSave: boolean;
  /** 是否固定尺寸（login 窗口固定 480x640） */
  fixedSize: { width: number; height: number } | null;
  /** 是否允许最大化 */
  allowMaximize: boolean;
  /** 保存前的额外校验 */
  validateBeforeSave?: (win: Window) => Promise<boolean>;
}

/** 窗口策略配置表 */
export const WINDOW_STRATEGIES: Record<string, WindowStrategy> = {
  main: {
    shouldSave: true,
    fixedSize: null,
    allowMaximize: true,
    validateBeforeSave: async (win) => {
      const isMinimized = await win.isMinimized();
      const pos = await win.outerPosition();
      return !isMinimized && pos.x >= -10000 && pos.y >= -10000;
    },
  },
  login: {
    shouldSave: true,
    fixedSize: { width: 480, height: 640 },
    allowMaximize: false,
  },
  // TODO: 实现loading窗口的window position save
  loading: {
    shouldSave: false,
    fixedSize: { width: 400, height: 320 },
    allowMaximize: false,
  },
};

/** 获取当前窗口的策略 */
export const getWindowStrategy = (label: string): WindowStrategy => {
  return WINDOW_STRATEGIES[label] ?? {
    shouldSave: false,
    fixedSize: null,
    allowMaximize: false,
  };
};