import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AvatarMode = 'flat' | 'isometric';

interface AvatarState {
  mode: AvatarMode;
  setMode: (mode: AvatarMode) => void;
  toggleMode: () => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      mode: 'flat',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'flat' ? 'isometric' : 'flat' }),
    }),
    { name: 'wecraft:avatar' }
  )
);
