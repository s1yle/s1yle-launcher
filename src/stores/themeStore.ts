import { create } from 'zustand';
import { persist } from 'zustand/middleware';

//TODO: 实现自定义主题功能，支持外部注入

export enum AccentColor {
  INDIGO,
  BLUE,
  GREEN,
  PURPLE,
  RED,
  ORANGE,
  PINK,
  GITHUB,
  ONEDARK,
  NORD,
}

export interface AccentMapProps {
  primary: string;
  hover: string;
  active: string;
  bg: string;
  '5': string;
  '10': string;
  '15': string;
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

export interface ThemePreset {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  accentColor: AccentColor;
  previewColors: { bg: string; surface: string; accent: string; text: string };
}

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

interface ThemeConfig {
  accentColor: AccentColor;
  activeTheme: ThemePreset;
}

interface ThemeState extends ThemeConfig {
  setAccentColor: (color: AccentColor) => void;
  applyPreset: (preset: ThemePreset) => void;
  init: () => void;
}

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
