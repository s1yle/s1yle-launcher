/**
 * 统一配置管理器 - 项目配置的单一入口
 *
 * 仅保留应用启动时的配置预加载（main.tsx 调用 `config.initialize()`），
 * 其余方法（事件订阅、增量读写、等待就绪等）经排查无任何调用方，已移除。
 * 页面/Store 需要配置时直接使用 `@/helper/rustInvoke` 或 `@/api/config`。
 *
 * @module config
 */

import { getConfig as rustGetConfig } from '@/helper/rustInvoke';
import { useConfigStore } from '@/stores/configStore';
import { logger } from '@/helper/logger';

/** 统一配置管理器类 */
class UnifiedConfigManager {
  private initialized: boolean = false;
  private readyPromise: Promise<void> | null = null;

  /**
   * 初始化配置系统（应用启动时调用，加载配置并写入 useConfigStore）
   *
   * @example
   * ```typescript
   * await config.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return this.readyPromise || Promise.resolve();
    }

    this.readyPromise = (async () => {
      try {
        logger.info('[Config] 开始加载配置...');
        const config = await rustGetConfig();
        useConfigStore.setState({ config, initialized: true, loading: false });
        this.initialized = true;
        logger.info('[Config] 配置加载完成');
      } catch (e) {
        this.initialized = true;
        const error = e instanceof Error ? e : new Error('配置加载失败');
        logger.error('[Config] 配置加载失败', error);
        useConfigStore.setState({ error: error.message, loading: false, initialized: true });
        throw error;
      }
    })();

    return this.readyPromise;
  }
}

/** 统一配置管理器单例 */
export const config = new UnifiedConfigManager();
