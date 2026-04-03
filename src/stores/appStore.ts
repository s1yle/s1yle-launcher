import { create } from 'zustand';
import { invokeRustFunction } from '../helper/rustInvoke';

interface SystemInfo {
  os: string;
  arch: string;
}

interface AppState {
  systemInfo: SystemInfo | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  init: () => Promise<void>;
  testGreet: (name: string) => Promise<string>;
  refreshSystemInfo: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  systemInfo: null,
  loading: false,
  error: null,
  initialized: false,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const info = await invokeRustFunction('get_system_info');
      set({ systemInfo: info, initialized: true });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to init' });
    } finally {
      set({ loading: false });
    }
  },

  testGreet: async (name: string) => {
    return invokeRustFunction('greet', { name });
  },

  refreshSystemInfo: async () => {
    try {
      const info = await invokeRustFunction('get_system_info');
      set({ systemInfo: info });
    } catch {
      // silently fail
    }
  },
}));
