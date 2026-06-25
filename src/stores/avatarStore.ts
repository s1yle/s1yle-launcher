import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 头像渲染模式：平面（flat）或等距（isometric） */
export type AvatarMode = 'flat' | 'isometric';

/**
 * 头像渲染模式 Store 的内部接口
 */
interface AvatarState {
  /** 当前头像渲染模式 */
  mode: AvatarMode;
  /** 设置指定的渲染模式 */
  setMode: (mode: AvatarMode) => void;
  /** 在 flat 和 isometric 之间切换 */
  toggleMode: () => void;
}

/**
 * 头像渲染模式 Store
 *
 * 管理皮肤头像的渲染风格，支持平面和等距两种模式。
 * 用户偏好持久化存储到 localStorage。
 */
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
