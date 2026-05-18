import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIMode = 'island' | 'classic';

interface UIModeState {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
}

export const useUIModeStore = create<UIModeState>()(
  persist(
    (set, get) => ({
      mode: 'island',

      setMode: (mode) => {
        set({ mode });
      },

      toggleMode: () => {
        const { mode } = get();
        set({ mode: mode === 'island' ? 'classic' : 'island' });
      },
    }),
    {
      name: 'ui-mode-storage',
    }
  )
);
