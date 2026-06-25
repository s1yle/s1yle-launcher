import { create } from 'zustand';
import type { AppConfig } from '@/helper/rustInvoke';

/**
 * 全局配置 Store 的内部接口
 */
interface ConfigState {
  /** 完整的应用配置对象 */
  config: AppConfig | null;
  /** 是否正在加载配置 */
  loading: boolean;
  /** 加载配置时的错误信息 */
  error: string | null;
  /** 是否已完成初始化加载 */
  initialized: boolean;
  
  /** 设置完整配置对象 */
  setConfig: (config: AppConfig) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误信息 */
  setError: (error: string | null) => void;
  /** 设置初始化完成状态 */
  setInitialized: (initialized: boolean) => void;
}

/**
 * 全局配置 Store
 *
 * 提供配置对象的本地缓存，setter 仅修改内存状态。
 * 持久化写入需调用 `config.setConfigValue()`。
 */
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
