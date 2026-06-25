/** 模组加载器类型 */
export enum ModLoaderType {
  /** 原版（无加载器） */
  Vanilla = "Vanilla",
  /** Fabric */
  Fabric = "Fabric",
  /** Forge */
  Forge = "Forge",
  /** NeoForge */
  NeoForge = "NeoForge",
  /** Quilt */
  Quilt = "Quilt",
}

/** 库文件信息 */
export interface LibraryInfo {
  /** 库名称（Maven 坐标格式） */
  name: string;
  /** 下载 URL */
  url: string;
  /** SHA1 校验值 */
  sha1: string | null;
  /** 文件大小（字节） */
  size: number;
  /** 相对路径 */
  path: string;
}

/** 模组加载器构建信息 */
export interface ModLoaderInfo {
  /** 版本 ID */
  version_id: string;
  /** 模组加载器类型 */
  mod_loader_type: ModLoaderType;
  /** Minecraft 版本 */
  minecraft_version: string;
  /** 加载器版本号 */
  loader_version: string | null;
  /** 主类名 */
  main_class: string;
  /** 依赖库列表 */
  libraries: LibraryInfo[];
  /** 是否需要客户端 JAR */
  client_jar_required: boolean;
}

/** 模组加载器版本项 */
export interface ModLoaderVersionItem {
  /** 版本号 */
  version: string;
  /** 是否为稳定版 */
  stable: boolean;
  /** 下载 URL */
  url: string | null;
  /** SHA1 校验值 */
  sha1: string | null;
}

/** 模组加载器版本列表 */
export interface ModLoaderVersionList {
  /** 加载器类型 */
  mod_loader_type: ModLoaderType;
  /** Minecraft 版本 */
  minecraft_version: string;
  /** 可用版本列表 */
  versions: ModLoaderVersionItem[];
}

/** Fabric 版本详情 */
export interface FabricVersionDetail {
  /** 版本 ID */
  id: string;
  /** 继承自哪个版本 ID */
  inherits_from: string | null;
  /** JAR 文件路径 */
  jar: string | null;
  /** 主类信息 */
  main_class: {
    /** 客户端主类 */
    client: string;
  };
  /** 启动参数 */
  arguments: {
    /** 游戏参数 */
    game: any[];
    /** JVM 参数 */
    jvm: any[];
  };
  /** 依赖库列表 */
  libraries: Array<{
    /** 库名称 */
    name: string;
    /** 下载 URL */
    url: string | null;
    /** SHA1 校验值 */
    sha1: string | null;
    /** 文件大小 */
    size: number | null;
    /** 相对路径 */
    path: string | null;
  }>;
}

/** 扩展模组加载器类型（const enum） */
export const enum ExtendedModLoaderType {
  /** OptiFine 优化模组 */
  OptiFine = "OptiFine",
  /** Quilt 加载器 */
  Quilt = "Quilt",
  /** Fabric API */
  FabricApi = "FabricApi",
  /** Quilt Standard Libraries */
  QSL = "QSL",
}

/** OptiFine 版本信息 */
export interface OptiFineVersion {
  /** Minecraft 版本 */
  mcVersion: string;
  /** OptiFine 补丁版本 */
  patch: string;
  /** 版本类型 */
  type: string;
  /** 发布日期 */
  date: string;
  /** 下载 URL */
  downloadUrl: string;
}

/** Quilt 加载器版本信息 */
export interface QuiltVersion {
  /** 加载器信息 */
  loader: {
    /** 版本号 */
    version: string;
    /** 是否稳定 */
    stable: boolean;
  };
  /** 兼容的 Minecraft 版本列表 */
  game: string[];
}

/** Fabric API 版本信息 */
export interface FabricApiVersion {
  /** 加载器版本 */
  loader: string;
  /** 兼容的 Minecraft 版本列表 */
  game: string[];
  /** 各版本详情 */
  versions: {
    [version: string]: {
      /** 版本号 */
      version: string;
      /** 是否稳定 */
      stable: boolean;
    };
  };
}

/** 加载器兼容性检查结果 */
export interface CompatibilityCheck {
  /** 加载器类型 */
  loader_type: string;
  /** Minecraft 版本 */
  mc_version: string;
  /** 是否兼容 */
  is_compatible: boolean;
  /** 不兼容原因 */
  reason: string | null;
  /** 可用版本列表 */
  available_versions: string[];
  /** 警告信息 */
  warning: string | null;
}

/** 安装配置（实例 + 加载器） */
export interface InstallConfig {
  /** 实例名称 */
  instance_name: string;
  /** Minecraft 版本 */
  mc_version: string;
  /** 要安装的加载器列表 */
  loaders: LoaderInstallConfig[];
}

/** 单个加载器安装配置 */
export interface LoaderInstallConfig {
  /** 加载器类型 */
  loader_type: string;
  /** 加载器版本（null 表示自动选择） */
  loader_version: string | null;
  /** 是否安装 */
  install: boolean;
}
