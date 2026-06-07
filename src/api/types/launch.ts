export enum LaunchStatus {
  Idle = "Idle",
  Launching = "Launching",
  Running = "Running",
  Crashed = "Crashed",
  Stopped = "Stopped",
}

export interface LaunchConfig {
  java_path: string;
  memory_mb: number;
  version: string;
  game_dir: string;
  assets_dir: string;
  username: string;
  uuid: string;
  access_token?: string;
}
