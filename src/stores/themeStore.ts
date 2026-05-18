import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '@/config';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
export type TerminalTheme = 'github' | 'onedark' | 'nord';

export interface ThemePreset {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  mode: ThemeMode;
  accentColor: AccentColor;
  terminalTheme?: TerminalTheme; // 新增：终端主题
  previewColors: { bg: string; surface: string; accent: string; text: string };
}

export const themePresets: ThemePreset[] = [
  {
    id: 'dark',
    name: '暗夜',
    nameI18nKey: 'theme.preset.dark',
    description: '深色背景，Indigo 强调色',
    descriptionI18nKey: 'theme.preset.darkDesc',
    mode: 'dark',
    accentColor: 'indigo',
    previewColors: { bg: '#1a1a1a', surface: 'rgba(255,255,255,0.05)', accent: '#6366f1', text: '#ffffff' },
  },
  {
    id: 'light',
    name: '晨曦',
    nameI18nKey: 'theme.preset.light',
    description: '明亮背景，Indigo 强调色',
    descriptionI18nKey: 'theme.preset.lightDesc',
    mode: 'light',
    accentColor: 'indigo',
    previewColors: { bg: '#f5f5f5', surface: 'rgba(0,0,0,0.03)', accent: '#6366f1', text: '#1a1a1a' },
  },
  // 新增3套现代极简终端主题
  {
    id: 'github',
    name: 'GitHub Midnight',
    nameI18nKey: 'theme.preset.github',
    description: 'GitHub深夜风格，专业干净的开发者配色',
    descriptionI18nKey: 'theme.preset.githubDesc',
    mode: 'dark',
    accentColor: 'indigo',
    terminalTheme: 'github',
    previewColors: { bg: '#0d1117', surface: '#161b22', accent: '#58a6ff', text: '#c9d1d9' },
  },
  {
    id: 'onedark',
    name: 'One Dark Pro',
    nameI18nKey: 'theme.preset.onedark',
    description: '经典IDE风格，温暖舒适的编程配色',
    descriptionI18nKey: 'theme.preset.onedarkDesc',
    mode: 'dark',
    accentColor: 'indigo',
    terminalTheme: 'onedark',
    previewColors: { bg: '#282c34', surface: '#21252b', accent: '#61afef', text: '#abb2bf' },
  },
  {
    id: 'nord',
    name: 'Nord Polar',
    nameI18nKey: 'theme.preset.nord',
    description: '北极光极简风，冷色调高级感配色',
    descriptionI18nKey: 'theme.preset.nordDesc',
    mode: 'dark',
    accentColor: 'indigo',
    terminalTheme: 'nord',
    previewColors: { bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0', text: '#eceff4' },
  },
];

export const accentColors: Record<AccentColor, { name: string; nameI18nKey: string; hex: string }> = {
  indigo: { name: '靛蓝', nameI18nKey: 'theme.accent.indigo', hex: '#6366f1' },
  blue: { name: '蓝色', nameI18nKey: 'theme.accent.blue', hex: '#3b82f6' },
  green: { name: '绿色', nameI18nKey: 'theme.accent.green', hex: '#22c55e' },
  purple: { name: '紫色', nameI18nKey: 'theme.accent.purple', hex: '#a855f7' },
  red: { name: '红色', nameI18nKey: 'theme.accent.red', hex: '#ef4444' },
  orange: { name: '橙色', nameI18nKey: 'theme.accent.orange', hex: '#f97316' },
  pink: { name: '粉色', nameI18nKey: 'theme.accent.pink', hex: '#ec4899' },
};

const accentMap: Record<AccentColor, { 
  primary: string; 
  hover: string; 
  active: string; 
  bg: string;
  '5': string;
  '10': string;
  '15': string;
  '20': string;
}> = {
  indigo: { 
    primary: 'var(--accent-indigo)', 
    hover: 'var(--accent-indigo-hover)', 
    active: 'var(--accent-indigo-active)', 
    bg: 'var(--accent-indigo-bg)',
    '5': 'var(--accent-indigo-5)',
    '10': 'var(--accent-indigo-10)',
    '15': 'var(--accent-indigo-15)',
    '20': 'var(--accent-indigo-20)',
  },
  blue: { 
    primary: 'var(--accent-blue)', 
    hover: 'var(--accent-blue-hover)', 
    active: 'var(--accent-blue-active)', 
    bg: 'var(--accent-blue-bg)',
    '5': 'var(--accent-blue-5)',
    '10': 'var(--accent-blue-10)',
    '15': 'var(--accent-blue-15)',
    '20': 'var(--accent-blue-20)',
  },
  green: { 
    primary: 'var(--accent-green)', 
    hover: 'var(--accent-green-hover)', 
    active: 'var(--accent-green-active)', 
    bg: 'var(--accent-green-bg)',
    '5': 'var(--accent-green-5)',
    '10': 'var(--accent-green-10)',
    '15': 'var(--accent-green-15)',
    '20': 'var(--accent-green-20)',
  },
  purple: { 
    primary: 'var(--accent-purple)', 
    hover: 'var(--accent-purple-hover)', 
    active: 'var(--accent-purple-active)', 
    bg: 'var(--accent-purple-bg)',
    '5': 'var(--accent-purple-5)',
    '10': 'var(--accent-purple-10)',
    '15': 'var(--accent-purple-15)',
    '20': 'var(--accent-purple-20)',
  },
  red: { 
    primary: 'var(--accent-red)', 
    hover: 'var(--accent-red-hover)', 
    active: 'var(--accent-red-active)', 
    bg: 'var(--accent-red-bg)',
    '5': 'var(--accent-red-5)',
    '10': 'var(--accent-red-10)',
    '15': 'var(--accent-red-15)',
    '20': 'var(--accent-red-20)',
  },
  orange: { 
    primary: 'var(--accent-orange)', 
    hover: 'var(--accent-orange-hover)', 
    active: 'var(--accent-orange-active)', 
    bg: 'var(--accent-orange-bg)',
    '5': 'var(--accent-orange-5)',
    '10': 'var(--accent-orange-10)',
    '15': 'var(--accent-orange-15)',
    '20': 'var(--accent-orange-20)',
  },
  pink: { 
    primary: 'var(--accent-pink)', 
    hover: 'var(--accent-pink-hover)', 
    active: 'var(--accent-pink-active)', 
    bg: 'var(--accent-pink-bg)',
    '5': 'var(--accent-pink-5)',
    '10': 'var(--accent-pink-10)',
    '15': 'var(--accent-pink-15)',
    '20': 'var(--accent-pink-20)',
  },
};

interface ThemeConfig {
  mode: ThemeMode;
  accentColor: AccentColor;
  activeTheme: 'dark' | 'light';
  terminalTheme?: TerminalTheme; // 新增：当前激活的终端主题
}

interface ThemeState extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  applyPreset: (preset: ThemePreset) => void;
  setTerminalTheme: (theme: TerminalTheme | undefined) => void; // 新增：设置终端主题
  init: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      accentColor: 'indigo',
      activeTheme: 'dark',
      terminalTheme: undefined, // 新增

      setMode: async (mode: ThemeMode) => {
        const actualTheme = mode === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : mode;
        set({ mode, activeTheme: actualTheme });
        applyToDom(actualTheme, get().accentColor, get().terminalTheme);

        await config.setConfigValue('preferences.theme', mode);
        await config.setConfigValue('preferences.accent_color', get().accentColor);
        if (get().terminalTheme) {
          await config.setConfigValue('preferences.terminal_theme', get().terminalTheme);
        }
      },

      setAccentColor: async (accentColor: AccentColor) => {
        set({ accentColor });
        applyToDom(get().activeTheme, accentColor, get().terminalTheme);

        await config.setConfigValue('preferences.accent_color', accentColor);
      },

      applyPreset: async (preset: ThemePreset) => {
        const actualTheme = preset.mode === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : preset.mode;
        const configState: ThemeConfig = {
          mode: preset.mode,
          accentColor: preset.accentColor,
          activeTheme: actualTheme,
          terminalTheme: preset.terminalTheme,
        };
        set(configState);
        applyToDom(actualTheme, preset.accentColor, preset.terminalTheme);

        await config.setConfigValue('preferences.theme', preset.mode);
        await config.setConfigValue('preferences.accent_color', preset.accentColor);
        if (preset.terminalTheme) {
          await config.setConfigValue('preferences.terminal_theme', preset.terminalTheme);
        }
      },

      // 新增：设置终端主题
      setTerminalTheme: async (terminalTheme: TerminalTheme | undefined) => {
        set({ terminalTheme });
        applyToDom(get().activeTheme, get().accentColor, terminalTheme);

        if (terminalTheme) {
          await config.setConfigValue('preferences.terminal_theme', terminalTheme);
        } else {
          await config.setConfigValue('preferences.terminal_theme', null);
        }
      },

      init: async () => {
        const { activeTheme, accentColor, terminalTheme } = get();
        applyToDom(activeTheme, accentColor, terminalTheme);

        await config.whenReady();
        const configTheme = config.getConfigValue('preferences.theme');
        const configAccent = config.getConfigValue('preferences.accent_color');
        const configTerminal = config.getConfigValue('preferences.terminal_theme') as TerminalTheme | undefined;

        if (configTheme && configAccent) {
          const actualTheme = configTheme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : configTheme;
          set({ mode: configTheme, accentColor: configAccent, activeTheme: actualTheme, terminalTheme: configTerminal });
          applyToDom(actualTheme, configAccent, configTerminal);
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const { mode } = get();
          if (mode === 'system') {
            const theme = e.matches ? 'dark' : 'light';
            set({ activeTheme: theme });
            applyToDom(theme, get().accentColor, get().terminalTheme);
          }
        });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        mode: state.mode,
        accentColor: state.accentColor,
        activeTheme: state.activeTheme,
        terminalTheme: state.terminalTheme, // 新增持久化
      }),
    }
  )
);

