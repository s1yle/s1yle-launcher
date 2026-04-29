import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  getConfig,
  updateConfig,
  setConfigValue,
  getInstanceConfig,
  updateInstanceConfig as updateInstanceConfigApi,
  removeInstanceConfig as removeInstanceConfigApi,
  resetConfig as resetConfigApi,
  exportConfig as exportConfigApi,
  importConfig as importConfigApi,
  type AppConfig,
  type InstanceConfig,
  type UserPreferences,
} from '@/helper/rustInvoke';

interface ConfigState {
  // 配置数据
  config: AppConfig | null;
  loading: boolean;
  error: string | null;

  // 初始化
  init: () => Promise<void>;
  refresh: () => Promise<void>;

  // 全局配置操作
  updateGlobalConfig: (partial: Partial<AppConfig>) => Promise<void>;
  setPreference: (key: keyof UserPreferences, value: any) => Promise<void>;

  // 实例配置操作
  getInstanceConfig: (instanceId: string) => InstanceConfig | null;
  updateInstanceConfig: (instanceId: string, config: Partial<InstanceConfig>) => Promise<void>;
  removeInstanceConfig: (instanceId: string) => Promise<void>;

  // 动态配置操作
  setConfigValue: <T>(key: string, value: T) => Promise<void>;

  // 配置导入导出
  exportConfig: (path: string) => Promise<void>;
  importConfig: (path: string) => Promise<void>;
  resetConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  subscribeWithSelector((set, get) => ({
    config: null,
    loading: false,
    error: null,

    // 初始化配置
    init: async () => {
      set({ loading: true, error: null });
      try {
        const config = await getConfig();
        set({ config, loading: false });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : '加载配置失败',
          loading: false,
        });
      }
    },

    // 刷新配置
    refresh: async () => {
      try {
        const config = await getConfig();
        set({ config });
      } catch {
        // 保持现有配置
      }
    },

    // 更新全局配置
    updateGlobalConfig: async (partial) => {
      const current = get().config;
      if (!current) return;

      const updated = { ...current, ...partial };
      await updateConfig(updated);
      set({ config: updated });
    },

    // 设置用户偏好
    setPreference: async (key, value) => {
      const current = get().config;
      if (!current) return;

      const updated = {
        ...current,
        preferences: {
          ...current.preferences,
          [key as string]: value,
        },
      };

      await setConfigValue(`preferences.${key}`, value);
      set({ config: updated });
    },

    // 获取实例配置
    getInstanceConfig: (instanceId) => {
      const { config } = get();
      if (!config) return null;
      return config.instance_configs[instanceId] || null;
    },

    // 更新实例配置
    updateInstanceConfig: async (instanceId, partial) => {
      const current = get().getInstanceConfig(instanceId);
      if (!current) return;

      const updated = { ...current, ...partial } as InstanceConfig;
      await updateInstanceConfigApi(instanceId, updated);

      // 更新本地状态
      const globalConfig = get().config;
      if (globalConfig) {
        set({
          config: {
            ...globalConfig,
            instance_configs: {
              ...globalConfig.instance_configs,
              [instanceId]: updated,
            },
          },
        });
      }
    },

    // 删除实例配置
    removeInstanceConfig: async (instanceId) => {
      await removeInstanceConfigApi(instanceId);

      const globalConfig = get().config;
      if (globalConfig) {
        const { [instanceId]: removed, ...rest } = globalConfig.instance_configs;
        set({
          config: {
            ...globalConfig,
            instance_configs: rest,
          },
        });
      }
    },

    // 动态设置配置值
    setConfigValue: async (key, value) => {
      await setConfigValue(key, value);
      await get().refresh();
    },

    // 导出配置
    exportConfig: async (path) => {
      await exportConfigApi(path);
    },

    // 导入配置
    importConfig: async (path) => {
      await importConfigApi(path);
      await get().refresh();
    },

    // 重置配置
    resetConfig: async () => {
      await resetConfigApi();
      await get().refresh();
    },
  }))
);
