import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** UI 布局模式：灵动岛 / 经典 */
export enum UIMode {
  ISLAND,
  CLASSIC
}

/**
 * ## AnimationConfig — 动画控制配置
 *
 * 提供分维度动画开关，支持按类型独立控制。
 * 由 `useAnimation()` hook 统一消费，默认全部开启。
 *
 * @property enabled - 全局动画总开关
 * @property sidebarEnabled - 侧边栏滑入/滑出动画
 * @property microEnabled - 微交互（hover/tap 缩放）
 */
export interface AnimationConfig {
  enabled: boolean;
  sidebarEnabled: boolean;
  microEnabled: boolean;
  loadingVariant: 'spinner' | 'progress' | 'skeleton' | 'topbar';
  spinnerStyle: 'ring' | 'dots' | 'pulse' | 'bars';
  skeletonStyle: 'shimmer' | 'pulse' | 'static';
  globalTopbar: boolean;
  minDurationMs: number;
  timeoutSec: number;
}

interface UIModeState {
  mode: UIMode;
  animation: AnimationConfig;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
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
        sidebarEnabled: true,
        microEnabled: true,
        loadingVariant: 'spinner',
        spinnerStyle: 'ring',
        skeletonStyle: 'shimmer',
        globalTopbar: true,
        minDurationMs: 300,
        timeoutSec: 30,
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
