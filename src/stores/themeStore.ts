import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  activeTheme: 'dark' | 'light';

  setMode: (mode: ThemeMode) => void;
  applyTheme: (theme: 'dark' | 'light') => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  activeTheme: 'dark',

  setMode: (mode: ThemeMode) => {
    set({ mode });
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = prefersDark ? 'dark' : 'light';
      set({ activeTheme: theme });
      applyThemeToDom(theme);
    } else {
      set({ activeTheme: mode });
      applyThemeToDom(mode);
    }
    try {
      localStorage.setItem('s1yle-theme-mode', mode);
    } catch {
      // storage not available
    }
  },

  applyTheme: (theme: 'dark' | 'light') => {
    set({ activeTheme: theme, mode: theme });
    applyThemeToDom(theme);
    try {
      localStorage.setItem('s1yle-theme-mode', theme);
    } catch {
      // storage not available
    }
  },

  init: () => {
    try {
      const saved = localStorage.getItem('s1yle-theme-mode') as ThemeMode | null;
      if (saved) {
        if (saved === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const theme = prefersDark ? 'dark' : 'light';
          set({ mode: 'system', activeTheme: theme });
          applyThemeToDom(theme);
        } else {
          set({ mode: saved, activeTheme: saved });
          applyThemeToDom(saved);
        }
      } else {
        applyThemeToDom('dark');
      }
    } catch {
      applyThemeToDom('dark');
    }
  },
}));

function applyThemeToDom(theme: 'dark' | 'light') {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }
}
