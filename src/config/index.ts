/**
 * 统一配置管理器 - 项目配置的单一入口
 * 
 * 设计原则：
 * 1. 单一数据源：所有配置统一通过此入口访问
 * 2. 配置与业务分离：业务逻辑不直接操作配置文件
 * 3. 类型安全：提供完整的 TypeScript 类型支持
 * 4. 响应式更新：配置变更自动通知订阅者
 * 5. 向后兼容：保持与现有 API 的兼容性
 * 
 * @module config
 */

import {
  getConfig as rustGetConfig,
  updateConfig as rustUpdateConfig,
  setConfigValue as rustSetConfigValue,
  updateInstanceConfig as rustUpdateInstanceConfig,
  removeInstanceConfig as rustRemoveInstanceConfig,
  type AppConfig,
  type InstanceConfig,
} from '@/helper/rustInvoke';
import { useConfigStore } from '@/stores/configStore'
import { getNestedValue } from '@/utils/configUtils';
import type {
  ConfigEvent,
  ConfigEventListener,
  ConfigKey,
  ConfigValue,
  UnifiedConfigManager as UnifiedConfigManagerType,
} from './types';
import { logger } from '@/helper/logger';

/**
 * 统一配置管理器类
 * 
 * 提供配置加载、访问、更新、订阅等完整功能
 */
class UnifiedConfigManager implements UnifiedConfigManagerType {
  private ready: boolean = false;
  private loading: boolean = false;
  private error: Error | null = null;
  private readyPromise: Promise<void> | null = null;
  private eventListeners: Map<ConfigEvent, Set<Function>> = new Map();
  private initialized: boolean = false;