function applyToDom(theme: 'dark' | 'light', accentColor: AccentColor, terminalTheme?: TerminalTheme) {
  const root = document.documentElement;

  // 移除所有主题类
  root.classList.remove('theme-dark', 'theme-light', 'theme-github', 'theme-onedark', 'theme-nord');

  // 应用基础主题
  root.classList.add(`theme-${theme}`);

  // 如果有终端主题，应用（现代极简风格，无CRT/扫描线/噪点）
  if (terminalTheme) {
    root.classList.add(`theme-${terminalTheme}`);
  }

  // 如果不是终端主题，应用标准强调色
  if (!terminalTheme) {
    const colors = accentMap[accentColor];
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.hover);
    root.style.setProperty('--color-primary-active', colors.active);
    root.style.setProperty('--color-primary-bg', colors.bg);
    root.style.setProperty('--color-primary-5', colors['5']);
    root.style.setProperty('--color-primary-10', colors['10']);
    root.style.setProperty('--color-primary-15', colors['15']);
    root.style.setProperty('--color-primary-20', colors['20']);
  } else {
    // 终端主题的primary颜色由CSS文件中的变量定义，不需要额外设置
    // 但需要清除可能存在的内联样式
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-primary-hover');
    root.style.removeProperty('--color-primary-active');
    root.style.removeProperty('--color-primary-bg');
    root.style.removeProperty('--color-primary-5');
    root.style.removeProperty('--color-primary-10');
    root.style.removeProperty('--color-primary-15');
    root.style.removeProperty('--color-primary-20');
  }
}
