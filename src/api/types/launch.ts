/** 游戏启动状态枚举 */
export enum LaunchStatus {
  /** 空闲 */
  Idle = "Idle",
  /** 启动中 */
  Launching = "Launching",
  /** 运行中 */
  Running = "Running",
  /** 已崩溃 */
  Crashed = "Crashed",
  /** 已停止 */
  Stopped = "Stopped",
}

/** 游戏启动配置 */
export interface LaunchConfig {
  /** Java 可执行文件路径 */
  java_path: string;
  /** 分配内存大小（MB） */
  memory_mb: number;
  /** Minecraft 版本号 */
  version: string;
  /** 游戏目录路径 */
  game_dir: string;
  /** 资源文件目录路径 */
  assets_dir: string;
  /** 玩家名称 */
  username: string;
  /** 玩家 UUID */
  uuid: string;
  /** 访问令牌（在线模式必需） */
  access_token?: string;
}
