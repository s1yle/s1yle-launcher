import { create } from 'zustand';
import { useConfigStore } from './configStore';

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
}

interface ThemeState extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  applyPreset: (preset: ThemePreset) => void;
  init: () => void;
}

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
    
    useConfigStore.getState().setPreference('theme', mode);
  },

  setAccentColor: (accentColor: AccentColor) => {
    set({ accentColor });
    applyToDom(get().activeTheme, accentColor);
    
    useConfigStore.getState().setPreference('accent_color', accentColor);
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
    
    useConfigStore.getState().updateGlobalConfig({
      preferences: {
        ...useConfigStore.getState().config?.preferences,
        theme: preset.mode,
        accent_color: preset.accentColor,
      } as any,
    });
  },

  init: () => {
    const config = useConfigStore.getState().config;
    
    if (config?.preferences) {
      const theme = (config.preferences.theme as ThemeMode) || 'dark';
      const accentColor = (config.preferences.accent_color as AccentColor) || 'indigo';
      
      const actualTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      
      set({ mode: theme, accentColor, activeTheme: actualTheme });
      applyToDom(actualTheme, accentColor);
    } else {
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
  root.style.setProperty('--color-primary-5', colors['5']);
  root.style.setProperty('--color-primary-10', colors['10']);
  root.style.setProperty('--color-primary-15', colors['15']);
  root.style.setProperty('--color-primary-20', colors['20']);
}
