import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LastVisitedState {
  map: Record<string, string>;
  setLastVisited: (parentPath: string, childPath: string) => void;
  getLastVisited: (parentPath: string) => string | undefined;
}

export const useLastVisitedStore = create<LastVisitedState>()(
  persist(
    (set, get) => ({
      map: {},
      setLastVisited: (parentPath: string, childPath: string) =>
        set((state) => ({
          map: { ...state.map, [parentPath]: childPath },
        })),
      getLastVisited: (parentPath: string) => get().map[parentPath],
    }),
    {
      name: 'last-visited-storage',
      partialize: (state) => ({ map: state.map }),
    }
  )
);
