import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BackgroundConfig } from '@/config/types';

const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'none',
  opacity: 1,
  blur: 0,
  overlayColor: '#000000',
  overlayOpacity: 0,
};

interface BackgroundState {
  config: BackgroundConfig
  setBackground: (partial: Partial<BackgroundConfig>) => void
  resetBackground: () => void
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      config: { ...DEFAULT_BACKGROUND },
      setBackground: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
        })),
      resetBackground: () => set({ config: { ...DEFAULT_BACKGROUND } }),
    }),
    {
      name: 'background-storage',
      partialize: (state) => ({ config: state.config }),
    }
  )
);
