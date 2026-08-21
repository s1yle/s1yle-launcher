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

/** 运行中游戏会话的快照信息 */
export interface LaunchGameInfo {
  /** 游戏会话唯一标识（UUID，每次启动生成） */
  game_id: string;
  /** 游戏目录（.minecraft 根目录） */
  game_dir: string;
  /** 启动状态 */
  status: LaunchStatus;
  /** 子进程 PID（未启动为 null） */
  pid: number | null;
  /** Minecraft 版本 */
  version: string;
  /** 用户名 */
  username: string;
  /** 最近一次错误信息 */
  last_error: string | null;
  /** 真实进度（0-100） */
  progress: number;
  /** 当前阶段文案 */
  stage: string;
}

/** 游戏日志等级 */
export type GameLogLevel = 'info' | 'warn' | 'error' | 'fatal';

/** 单条游戏日志行 */
export interface GameLogLine {
  /** 日志等级 */
  level: GameLogLevel;
  /** 日志文本 */
  text: string;
}

/** 日志增量拉取结果 */
export interface GameLogResult {
  /** 下次拉取的游标位置 */
  offset: number;
  /** 本段日志行 */
  lines: GameLogLine[];
}

/** 指定游戏会话的状态 + 进度快照 */
export interface LaunchStatusInfo {
  /** 启动状态 */
  status: LaunchStatus;
  /** 真实进度（0-100） */
  progress: number;
  /** 当前阶段文案 */
  stage: string;
  /** 最近一次错误信息 */
  last_error?: string | null;
  /** 崩溃原因摘要（崩溃时生成） */
  crash_summary?: string | null;
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
  /** 是否全屏启动游戏（追加 --fullscreen） */
  fullscreen?: boolean;
  /** 启动游戏后启动器窗口是否保持可见（false 时启动后隐藏，游戏退出后恢复） */
  launcher_visible?: boolean;
}
