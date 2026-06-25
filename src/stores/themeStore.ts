import { create } from 'zustand';
import { persist } from 'zustand/middleware';

//TODO: 实现自定义主题功能，支持外部注入

/** 强调色枚举，定义所有可用的主题强调色 */
export enum AccentColor {
  /** 靛蓝色 */
  INDIGO,
  /** 蓝色 */
  BLUE,
  /** 绿色 */
  GREEN,
  /** 紫色 */
  PURPLE,
  /** 红色 */
  RED,
  /** 橙色 */
  ORANGE,
  /** 粉色 */
  PINK,
  /** GitHub 风格蓝 */
  GITHUB,
  /** One Dark Pro 风格 */
  ONEDARK,
  /** Nord 极光风格 */
  NORD,
}

/** 强调色 CSS 变量映射 */
export interface AccentMapProps {
  /** 主色变量 */
  primary: string;
  /** Hover 状态色变量 */
  hover: string;
  /** Active 状态色变量 */
  active: string;
  /** 背景色变量 */
  bg: string;
  /** 5% 透明度色变量 */
  '5': string;
  /** 10% 透明度色变量 */
  '10': string;
  /** 15% 透明度色变量 */
  '15': string;
  /** 20% 透明度色变量 */
  '20': string;
}

const createAccentMap = (colorName: string): AccentMapProps => ({
  primary: `var(--accent-${colorName})`,
  hover: `var(--accent-${colorName}-hover)`,
  active: `var(--accent-${colorName}-active)`,
  bg: `var(--accent-${colorName}-bg)`,
  '5': `var(--accent-${colorName}-5)`,
  '10': `var(--accent-${colorName}-10)`,
  '15': `var(--accent-${colorName}-15)`,
  '20': `var(--accent-${colorName}-20)`,
})

const accentMap: Record<AccentColor, AccentMapProps> = {
  [AccentColor.INDIGO]: createAccentMap('indigo'),
  [AccentColor.BLUE]: createAccentMap('blue'),
  [AccentColor.GREEN]: createAccentMap('green'),
  [AccentColor.ORANGE]: createAccentMap('orange'),
  [AccentColor.PINK]: createAccentMap('pink'),
  [AccentColor.RED]: createAccentMap('red'),
  [AccentColor.PURPLE]: createAccentMap('purple'),
  [AccentColor.GITHUB]: createAccentMap('github'),
  [AccentColor.ONEDARK]: createAccentMap('onedark'),
  [AccentColor.NORD]: createAccentMap('nord'),
};

/** 主题预设定义 */
export interface ThemePreset {
  /** 预设唯一标识 */
  id: string;
  /** 名称 */
  name: string;
  /** 名称的国际化 key */
  nameI18nKey: string;
  /** 描述 */
  description: string;
  /** 描述的国际化 key */
  descriptionI18nKey: string;
  /** 关联的强调色 */
  accentColor: AccentColor;
  /** 预览颜色配置 */
  previewColors: { bg: string; surface: string; accent: string; text: string };
}

/** 内置主题预设列表（深蓝、青灰、GitHub Midnight、One Dark Pro、Nord Polar） */
export const themePresets: ThemePreset[] = [
  {
    id: 'dark-blue',
    name: '深蓝',
    nameI18nKey: 'theme.preset.dark',
    description: '深色背景，Indigo 强调色',
    descriptionI18nKey: 'theme.preset.darkDesc',
    accentColor: AccentColor.BLUE,
    previewColors: { bg: '#2c577e', surface: 'rgba(255,255,255,0.05)', accent: '#6366f1', text: '#1d3a54' },
  },
  {
    id: 'light-grey',
    name: '青灰',
    nameI18nKey: 'theme.preset.light',
    description: '明亮背景，Indigo 强调色',
    descriptionI18nKey: 'theme.preset.lightDesc',
    accentColor: AccentColor.INDIGO,
    previewColors: { bg: '#aebfd1', surface: 'rgba(0,0,0,0.03)', accent: '#6366f1', text: '#1a1a1a' },
  },
  // 新增3套现代极简终端主题
  {
    id: 'github',
    name: 'GitHub Midnight',
    nameI18nKey: 'theme.preset.github',
    description: 'GitHub深夜风格，专业干净的开发者配色',
    descriptionI18nKey: 'theme.preset.githubDesc',
    accentColor: AccentColor.GITHUB,
    previewColors: { bg: '#0d1117', surface: '#161b22', accent: '#58a6ff', text: '#c9d1d9' },
  },
  {
    id: 'onedark',
    name: 'One Dark Pro',
    nameI18nKey: 'theme.preset.onedark',
    description: '经典IDE风格，温暖舒适的编程配色',
    descriptionI18nKey: 'theme.preset.onedarkDesc',
    accentColor: AccentColor.ONEDARK,
    previewColors: { bg: '#282c34', surface: '#21252b', accent: '#61afef', text: '#abb2bf' },
  },
  {
    id: 'nord',
    name: 'Nord Polar',
    nameI18nKey: 'theme.preset.nord',
    description: '北极光极简风，冷色调高级感配色',
    descriptionI18nKey: 'theme.preset.nordDesc',
    accentColor: AccentColor.NORD,
    previewColors: { bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0', text: '#eceff4' },
  },
];

/**
 * 主题配置
 */
interface ThemeConfig {
  /** 当前强调色 */
  accentColor: AccentColor;
  /** 当前活跃的主题预设 */
  activeTheme: ThemePreset;
}

/**
 * 主题 Store 的内部接口
 */
interface ThemeState extends ThemeConfig {
  /** 设置强调色并应用到 DOM */
  setAccentColor: (color: AccentColor) => void;
  /** 应用主题预设（包含强调色和主题类名） */
  applyPreset: (preset: ThemePreset) => void;
  /** 初始化将已保存的主题应用到 DOM */
  init: () => void;
}

/**
 * 主题 Store
 *
 * 功能:
 * - 管理强调色（AccentColor 枚举）
 * - 管理主题预设（themePresets）
 * - 持久化到 localStorage
 * - 自动将主题应用到 DOM（CSS 变量 + class）
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      accentColor: AccentColor.INDIGO,
      activeTheme: themePresets[0],
      setAccentColor: async (accentColor: AccentColor) => {
        set({ accentColor });
        applyToDom(get().activeTheme.id, accentColor);
      },

      applyPreset: async (preset: ThemePreset) => {
        const configState: ThemeConfig = {
          accentColor: preset.accentColor,
          activeTheme: preset,
        };
        set(configState);
        applyToDom(preset.id, preset.accentColor);
      },

      init: async () => {
        const { activeTheme, accentColor } = get();
        applyToDom(activeTheme.id, accentColor);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        accentColor: state.accentColor,
        activeTheme: state.activeTheme,
      }),
    }
  )
);

function applyToDom(theme: string, accentColor: AccentColor) {
  const root = document.documentElement;

  // 移除先前主题
  themePresets.forEach((preset) => {
    root.classList.remove('theme-' + preset.id);
  })

  // 应用基础主题
  root.classList.add(`theme-${theme}`);

  // 应用选中主题
  const colors = accentMap[accentColor];
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.hover);
  root.style.setProperty('--color-primary-active', colors.active);
  root.style.setProperty('--color-primary-bg', colors.bg);
  root.style.setProperty('--color-primary-5', colors['5']);
  root.style.setProperty('--color-primary-10', colors['10']);
  root.style.setProperty('--color-primary-15', colors['15']);
  root.style.setProperty('--color-primary-20', colors['20']);
}
