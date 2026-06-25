import type { AppConfig, InstanceConfig, UserPreferences, DownloadConfig } from '@/helper/rustInvoke';
import { ThemePreset } from '@/stores/themeStore';

/**
 * 强调色类型
 */
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
/**
 * 支持的语言类型
 */
export type Language = 'zh-CN' | 'en-US';

/**
 * 背景类型
 */
export type BackgroundType = 'none' | 'color' | 'gradient' | 'image'

/** 背景配置 */
export interface BackgroundConfig {
  type: BackgroundType
  color?: string
  gradient?: string
  imagePath?: string
  imageFit?: 'cover' | 'contain' | 'fill' | 'tile'
  opacity: number
  blur: number
  overlayColor: string
  overlayOpacity: number
}

/** 配置系统事件映射 */
export interface ConfigEvents {
  ready: () => void;
  change: (key: string, value: any) => void;
  error: (error: Error) => void;
}

/** 配置事件名称 */
export type ConfigEvent = keyof ConfigEvents;
/** 配置事件监听器类型 */
export type ConfigEventListener<T extends ConfigEvent> = ConfigEvents[T];

/** 配置键到值的映射 */
export interface ConfigKeyMap {
  'preferences.theme': ThemePreset;
  'preferences.accent_color': AccentColor;
  'preferences.language': Language;
  'preferences.enable_animation': boolean;
  'download.download_path': string;
  'download.concurrent_limit': number;
  'download.auto_verify': boolean;
  'window_position.x': number;
  'window_position.y': number;
  'window_position.width': number;
  'window_position.height': number;
  'window_position.maximized': boolean;
  'instance_configs': Record<string, InstanceConfig>;
  'known_folders': any[];
}

/** 配置键类型 */
export type ConfigKey = keyof ConfigKeyMap;

/** 根据配置键获取对应的值类型 */
export type ConfigValue<T extends ConfigKey> = ConfigKeyMap[T];

/** 实例配置键到值的映射 */
export interface InstanceConfigKeyMap {
  'java.java_path': string | null;
  'java.java_args': string[];
  'java.use_bundled': boolean;
  'memory.min_memory': number;
  'memory.max_memory': number;
  'graphics.width': number;
  'graphics.height': number;
  'graphics.fullscreen': boolean;
  'custom_args': string[];
  'icon_path': string | null;
  'enabled': boolean;
}

/** 实例配置键类型 */
export type InstanceConfigKey = keyof InstanceConfigKeyMap;

/** 配置状态 */
export interface ConfigState {
  config: AppConfig | null;
  ready: boolean;
  loading: boolean;
  error: Error | null;
}

/** 配置管理器初始化选项 */
export interface ConfigManagerOptions {
  autoLoad?: boolean;
  cacheEnabled?: boolean;
  cacheDuration?: number;
}

/** 统一配置管理器接口 */
export interface UnifiedConfigManager {
  initialize(): Promise<void>;
  whenReady(): Promise<void>;
  isReady(): boolean;
  getConfig(): AppConfig | null;
  getConfigValue<T extends ConfigKey>(key: T): ConfigValue<T> | undefined;
  setConfigValue<T extends ConfigKey>(key: T, value: ConfigValue<T>): Promise<void>;
  getInstanceConfig(instanceId: string): InstanceConfig | null;
  updateInstanceConfig(instanceId: string, config: Partial<InstanceConfig>): Promise<void>;
  removeInstanceConfig(instanceId: string): Promise<void>;
  on<T extends ConfigEvent>(event: T, callback: ConfigEventListener<T>): () => void;
  off<T extends ConfigEvent>(event: T, callback: ConfigEventListener<T>): void;
  destroy(): void;
}
