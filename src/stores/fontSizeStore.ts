import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 字体大小缩放级别
 * 用于支持无障碍访问，允许用户自定义字体大小
 */
export type FontScale = 
  | 0.875  // 较小 (87.5%)
  | 1      // 标准 (100%)
  | 1.125  // 稍大 (112.5%)
  | 1.25   // 大 (125%)
  | 1.5;   // 超大 (150%)

export interface FontSizeState {
  /** 当前字体缩放比例 */
  fontScale: FontScale;
  
  /** 设置字体缩放比例 */
  setFontScale: (scale: FontScale) => void;
  
  /** 重置为默认字体大小 */
  resetFontScale: () => void;
  
  /** 增加字体大小 */
  increaseFontSize: () => void;
  
  /** 减小字体大小 */
  decreaseFontSize: () => void;
  
  /** 获取当前缩放比例的百分比表示 */
  getScalePercentage: () => number;
}

const DEFAULT_FONT_SCALE: FontScale = 1;

const FONT_SCALES: FontScale[] = [0.875, 1, 1.125, 1.25, 1.5];

/**
 * 字体大小管理 Store
 * 
 * 功能:
 * - 支持用户自定义字体大小缩放
 * - 持久化存储用户偏好
 * - 提供便捷的增减方法
 * - 与 CSS 变量系统联动
 * 
 * 使用场景:
 * - 设置页面提供字体大小调节选项
 * - 支持无障碍访问（最大 200% 缩放）
 * - 记忆用户偏好设置
 */
export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontScale: DEFAULT_FONT_SCALE,
      
      setFontScale: (scale: FontScale) => {
        set({ fontScale: scale });
        // 更新 HTML 的 data 属性，触发 CSS 变量更新
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-font-scale', scale.toString());
        }
      },
      
      resetFontScale: () => {
        get().setFontScale(DEFAULT_FONT_SCALE);
      },
      
      increaseFontSize: () => {
        const { fontScale } = get();
        const currentIndex = FONT_SCALES.indexOf(fontScale);
        if (currentIndex < FONT_SCALES.length - 1) {
          get().setFontScale(FONT_SCALES[currentIndex + 1]);
        }
      },
      
      decreaseFontSize: () => {
        const { fontScale } = get();
        const currentIndex = FONT_SCALES.indexOf(fontScale);
        if (currentIndex > 0) {
          get().setFontScale(FONT_SCALES[currentIndex - 1]);
        }
      },
      
      getScalePercentage: () => {
        return get().fontScale * 100;
      },
    }),
    {
      name: 'font-size-preferences',
      onRehydrateStorage: () => (state) => {
        // 重新 hydrate 时更新 HTML 属性
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-font-scale', state.fontScale.toString());
        }
      },
    }
  )
);

/**
 * 获取当前字体缩放比例的显示文本
 */
export const getFontScaleLabel = (scale: FontScale): string => {
  return `${Math.round(scale * 100)}%`;
};

/**
 * 检查是否可以使用更小的字体
 */
export const canDecreaseFontSize = (scale: FontScale): boolean => {
  return FONT_SCALES.indexOf(scale) > 0;
};

/**
 * 检查是否可以使用更大的字体
 */
export const canIncreaseFontSize = (scale: FontScale): boolean => {
  return FONT_SCALES.indexOf(scale) < FONT_SCALES.length - 1;
};
