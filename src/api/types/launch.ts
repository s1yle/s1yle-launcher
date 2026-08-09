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
  /** 游戏目录路径（.minecraft 根目录） */
  game_dir: string;
  /** 资源文件目录路径 */
  assets_dir: string;
  /** 玩家名称 */
  username: string;
  /** 玩家 UUID */
  uuid: string;
  /** 访问令牌（在线模式必需） */
  access_token?: string;
  /** 主类名（模组加载器覆盖时传入） */
  main_class?: string;
  /** 版本类型（release/snapshot/fabric 等） */
  version_type?: string;
  /** 用户属性 JSON（--userProperties） */
  user_properties?: string;
  /** natives 解压目录（默认 {game_dir}/versions/{version}/natives） */
  natives_dir?: string;
  /** 账户类型（microsoft/offline/thirdparty） */
  account_type?: string;
  /** 附加 JVM 参数 */
  jvm_args?: string[];
  /** 附加游戏参数 */
  game_args?: string[];
  /** 窗口宽度（用于 ${resolution_width}） */
  resolution_width?: number;
  /** 窗口高度（用于 ${resolution_height}） */
  resolution_height?: number;
}
