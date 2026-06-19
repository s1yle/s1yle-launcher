import { SystemFont } from "@/api";
import { getFont, getSystemFonts } from "@/helper/rustInvoke";
import { createOptions, OptionValueType } from "@/utils/createOptions";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const fontScaleConfig = createOptions(
  [
    { value: 0.875, label: '较小 (87.5%)' },
    { value: 1, label: '标准 (100%)' },
    { value: 1.125, label: '稍大 (112.5%)' },
    { value: 1.25, label: '大 (125%)' },
    { value: 1.5, label: '超大 (150%)' },
  ] as const,
  1 // 默认值
);

/**
 * 字体大小缩放级别
 * 用于支持无障碍访问，允许用户自定义字体大小
 */
export type FontScale = OptionValueType<typeof fontScaleConfig>;

const DEFAULT_FONT_SCALE: FontScale = 1;

const FONT_SCALES: FontScale[] = [0.875, 1, 1.125, 1.25, 1.5];


export interface FontStoreProps {
  fonts: SystemFont[] | null;
  font: SystemFont | null;
}

export interface FontStoreState extends FontStoreProps {
  init: () => void;

  setFont: (font: SystemFont) => void;

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

/**
 * 字体管理 Store
 * 
 * 功能:
 * - 支持设置字体
 * - 支持用户自定义字体大小缩放
 * - 持久化存储用户偏好
 * - 提供便捷的增减方法
 * - 与 CSS 变量系统联动
 * 
 * 使用场景:
 * - 设置页面提供 font-family 选择选项
 * - 设置页面提供字体大小调节选项
 * - 支持无障碍访问（最大 200% 缩放）
 * - 记忆用户偏好设置
 */
const useFontStore = create<FontStoreState>()(
  persist(
    (set, get) => ({
      init: () => {
        getSystemFonts().then((fonts) => {
          set({ fonts: fonts.sort((a, b) => a.name.localeCompare((b.name))) });
        });
        let self = get();
        if (!self.font) {
          getFont().then((font) => {
            set({ font: font.CURRENT })
          });
        }
      },
      fonts: null,
      font: null,

      // 暂不知道还有没有更完善的设置字体的方式
      // 也许以后会继续完善这个功能,不过现在就先这样吧～～
      setFont: (font: SystemFont) => {
        set({ font: font });
        if (typeof document !== 'undefined') {
          if (font) {
            document.documentElement.style.fontFamily =
              `"${font.name}", ui-sans-serif, system-ui, sans-serif`;
          } else {
            document.documentElement.style.fontFamily = '';
          }
        }
      },

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
      name: 'font-storage',
      onRehydrateStorage: () => (state) => {
        // 重新 hydrate 时更新 HTML 属性
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-font-scale', state.fontScale.toString());
        }
      },
      partialize: (state) => ({
        font: state.font,
      }),
    }
  )
)

export default useFontStore;

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
