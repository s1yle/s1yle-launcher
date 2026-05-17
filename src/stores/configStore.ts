import { create } from 'zustand';
import type { AppConfig } from '@/helper/rustInvoke';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  setConfig: (config: AppConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,
  initialized: false,

  setConfig: (config) => set({ config }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
}));
