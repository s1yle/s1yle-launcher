import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUIModeStore } from './uiModeStore';

/**
 * ## AccessibilityState — 无障碍辅助模式
 *
 * 提供面向特殊人群的视觉辅助开关：
 * - **光敏模式**：纯黑背景 + 无动画 + 高对比度文本，降低闪烁/亮度刺激
 * - **高对比度模式**：独立于系统反转，提供额外高对比度样式
 */
interface AccessibilityState {
  /** 光敏模式（纯黑 + 无动画 + 高对比文本） */
  photosensitive: boolean;
  /** 高对比度模式（独立于系统反转） */
  highContrast: boolean;
  /** 设置光敏模式 */
  setPhotosensitive: (v: boolean) => void;
  /** 设置高对比度模式 */
  setHighContrast: (v: boolean) => void;
  /** 初始化：将已保存的模式应用到 DOM */
  init: () => void;
}

const applyToDom = (photosensitive: boolean, highContrast: boolean) => {
  const root = document.documentElement;
  root.classList.toggle('a11y-photosensitive', photosensitive);
  root.classList.toggle('a11y-high-contrast', highContrast);

  // 光敏模式强制关闭全局动画，避免闪烁刺激
  useUIModeStore.getState().setAnimation({ enabled: !photosensitive });
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      photosensitive: false,
      highContrast: false,

      setPhotosensitive: (v) => {
        set({ photosensitive: v });
        applyToDom(v, get().highContrast);
      },

      setHighContrast: (v) => {
        set({ highContrast: v });
        applyToDom(get().photosensitive, v);
      },

      init: () => {
        applyToDom(get().photosensitive, get().highContrast);
      },
    }),
    {
      name: 'accessibility-storage',
    }
  )
);
