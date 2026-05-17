import type { AppConfig, InstanceConfig, UserPreferences, DownloadConfig } from '@/helper/rustInvoke';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
export type Language = 'zh-CN' | 'en-US';

export interface ConfigEvents {
  ready: () => void;
  change: (key: string, value: any) => void;
  error: (error: Error) => void;
}

export type ConfigEvent = keyof ConfigEvents;
export type ConfigEventListener<T extends ConfigEvent> = ConfigEvents[T];

export interface ConfigKeyMap {
  'preferences.theme': ThemeMode;
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

export type ConfigKey = keyof ConfigKeyMap;

export type ConfigValue<T extends ConfigKey> = ConfigKeyMap[T];

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

export type InstanceConfigKey = keyof InstanceConfigKeyMap;

export interface ConfigState {
  config: AppConfig | null;
  ready: boolean;
  loading: boolean;
  error: Error | null;
}

export interface ConfigManagerOptions {
  autoLoad?: boolean;
  cacheEnabled?: boolean;
  cacheDuration?: number;
}

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
