import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
export type BlurIntensity = 'none' | 'low' | 'medium' | 'high';
export type Density = 'compact' | 'normal' | 'spacious';

export interface ThemePreset {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  mode: ThemeMode;
  accentColor: AccentColor;
  blurIntensity: BlurIntensity;
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
    blurIntensity: 'medium',
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
    blurIntensity: 'medium',
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

export const blurValues: Record<BlurIntensity, string> = {
  none: '0px',
  low: '4px',
  medium: '8px',
  high: '16px',
};

interface ThemeConfig {
  mode: ThemeMode;
  accentColor: AccentColor;
  blurIntensity: BlurIntensity;
  density: Density;
  activeTheme: 'dark' | 'light';
}

interface ThemeState extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setBlurIntensity: (intensity: BlurIntensity) => void;
  setDensity: (density: Density) => void;
  applyPreset: (preset: ThemePreset) => void;
  init: () => void;
}

const STORAGE_KEY = 's1yle-theme-config';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  accentColor: 'indigo',
  blurIntensity: 'medium',
  density: 'normal',
  activeTheme: 'dark',

  setMode: (mode: ThemeMode) => {
    const actualTheme = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    set({ mode, activeTheme: actualTheme });
    applyToDom(actualTheme, get().accentColor, get().blurIntensity, get().density);
    saveConfig({ ...get(), mode, activeTheme: actualTheme });
  },

  setAccentColor: (accentColor: AccentColor) => {
    set({ accentColor });
    applyToDom(get().activeTheme, accentColor, get().blurIntensity, get().density);
    saveConfig({ ...get(), accentColor });
  },

  setBlurIntensity: (blurIntensity: BlurIntensity) => {
    set({ blurIntensity });
    applyToDom(get().activeTheme, get().accentColor, blurIntensity, get().density);
    saveConfig({ ...get(), blurIntensity });
  },

  setDensity: (density: Density) => {
    set({ density });
    applyToDom(get().activeTheme, get().accentColor, get().blurIntensity, density);
    saveConfig({ ...get(), density });
  },

  applyPreset: (preset: ThemePreset) => {
    const actualTheme = preset.mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preset.mode;
    const config: ThemeConfig = {
      mode: preset.mode,
      accentColor: preset.accentColor,
      blurIntensity: preset.blurIntensity,
      density: 'normal',
      activeTheme: actualTheme,
    };
    set(config);
    applyToDom(actualTheme, preset.accentColor, preset.blurIntensity, 'normal');
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
        applyToDom(actualTheme, config.accentColor, config.blurIntensity, config.density);
      } else {
        applyToDom('dark', 'indigo', 'medium', 'normal');
      }
    } catch {
      applyToDom('dark', 'indigo', 'medium', 'normal');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { mode } = get();
      if (mode === 'system') {
        const theme = e.matches ? 'dark' : 'light';
        set({ activeTheme: theme });
        applyToDom(theme, get().accentColor, get().blurIntensity, get().density);
      }
    });
  },
}));

function applyToDom(theme: 'dark' | 'light', _accentColor: AccentColor, blurIntensity: BlurIntensity, density: Density) {
  const root = document.documentElement;

  root.classList.toggle('theme-dark', theme === 'dark');
  root.classList.toggle('theme-light', theme === 'light');

  root.style.setProperty('--blur-value', blurValues[blurIntensity]);

  const densityValues: Record<Density, { scale: string }> = {
    compact: { scale: '0.95' },
    normal: { scale: '1' },
    spacious: { scale: '1.05' },
  };
  root.style.setProperty('--density-scale', densityValues[density].scale);
}

function saveConfig(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage not available
  }
}
