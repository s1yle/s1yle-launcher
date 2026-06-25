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

/**
 * 背景配置 Store 的内部接口
 */
interface BackgroundState {
  /** 当前背景配置 */
  config: BackgroundConfig
  /** 部分更新背景配置（合并到现有配置） */
  setBackground: (partial: Partial<BackgroundConfig>) => void
  /** 重置为默认背景配置 */
  resetBackground: () => void
}

/**
 * 背景配置 Store
 *
 * 管理应用背景的类型、透明度、模糊度、遮罩颜色等配置。
 * 用户偏好持久化存储到 localStorage。
 */
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
