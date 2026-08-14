import { ModLoaderType } from "./modloader";

/** 隔离模式 */
export enum IsolationMode {
  /** 全局共享 */
  Global = 'global',
  /** 按版本隔离 */
  Version = 'version',
  /** 按实例完全隔离 */
  Instance = 'instance',
}

/** 游戏实例设置 */
export interface GameSettings {
  /** 是否使用实例级设置（覆盖全局） */
  use_instance_settings?: boolean;
  /** Java 路径 */
  java_path?: string;
  /** Java 版本 */
  java_version?: string;
  /** 最小内存（MB） */
  min_memory?: number;
  /** 最大内存（MB） */
  max_memory?: number;
  /** JVM 参数 */
  jvm_args?: string[];
  /** 隔离模式 */
  isolation_mode?: IsolationMode;
  /** 窗口宽度 */
  width?: number;
  /** 窗口高度 */
  height?: number;
  /** 是否全屏 */
  fullscreen?: boolean;
  /** 是否最大化 */
  maximized?: boolean;
  /** 是否启用垂直同步 */
  vsync?: boolean;
  /** 启动时是否显示启动器 */
  launcher_visible?: boolean;
  /** 玩家名称 */
  player_name?: string;
  /** 自动连接服务器地址 */
  server_address?: string;
  /** 自动连接服务器端口 */
  server_port?: number;
}

/** 游戏实例信息 */
export interface Game {
  /** 实例 ID */
  id: string;
  /** 实例名称 */
  name: string;
  /** Minecraft 版本 ID */
  version_id: string;
  /** 模组加载器类型 */
  loader_type: ModLoaderType;
  /** 模组加载器版本 */
  loader_version: string | null;
  /** 实例路径 */
  path: string;
  /** 图标路径 */
  icon_path: string | null;
  /** 上次游玩时间戳 */
  last_played: number | null;
  /** 创建时间戳 */
  created_at: number;
  /** 是否启用 */
  enabled: boolean;
  /** 版本是否损坏（扫描时计算：目录内缺失对应 jar 产物） */
  broken: boolean;
  /** 是否空壳（扫描时计算：目录内除记录外无任何文件，未下载的"空壳"实例） */
  empty: boolean;
  /** 实例级游戏设置 */
  game_settings?: GameSettings;
}

/** 实例创建表单数据 */
export interface InstanceFormData {
  /** 实例名称 */
  name: string;
  /** Minecraft 版本 ID */
  version_id: string;
  /** 模组加载器类型 */
  loader_type: ModLoaderType;
  /** 模组加载器版本（可选） */
  loader_version?: string;
  /** 图标路径（可选） */
  icon_path?: string;
}

/** 单文件完整性校验结果 */
export interface FileCheck {
  /** 分类：client / library / native / index / asset */
  category: string;
  /** 相对路径 */
  path: string;
  /** 状态：ok / missing / corrupt */
  status: string;
  /** 期望 SHA1 */
  expected_sha1: string | null;
  /** 期望大小 */
  expected_size: number | null;
  /** 实际大小（缺失时为 null） */
  actual_size: number | null;
}

/** 实例完整性校验报告 */
export interface GameValidation {
  /** 是否完整可启动（无缺失/损坏） */
  valid: boolean;
  /** 目录是否为空壳（除 .wecraft 记录文件外无任何文件，即未下载的"空壳"实例） */
  empty: boolean;
  game_name: string;
  version_id: string;
  /** 已检查文件数 / 通过 / 缺失 / 损坏 */
  checked: number;
  ok: number;
  missing: number;
  corrupt: number;
  /** 失败项明细（仅缺失/损坏） */
  failed: FileCheck[];
}
