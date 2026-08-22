import { create } from 'zustand';
import { invokeGetBootstrapData, type BootstrapData } from '@/api/bootstrap';
import { useFirstRunStore } from './firstRunStore';
import { useBackgroundStore } from './backgroundStore';
import { useAppStore } from './appStore';

interface BootstrapState {
  /** 聚合引导数据（成功加载后非空） */
  data: BootstrapData | null;
  /** 是否已完成引导数据加载（成功或失败均置 true，配合安全网放行） */
  ready: boolean;
  /** 错误信息（加载失败时非空） */
  error: string | null;
  /** 加载启动引导数据并分发到各子 store */
  init: () => Promise<void>;
}

/**
 * 启动引导 Store
 *
 * 一次 IPC 调用聚合首屏所需的全部状态（迎新、背景、系统信息等），
 * 取代原先分散的 `invokeGetConfig` / `getSystemInfo` 等多路请求。
 */
export const useBootstrapStore = create<BootstrapState>((set) => ({
  data: null,
  ready: false,
  error: null,

  init: async () => {
    const data = await invokeGetBootstrapData();

    // 分发到各子 store，避免重复 IPC 拉取
    useFirstRunStore.getState().initFirstRun(data.first_run);
    useBackgroundStore.getState().initBackground(data.background);
    useAppStore.setState({ systemInfo: data.system_info, initialized: true });

    set({ data, ready: true });
  },
}));
