import { create } from 'zustand';

export type LoadingVariant = 'spinner' | 'progress' | 'skeleton' | 'topbar';
export type SpinnerStyle = 'ring' | 'dots' | 'pulse' | 'bars';
export type SkeletonStyle = 'shimmer' | 'pulse' | 'static';
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingEntry {
  status: LoadingStatus;
  progress?: number;
  message?: string;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
  variant: LoadingVariant;
  skeleton?: 'list' | 'card' | 'profile' | 'form' | 'text';
  blocking: boolean;
}

export interface LoadingConfig {
  variant: LoadingVariant;
  spinnerStyle: SpinnerStyle;
  skeletonStyle: SkeletonStyle;
  globalTopbar: boolean;
  minDurationMs: number;
  timeoutSec: number;
}

export interface LoadingState {
  entries: Record<string, LoadingEntry>;
  config: LoadingConfig;
  register: (key: string, opts?: Partial<LoadingEntry>) => void;
  update: (key: string, patch: Partial<LoadingEntry>) => void;
  done: (key: string, error?: string) => void;
  reset: (key: string) => void;
  unregister: (key: string) => void;
  setConfig: (config: Partial<LoadingConfig>) => void;
}

const defaultConfig: LoadingConfig = {
  variant: 'spinner',
  spinnerStyle: 'ring',
  skeletonStyle: 'shimmer',
  globalTopbar: true,
  minDurationMs: 300,
  timeoutSec: 30,
};

export const useLoadingStore = create<LoadingState>()(
  (set, get) => ({
    entries: {},
    config: { ...defaultConfig },

    register: (key, opts) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            status: 'loading',
            variant: opts?.variant ?? state.entries[key]?.variant ?? 'spinner',
            blocking: opts?.blocking ?? state.entries[key]?.blocking ?? false,
            skeleton: opts?.skeleton,
            message: opts?.message ?? state.entries[key]?.message,
            progress: opts?.progress,
            startedAt: Date.now(),
          },
        },
      }));
    },

    update: (key, patch) => {
      set((state) => {
        const entry = state.entries[key];
        if (!entry) return state;
        return {
          entries: {
            ...state.entries,
            [key]: { ...entry, ...patch },
          },
        };
      });
    },

    done: (key, error) => {
      set((state) => {
        const entry = state.entries[key];
        if (!entry) return state;
        return {
          entries: {
            ...state.entries,
            [key]: {
              ...entry,
              status: error ? 'error' : 'success',
              error,
              finishedAt: Date.now(),
            },
          },
        };
      });
    },

    reset: (key) => {
      set((state) => {
        const entry = state.entries[key];
        if (!entry) return state;
        return {
          entries: {
            ...state.entries,
            [key]: { ...entry, status: 'idle', progress: undefined, error: undefined },
          },
        };
      });
    },

    unregister: (key) => {
      set((state) => {
        const { [key]: _, ...rest } = state.entries;
        return { entries: rest };
      });
    },

    setConfig: (config) => {
      set((state) => ({
        config: { ...state.config, ...config },
      }));
    },
  })
);

export function getActiveEntries(entries: Record<string, LoadingEntry>): LoadingEntry[] {
  return Object.values(entries).filter((e) => e.status === 'loading');
}

export function getGlobalProgress(entries: Record<string, LoadingEntry>): number {
  const active = getActiveEntries(entries);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, e) => sum + (e.progress ?? 0), 0);
  return Math.round(total / active.length);
}
