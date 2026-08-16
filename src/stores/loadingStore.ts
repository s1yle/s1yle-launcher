import { create } from 'zustand';

/** 加载状态：空闲 / 加载中 / 成功 / 出错 */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 单个加载条目的配置
 */
export interface LoadingEntry {
  /** 当前加载状态 */
  status: LoadingStatus;
  /** 加载进度（0-100） */
  progress?: number;
  /** 加载描述消息 */
  message?: string;
  /** 开始时间戳 */
  startedAt?: number;
  /** 完成时间戳 */
  finishedAt?: number;
  /** 错误信息 */
  error?: string;
  /** 是否阻塞用户交互 */
  blocking: boolean;
}

/**
 * 全局加载配置
 */
export interface LoadingConfig {
  /** 是否启用全局顶部进度条 */
  globalTopbar: boolean;
  /** 最小显示时长（毫秒），避免闪烁 */
  minDurationMs: number;
}

/**
 * 全局加载状态 Store 的内部接口
 */
export interface LoadingState {
  /** 所有加载条目的键值映射 */
  entries: Record<string, LoadingEntry>;
  /** 全局加载配置 */
  config: LoadingConfig;
  /** 注册一个新的加载条目 */
  register: (key: string, opts?: Partial<LoadingEntry>) => void;
  /** 部分更新某个加载条目的属性 */
  update: (key: string, patch: Partial<LoadingEntry>) => void;
  /** 标记某个加载条目完成（或出错） */
  done: (key: string, error?: string) => void;
  /** 重置某个加载条目的状态为 idle */
  reset: (key: string) => void;
  /** 移除某个加载条目 */
  unregister: (key: string) => void;
  /** 更新全局加载配置 */
  setConfig: (config: Partial<LoadingConfig>) => void;
}

const defaultConfig: LoadingConfig = {
  globalTopbar: true,
  minDurationMs: 0,
};

/**
 * 全局加载状态 Store
 *
 * 提供多条目加载追踪系统。
 * 加载条目通过唯一 key 注册/更新/完成/销毁。
 */
export const useLoadingStore = create<LoadingState>()(
  (set, _get) => ({
    entries: {},
    config: { ...defaultConfig },

    register: (key, opts) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            status: 'loading',
            blocking: opts?.blocking ?? state.entries[key]?.blocking ?? false,
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

/** 获取所有处于 loading 状态的条目 */
export function getActiveEntries(entries: Record<string, LoadingEntry>): LoadingEntry[] {
  return Object.values(entries).filter((e) => e.status === 'loading');
}

/** 计算所有活跃加载条目的平均进度 */
export function getGlobalProgress(entries: Record<string, LoadingEntry>): number {
  const active = getActiveEntries(entries);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, e) => sum + (e.progress ?? 0), 0);
  return Math.round(total / active.length);
}
