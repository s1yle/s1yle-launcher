import { create } from 'zustand';
import { invokeRustFunction } from '../helper/rustInvoke';

/**
 * 系统信息
 */
interface SystemInfo {
  /** 操作系统名称 */
  os: string;
  /** CPU 架构 */
  arch: string;
}

/**
 * 全局应用状态 Store 的内部接口
 *
 * 存储系统信息等全局共享数据。
 */
interface AppState {
  /** 系统信息（操作系统、架构） */
  systemInfo: SystemInfo | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否已完成初始化 */
  initialized: boolean;

  /** 初始化 Store，获取系统信息 */
  init: () => Promise<void>;
  /** 测试 Rust 后端通信（greet 命令） */
  testGreet: (name: string) => Promise<string>;
  /** 刷新系统信息 */
  refreshSystemInfo: () => Promise<void>;
}

/**
 * 全局应用状态 Store
 *
 * 功能:
 * - 获取并缓存系统信息（OS、架构）
 * - 提供初始化状态追踪
 */
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
