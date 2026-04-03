import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';

export interface ThemePreset {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  mode: ThemeMode;
  accentColor: AccentColor;
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

const accentMap: Record<AccentColor, { primary: string; hover: string; active: string; bg: string }> = {
  indigo: { primary: 'var(--accent-indigo)', hover: 'var(--accent-indigo-hover)', active: 'var(--accent-indigo-active)', bg: 'var(--accent-indigo-bg)' },
  blue: { primary: 'var(--accent-blue)', hover: 'var(--accent-blue-hover)', active: 'var(--accent-blue-active)', bg: 'var(--accent-blue-bg)' },
  green: { primary: 'var(--accent-green)', hover: 'var(--accent-green-hover)', active: 'var(--accent-green-active)', bg: 'var(--accent-green-bg)' },
  purple: { primary: 'var(--accent-purple)', hover: 'var(--accent-purple-hover)', active: 'var(--accent-purple-active)', bg: 'var(--accent-purple-bg)' },
  red: { primary: 'var(--accent-red)', hover: 'var(--accent-red-hover)', active: 'var(--accent-red-active)', bg: 'var(--accent-red-bg)' },
  orange: { primary: 'var(--accent-orange)', hover: 'var(--accent-orange-hover)', active: 'var(--accent-orange-active)', bg: 'var(--accent-orange-bg)' },
  pink: { primary: 'var(--accent-pink)', hover: 'var(--accent-pink-hover)', active: 'var(--accent-pink-active)', bg: 'var(--accent-pink-bg)' },
};

interface ThemeConfig {
  mode: ThemeMode;
  accentColor: AccentColor;
  activeTheme: 'dark' | 'light';
}

interface ThemeState extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  applyPreset: (preset: ThemePreset) => void;
  init: () => void;
}

const STORAGE_KEY = 's1yle-theme-config';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  accentColor: 'indigo',
  activeTheme: 'dark',

  setMode: (mode: ThemeMode) => {
    const actualTheme = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    set({ mode, activeTheme: actualTheme });
    applyToDom(actualTheme, get().accentColor);
    saveConfig({ ...get(), mode, activeTheme: actualTheme });
  },

  setAccentColor: (accentColor: AccentColor) => {
    set({ accentColor });
    applyToDom(get().activeTheme, accentColor);
    saveConfig({ ...get(), accentColor });
  },

  applyPreset: (preset: ThemePreset) => {
    const actualTheme = preset.mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preset.mode;
    const config: ThemeConfig = {
      mode: preset.mode,
      accentColor: preset.accentColor,
      activeTheme: actualTheme,
    };
    set(config);
    applyToDom(actualTheme, preset.accentColor);
    saveConfig(config);
  },

  init: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config: ThemeConfig = JSON.parse(saved);
        const actualTheme = config.mode === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : config.mode;
        set({ ...config, activeTheme: actualTheme });
        applyToDom(actualTheme, config.accentColor);
      } else {
        applyToDom('dark', 'indigo');
      }
    } catch {
      applyToDom('dark', 'indigo');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { mode } = get();
      if (mode === 'system') {
        const theme = e.matches ? 'dark' : 'light';
        set({ activeTheme: theme });
        applyToDom(theme, get().accentColor);
      }
    });
  },
}));

function applyToDom(theme: 'dark' | 'light', accentColor: AccentColor) {
  const root = document.documentElement;
  root.classList.toggle('theme-dark', theme === 'dark');
  root.classList.toggle('theme-light', theme === 'light');

  const colors = accentMap[accentColor];
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.hover);
  root.style.setProperty('--color-primary-active', colors.active);
  root.style.setProperty('--color-primary-bg', colors.bg);
}

function saveConfig(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage not available
  }
}
