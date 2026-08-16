import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** UI 布局模式：灵动岛 / 经典 */
export enum UIMode {
  /** 灵动岛模式（悬浮式胶囊导航） */
  ISLAND,
  /** 经典模式（侧边栏导航） */
  CLASSIC
}

/**
 * ## AnimationConfig — 动画控制配置
 *
 * 提供全局动画开关，由 `useAnimation()` hook 统一消费。
 */
export interface AnimationConfig {
  /** 全局动画总开关 */
  enabled: boolean;
}

/**
 * UI 模式 Store 的内部接口
 */
interface UIModeState {
  /** 当前 UI 布局模式 */
  mode: UIMode;
  /** 动画控制配置 */
  animation: AnimationConfig;
  /** 设置指定的 UI 模式 */
  setMode: (mode: UIMode) => void;
  /** 在 ISLAND 和 CLASSIC 之间切换 */
  toggleMode: () => void;
  /** 部分更新动画配置 */
  setAnimation: (animation: Partial<AnimationConfig>) => void;
}

/**
 * ## useUIModeStore — UI 模式与动画状态
 *
 * 持久化到 localStorage（key: `ui-mode-storage`）。
 * 支持灵动岛/经典布局切换，以及分维度动画控制。
 *
 * @example
 * ```tsx
 * const { animation, setAnimation } = useUIModeStore();
 * setAnimation({ enabled: false });
 * ```
 */
export const useUIModeStore = create<UIModeState>()(
  persist(
    (set, get) => ({
      mode: UIMode.ISLAND,
      animation: {
        enabled: true,
      },

      setMode: (mode) => {
        set({ mode });
      },

      toggleMode: () => {
        const { mode } = get();
        set({ mode: mode === UIMode.ISLAND ? UIMode.CLASSIC : UIMode.ISLAND });
      },

      setAnimation: (animation) => {
        const current = get().animation;
        set({ animation: { ...current, ...animation } });
      },
    }),
    {
      name: 'ui-mode-storage',
    }
  )
);
