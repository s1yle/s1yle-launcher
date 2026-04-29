import { useCallback } from 'react';
import { useConfigStore } from '@/stores/configStore';
import type { InstanceConfig, UserPreferences } from '@/helper/rustInvoke';

/**
 * 全局配置 Hook
 */
export const useConfig = () => {
  const config = useConfigStore((s) => s.config);
  const loading = useConfigStore((s) => s.loading);
  const error = useConfigStore((s) => s.error);
  const init = useConfigStore((s) => s.init);
  const refresh = useConfigStore((s) => s.refresh);

  return {
    config,
    loading,
    error,
    init,
    refresh,
  };
};

/**
 * 用户偏好 Hook
 */
export const usePreferences = () => {
  const preferences = useConfigStore((s) => s.config?.preferences);
  const setPreference = useConfigStore((s) => s.setPreference);

  const setTheme = useCallback(
    (theme: UserPreferences['theme']) => {
      return setPreference('theme', theme);
    },
    [setPreference]
  );

  const setLanguage = useCallback(
    (language: UserPreferences['language']) => {
      return setPreference('language', language);
    },
    [setPreference]
  );

  const toggleAnimation = useCallback(() => {
    const current = preferences?.enable_animation ?? true;
    return setPreference('enable_animation', !current);
  }, [preferences, setPreference]);

  return {
    preferences,
    setTheme,
    setLanguage,
    toggleAnimation,
  };
};

/**
 * 实例配置 Hook
 */
export const useInstanceConfig = (instanceId: string) => {
  const instanceConfig = useConfigStore((s) => s.getInstanceConfig(instanceId));
  const updateInstanceConfig = useConfigStore((s) => s.updateInstanceConfig);
  const removeInstanceConfig = useConfigStore((s) => s.removeInstanceConfig);

  const updateJava = useCallback(
    (javaPath: string, javaArgs: string[]) => {
      return updateInstanceConfig(instanceId, {
        java: {
          ...instanceConfig?.java,
          java_path: javaPath,
          java_args: javaArgs,
        },
      });
    },
    [instanceId, instanceConfig, updateInstanceConfig]
  );

  const updateMemory = useCallback(
    (minMemory: number, maxMemory: number) => {
      return updateInstanceConfig(instanceId, {
        memory: {
          min_memory: minMemory,
          max_memory: maxMemory,
        },
      });
    },
    [instanceId, updateInstanceConfig]
  );

  return {
    instanceConfig,
    updateJava,
    updateMemory,
    removeInstanceConfig,
  };
};

/**
 * 下载配置 Hook
 */
export const useDownloadConfig = () => {
  const downloadConfig = useConfigStore((s) => s.config?.download);
  const updateGlobalConfig = useConfigStore((s) => s.updateGlobalConfig);

  const setDownloadPath = useCallback(
    (path: string) => {
      return updateGlobalConfig({
        download: {
          ...downloadConfig!,
          download_path: path,
        },
      });
    },
    [downloadConfig, updateGlobalConfig]
  );

  const setConcurrentLimit = useCallback(
    (limit: number) => {
      return updateGlobalConfig({
        download: {
          ...downloadConfig!,
          concurrent_limit: limit,
        },
      });
    },
    [downloadConfig, updateGlobalConfig]
  );

  return {
    downloadConfig,
    setDownloadPath,
    setConcurrentLimit,
  };
};
