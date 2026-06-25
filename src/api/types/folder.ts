/** 已知的 Minecraft 文件夹路径 */
export interface KnownPath {
  /** 路径记录 ID */
  id: string;
  /** 自定义名称 */
  name: string;
  /** 文件夹绝对路径 */
  path: string;
  /** 是否为默认文件夹 */
  is_default: boolean;
}

/** 文件夹验证结果 */
export interface FolderValidationResult {
  /** 是否为有效的 Minecraft 文件夹 */
  is_valid: boolean;
  /** 验证的路径 */
  path: string;
  /** 建议的文件夹名称 */
  suggested_name: string;
  /** 检测到的实例列表 */
  instances: DetectedInstance[];
  /** 实例目录格式 */
  format: InstanceFormat;
  /** 兼容性评分（0-100） */
  compatibility_score: number;
  /** 警告信息列表 */
  warnings: string[];
}

/** 检测到的实例信息 */
export interface DetectedInstance {
  /** 实例名称 */
  name: string;
  /** Minecraft 版本号 */
  version: string;
  /** 版本目录名 */
  version_dir: string;
  /** 实例目录格式 */
  format: InstanceFormat;
}

/** 实例目录格式枚举 */
export enum InstanceFormat {
  /** 启动器原生格式 */
  Native = "Native",
  /** 标准 Minecraft 目录格式 */
  StandardMinecraft = "StandardMinecraft",
  /** 自定义目录格式 */
  Custom = "Custom",
  /** 无效目录 */
  Invalid = "Invalid",
}
