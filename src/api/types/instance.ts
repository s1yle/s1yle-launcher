import { ModLoaderType } from "./modloader";

export enum IsolationMode {
  Global = 'global',
  Version = 'version',
  Instance = 'instance',
}

export interface GameSettings {
  use_instance_settings?: boolean;

  java_path?: string;
  java_version?: string;
  min_memory?: number;
  max_memory?: number;
  jvm_args?: string[];

  isolation_mode?: IsolationMode;

  width?: number;
  height?: number;
  fullscreen?: boolean;
  maximized?: boolean;
  vsync?: boolean;

  launcher_visible?: boolean;
  player_name?: string;
  server_address?: string;
  server_port?: number;
}

export interface GameInstance {
  id: string;
  name: string;
  version_id: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  path: string;
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
  game_settings?: GameSettings;
}

export interface InstanceFormData {
  name: string;
  version_id: string;
  loader_type: ModLoaderType;
  loader_version?: string;
  icon_path?: string;
}
