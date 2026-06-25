import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 子路由记忆 Store 的内部接口
 *
 * 用于记住用户在父级页面下最后一次访问的子路由，实现导航记忆功能。
 */
interface LastVisitedState {
  /** 父路径 → 子路径的映射表 */
  map: Record<string, string>;
  /** 记录某个父路径的最后访问子路径 */
  setLastVisited: (parentPath: string, childPath: string) => void;
  /** 获取某个父路径的最后访问子路径 */
  getLastVisited: (parentPath: string) => string | undefined;
}

/**
 * 子路由记忆 Store
 *
 * 记住每个父路由下最后访问的子路由，在返回时自动恢复。
 * 持久化存储到 localStorage。
 */
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
