import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIMode = 'island' | 'classic';
export type PageAnimationDirection = 'slide-up' | 'slide-down';

export interface AnimationConfig {
  enabled: boolean;
  direction: PageAnimationDirection;
}

interface UIModeState {
  mode: UIMode;
  animation: AnimationConfig;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  setAnimation: (animation: AnimationConfig) => void;
}

export const useUIModeStore = create<UIModeState>()(
  persist(
    (set, get) => ({
      mode: 'island',
      animation: {
        enabled: true,
        direction: 'slide-up',
      },

      setMode: (mode) => {
        set({ mode });
      },

      // 灵动岛 / 经典模式切换
      toggleMode: () => {
        const { mode } = get();
        set({ mode: mode === 'island' ? 'classic' : 'island' });
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
