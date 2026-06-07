export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

export interface AppConfig {
  version: number;
  base_path: string;
  window_position: WindowPosition;
  preferences: UserPreferences;
  download: DownloadConfig;
  path_config: PathConfig;
  instance_configs: Record<string, InstanceConfig>;
}

export interface PathConfig {
  daemon_base_path: string;
  download_base_path: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  accent_color: string;
  language: 'zh-CN' | 'en-US';
  enable_animation: boolean;
}

export interface DownloadConfig {
  download_path: string;
  concurrent_limit: number;
  auto_verify: boolean;
}

export interface InstanceConfig {
  id: string;
  name: string;
  version: string;
  loader_type: string;
  loader_version: string | null;
  java: JavaConfig;
  memory: MemoryConfig;
  graphics: GraphicsConfig;
  custom_args: string[];
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}

export interface JavaConfig {
  java_path: string | null;
  java_args: string[];
  use_bundled: boolean;
}

export interface MemoryConfig {
  min_memory: number;
  max_memory: number;
}

export interface GraphicsConfig {
  width: number;
  height: number;
  fullscreen: boolean;
}
