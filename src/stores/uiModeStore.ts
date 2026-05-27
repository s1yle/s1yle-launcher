import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum UIMode {
  ISLAND,
  CLASSIC
}

// TODO: 支持更细粒度的动画状态控制
export interface AnimationConfig {
  enabled: boolean;
}

interface UIModeState {
  mode: UIMode;
  animation: AnimationConfig;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  setAnimation: (animation: AnimationConfig) => void;
}

/**
 * ## 用于设置灵动岛、经典模式、动画状态(enabled)
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

      // 灵动岛 / 经典模式切换
      toggleMode: () => {
        const { mode } = get();
        set({ mode: mode === UIMode.ISLAND ? UIMode.CLASSIC : UIMode.ISLAND });
      },

      setAnimation: (animation) => {
        set({ animation });
      },
    }),
    {
      name: 'ui-mode-storage',
    }
  )
);
