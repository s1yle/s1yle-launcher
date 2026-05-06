import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, InstanceConfig } from '@/helper/rustInvoke';
import { debounce, getNestedValue, setNestedValue } from '../utils/configUtils';
import { useConfigStore } from '../stores/configStore';

/**
 * 配置管理器 - 分层配置存储系统
 * 
 * L1: localStorage - UI 配置（立即同步保存）
 * L2: 配置文件 - 业务配置（异步防抖保存）
 * L3: 加密存储 - 敏感数据（立即异步保存）
 */
class ConfigManager {
  // 防抖保存（500ms）
  private debouncedSave = debounce(async (key: string, value: any) => {
    try {
      await invoke('set_config_value', { keyPath: key, value });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, 500);

  /**
   * L1: localStorage 操作
   */
  getLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  setLocalStorage(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
    }
  }

  removeLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  /**
   * L2: 配置文件操作
   */
  getConfig(): AppConfig | null {
    return useConfigStore.getState().config;
  }

  async setConfigValue(keyPath: string, value: any): Promise<void> {
    try {
      await invoke('set_config_value', { keyPath, value });
    } catch (error) {
      console.error('Failed to set config value:', error);
      throw error;
    }
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      await invoke('update_config', { config: updates });
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  }

  async reloadConfig(): Promise<void> {
    await useConfigStore.getState().init();
  }

  /**
   * L3: 加密存储操作
   */
  async getSecureToken(key: string): Promise<string> {
    return await invoke('get_secure_token', { key });
  }

  async setSecureToken(key: string, value: string): Promise<void> {
    await invoke('save_secure_token', { key, value });
  }

  async deleteSecureToken(key: string): Promise<void> {
    await invoke('delete_secure_token', { key });
  }

  /**
   * 配置分类读写（推荐用法）
   */
  getPreference<T>(key: string): T {
    // L1 优先
    const l1Value = this.getLocalStorage<T>(`preferences.${key}`);
    if (l1Value !== null) {
      return l1Value;
    }

    // L2 备份
    const config = this.getConfig();
    return getNestedValue<T>(config?.preferences, key) || this.getDefaultPreference(key);
  }

  setPreference(key: string, value: any): void {
    // L1: 立即保存到 localStorage
    this.setLocalStorage(`preferences.${key}`, value);

    // L2: 异步备份到配置文件（防抖）
    this.debouncedSave(`preferences.${key}`, value);
  }

  private getDefaultPreference(key: string): any {
    const defaults: Record<string, any> = {
      theme: 'dark',
      accent_color: 'indigo',
      language: 'zh-CN',
      enable_animation: true,
    };
    return defaults[key];
  }

  /**
   * 实例配置管理
   */
  getInstanceConfig(instanceId: string): InstanceConfig | null {
    const config = this.getConfig();
    return config?.instance_configs?.[instanceId] || null;
  }

  async updateInstanceConfig(config: InstanceConfig): Promise<void> {
    await this.setConfigValue(`instance_configs.${config.id}`, config);
  }

  async deleteInstanceConfig(instanceId: string): Promise<void> {
    const config = this.getConfig();
    if (!config) return;

    const newConfigs = { ...config.instance_configs };
    delete newConfigs[instanceId];
    await this.setConfigValue('instance_configs', newConfigs);
  }

  /**
   * UI 配置管理
   */
  getUIConfig<T>(key: string): T {
    const l1Value = this.getLocalStorage<T>(`ui.${key}`);
    if (l1Value !== null) {
      return l1Value;
    }
    return this.getDefaultUIConfig(key);
  }

  setUIConfig(key: string, value: any): void {
    this.setLocalStorage(`ui.${key}`, value);
    this.debouncedSave(`ui.${key}`, value);
  }

  private getDefaultUIConfig(key: string): any {
    const defaults: Record<string, any> = {
      sidebarWidth: 240,
      sidebarCollapsed: false,
      instanceViewMode: 'grid',
      downloadPanelExpanded: true,
    };
    return defaults[key];
  }
}

export const configManager = new ConfigManager();