  /**
   * 初始化配置系统（应用启动时调用）
   * 
   * @example
   * ```typescript
   * // src/main.tsx
   * await config.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('[Config] 配置系统已初始化，跳过');
      return this.readyPromise || Promise.resolve();
    }

    this.loading = true;
    this.error = null;

    this.readyPromise = (async () => {
      try {
        logger.info('[Config] 开始加载配置...');
        
        // 1. 从 Rust 后端加载配置
        const config = await rustGetConfig();
        
        // 2. 更新 Zustand Store
        useConfigStore.setState({ config, initialized: true, loading: false });
        
        // 3. 标记就绪
        this.ready = true;
        this.loading = false;
        this.initialized = true;
        
        logger.info('[Config] 配置加载完成');
        
        // 4. 触发就绪事件
        this.emit('ready');
      } catch (e) {
        this.error = e instanceof Error ? e : new Error('配置加载失败');
        this.loading = false;
        logger.error('[Config] 配置加载失败', this.error);
        useConfigStore.setState({ error: this.error.message, loading: false, initialized: true });
        this.emit('error', this.error);
        throw this.error;
      }
    })();

    return this.readyPromise;
  }

  /**
   * 等待配置就绪
   * 
   * @example
   * ```typescript
   * // 在其他 store 初始化前调用
   * await config.whenReady();
   * ```
   */
  async whenReady(): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    if (this.readyPromise) {
      return this.readyPromise;
    }
    // 如果还未开始初始化，先初始化
    return this.initialize();
  }

  /**
   * 检查配置是否已就绪
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * 获取完整配置对象
   * 
   * @deprecated 推荐使用 getConfigValue 访问具体配置项
   */
  getConfig(): AppConfig | null {
    return useConfigStore.getState().config;
  }

  /**
   * 获取配置值（类型安全）
   * 
   * @example
   * ```typescript
   * const theme = config.getConfigValue('preferences.theme');
   * const downloadPath = config.getConfigValue('download.download_path');
   * ```
   */
  getConfigValue<T extends ConfigKey>(key: T): ConfigValue<T> | undefined {
    const config = this.getConfig();
    if (!config) {
      logger.warn(`[Config] 配置未加载，无法获取：${key}`);
      return undefined;
    }

    // 使用工具函数获取嵌套值
    const value = getNestedValue<ConfigValue<T>>(config, key);
    return value;
  }

  /**
   * 设置配置值（类型安全）
   * 
   * @example
   * ```typescript
   * await config.setConfigValue('preferences.theme', 'dark');
   * await config.setConfigValue('download.concurrent_limit', 32);
   * ```
   */
  async setConfigValue<T extends ConfigKey>(key: T, value: ConfigValue<T>): Promise<void> {
    if (!this.ready) {
      logger.warn('[Config] 配置未就绪，延迟设置');
      // 等待就绪后重试
      await this.whenReady();
    }

    try {
      logger.info(`[Config] 更新配置：${key} =`, value);
      
      // 1. 调用 Rust API 更新
      await rustSetConfigValue(key, value);
      
      // 2. 刷新本地状态
      const newConfig = await rustGetConfig();
      useConfigStore.setState({ config: newConfig });
      
      // 3. 触发变更事件
      this.emit('change', key, value);
      
      logger.info('[Config] 配置更新完成');
    } catch (e) {
      const error = e instanceof Error ? e : new Error('配置更新失败');
      logger.error('[Config] 配置更新失败', error);
      throw error;
    }
  }

  /**
   * 获取实例配置
   */
  getInstanceConfig(instanceId: string): InstanceConfig | null {
    const config = this.getConfig();
    if (!config) {
      logger.warn('[Config] 配置未加载，无法获取实例配置');
      return null;
    }
    return config.instance_configs[instanceId] || null;
  }

  /**
   * 更新实例配置
   */
  async updateInstanceConfig(
    instanceId: string,
    config: Partial<InstanceConfig>
  ): Promise<void> {
    if (!this.ready) {
      await this.whenReady();
    }

    try {
      logger.info(`[Config] 更新实例配置：${instanceId}`);
      
      await rustUpdateInstanceConfig(instanceId, config);
      
      // 刷新本地状态
      const newConfig = await rustGetConfig();
      useConfigStore.setState({ config: newConfig });
      
      this.emit('change', `instance_configs.${instanceId}`, config);
      
      logger.info('[Config] 实例配置更新完成');
    } catch (e) {
      const error = e instanceof Error ? e : new Error('实例配置更新失败');
      logger.error('[Config] 实例配置更新失败', error);
      throw error;
    }
  }

  /**
   * 删除实例配置
   */
  async removeInstanceConfig(instanceId: string): Promise<void> {
    if (!this.ready) {
      await this.whenReady();
    }

    try {
      logger.info(`[Config] 删除实例配置：${instanceId}`);
      
      await rustRemoveInstanceConfig(instanceId);
      
      // 刷新本地状态
      const newConfig = await rustGetConfig();
      useConfigStore.setState({ config: newConfig });
      
      this.emit('change', `instance_configs.${instanceId}`, null);
      
      logger.info('[Config] 实例配置删除完成');
    } catch (e) {
      const error = e instanceof Error ? e : new Error('实例配置删除失败');
      logger.error('[Config] 实例配置删除失败', error);
      throw error;
    }
  }

  /**
   * 订阅配置事件
   * 
   * @example
   * ```typescript
   * // 订阅配置就绪
   * const unsubscribeReady = config.on('ready', () => {
   *   console.log('配置已就绪');
   * });
   * 
   * // 订阅配置变更
   * const unsubscribeChange = config.on('change', (key, value) => {
   *   console.log(`配置变更：${key} = ${value}`);
   * });
   * 
   * // 取消订阅
   * unsubscribeReady();
   * unsubscribeChange();
   * ```
   */
  on<T extends ConfigEvent>(event: T, callback: ConfigEventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅配置事件
   */
  off<T extends ConfigEvent>(event: T, callback: ConfigEventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emit<T extends ConfigEvent>(event: T, ...args: Parameters<ConfigEventListener<T>>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * 销毁配置管理器（清理资源）
   */
  destroy(): void {
    this.eventListeners.clear();
    this.initialized = false;
    this.ready = false;
    this.loading = false;
    this.error = null;
    this.readyPromise = null;
  }
}

/** 统一配置管理器单例 */
export const config = new UnifiedConfigManager();

// 导出类型
export type {
  ConfigEvent,
  ConfigEventListener,
  ConfigKey,
  ConfigValue,
  ThemeMode,
  AccentColor,
  Language,
} from './types';

// 重新导出 useConfigStore（保持向后兼容）
export { useConfigStore };
