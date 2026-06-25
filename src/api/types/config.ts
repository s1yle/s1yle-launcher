/** 窗口位置和尺寸信息 */
export interface WindowPosition {
  /** 窗口左上角 X 坐标 */
  x: number;
  /** 窗口左上角 Y 坐标 */
  y: number;
  /** 窗口宽度 */
  width: number;
  /** 窗口高度 */
  height: number;
  /** 是否最大化 */
  maximized: boolean;
}

/** 应用全局配置 */
export interface AppConfig {
  /** 配置文件版本号 */
  version: number;
  /** Minecraft 基础路径 */
  base_path: string;
  /** 窗口位置 */
  window_position: WindowPosition;
  /** 用户偏好设置 */
  preferences: UserPreferences;
  /** 下载配置 */
  download: DownloadConfig;
  /** 路径配置 */
  path_config: PathConfig;
  /** 实例配置映射（instance_id -> InstanceConfig） */
  instance_configs: Record<string, InstanceConfig>;
}

/** 路径相关配置 */
export interface PathConfig {
  /** 守护进程（后台服务）基础路径 */
  daemon_base_path: string;
  /** 下载资源基础路径 */
  download_base_path: string;
}

/** 用户偏好设置 */
export interface UserPreferences {
  /** 主题模式 */
  theme: 'dark' | 'light' | 'system';
  /** 强调色 */
  accent_color: string;
  /** 界面语言 */
  language: 'zh-CN' | 'en-US';
  /** 是否启用动画 */
  enable_animation: boolean;
}

/** 下载相关配置 */
export interface DownloadConfig {
  /** 下载路径 */
  download_path: string;
  /** 并发下载数限制 */
  concurrent_limit: number;
  /** 是否自动校验文件完整性 */
  auto_verify: boolean;
}

/** 实例配置 */
export interface InstanceConfig {
  /** 实例 ID */
  id: string;
  /** 实例名称 */
  name: string;
  /** Minecraft 版本号 */
  version: string;
  /** 模组加载器类型 */
  loader_type: string;
  /** 模组加载器版本 */
  loader_version: string | null;
  /** Java 配置 */
  java: JavaConfig;
  /** 内存配置 */
  memory: MemoryConfig;
  /** 显卡/窗口配置 */
  graphics: GraphicsConfig;
  /** 自定义 JVM 参数 */
  custom_args: string[];
  /** 图标路径 */
  icon_path: string | null;
  /** 上次游玩时间戳 */
  last_played: number | null;
  /** 创建时间戳 */
  created_at: number;
  /** 是否启用 */
  enabled: boolean;
}

/** Java 运行环境配置 */
export interface JavaConfig {
  /** Java 可执行文件路径 */
  java_path: string | null;
  /** JVM 参数列表 */
  java_args: string[];
  /** 是否使用启动器自带的 Java */
  use_bundled: boolean;
}

/** 内存分配配置 */
export interface MemoryConfig {
  /** 最小内存（MB） */
  min_memory: number;
  /** 最大内存（MB） */
  max_memory: number;
}

/** 图形/窗口配置 */
export interface GraphicsConfig {
  /** 窗口宽度 */
  width: number;
  /** 窗口高度 */
  height: number;
  /** 是否全屏 */
  fullscreen: boolean;
}
