import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config';
import type { InstanceConfig, UserPreferences } from '@/helper/rustInvoke';

/**
 * 全局配置 Hook
 */
export const useConfig = () => {
  const [configState, setConfigState] = useState(config.getConfig());
  const [loading, setLoading] = useState(!config.isReady());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 等待配置就绪
    const initConfig = async () => {
      try {
        setLoading(true);
        await config.whenReady();
        setConfigState(config.getConfig());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : '配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    initConfig();

    // 订阅配置变更
    const unsubscribe = config.on('change', () => {
      setConfigState(config.getConfig());
    });

    return unsubscribe;
  }, []);

  return {
    config: configState,
    loading,
    error,
  };
};

/**
 * 用户偏好 Hook
 */
export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(
    config.getConfig()?.preferences
  );
  const [loading, setLoading] = useState(!config.isReady());

  useEffect(() => {
    // 等待配置就绪
    const initConfig = async () => {
      await config.whenReady();
      setPreferences(config.getConfig()?.preferences);
      setLoading(false);
    };

    initConfig();

    // 订阅配置变更
    const unsubscribe = config.on('change', (key) => {
      if (key.startsWith('preferences.')) {
        setPreferences(config.getConfig()?.preferences);
      }
    });

    return unsubscribe;
  }, []);

  const setTheme = useCallback(async (theme: UserPreferences['theme']) => {
    await config.setConfigValue('preferences.theme', theme);
  }, []);

  const setLanguage = useCallback(async (language: UserPreferences['language']) => {
    await config.setConfigValue('preferences.language', language);
  }, []);

  const toggleAnimation = useCallback(async () => {
    const current = preferences?.enable_animation ?? true;
    await config.setConfigValue('preferences.enable_animation', !current);
  }, [preferences]);

  return {
    preferences,
    loading,
    setTheme,
    setLanguage,
    toggleAnimation,
  };
};

/**
 * 实例配置 Hook
 */
export const useInstanceConfig = (instanceId: string) => {
  const [instanceConfig, setInstanceConfig] = useState<InstanceConfig | null>(null);
  const [loading, setLoading] = useState(!config.isReady());

  useEffect(() => {
    const initConfig = async () => {
      await config.whenReady();
      setInstanceConfig(config.getInstanceConfig(instanceId));
      setLoading(false);
    };

    initConfig();

    const unsubscribe = config.on('change', (key) => {
      if (key.startsWith(`instance_configs.${instanceId}`)) {
        setInstanceConfig(config.getInstanceConfig(instanceId));
      }
    });

    return unsubscribe;
  }, [instanceId]);

  const updateJava = useCallback(
    async (javaPath: string, javaArgs: string[]) => {
      await config.updateInstanceConfig(instanceId, {
        java: {
          ...instanceConfig?.java,
          java_path: javaPath,
          java_args: javaArgs,
        },
      });
    },
    [instanceId, instanceConfig]
  );

  const updateMemory = useCallback(
    async (minMemory: number, maxMemory: number) => {
      await config.updateInstanceConfig(instanceId, {
        memory: {
          min_memory: minMemory,
          max_memory: maxMemory,
        },
      });
    },
    [instanceId]
  );

  const removeInstanceConfig = useCallback(async () => {
    await config.removeInstanceConfig(instanceId);
  }, [instanceId]);

  return {
    instanceConfig,
    loading,
    updateJava,
    updateMemory,
    removeInstanceConfig,
  };
};

/**
 * 下载配置 Hook
 */
export const useDownloadConfig = () => {
  const [downloadConfig, setDownloadConfig] = useState(config.getConfig()?.download);
  const [loading, setLoading] = useState(!config.isReady());

  useEffect(() => {
    const initConfig = async () => {
      await config.whenReady();
      setDownloadConfig(config.getConfig()?.download);
      setLoading(false);
    };

    initConfig();

    const unsubscribe = config.on('change', (key) => {
      if (key.startsWith('download.')) {
        setDownloadConfig(config.getConfig()?.download);
      }
    });

    return unsubscribe;
  }, []);

  const setDownloadPath = useCallback(async (path: string) => {
    await config.setConfigValue('download.download_path', path);
  }, []);

  const setConcurrentLimit = useCallback(async (limit: number) => {
    await config.setConfigValue('download.concurrent_limit', limit);
  }, []);

  return {
    downloadConfig,
    loading,
    setDownloadPath,
    setConcurrentLimit,
  };
};
