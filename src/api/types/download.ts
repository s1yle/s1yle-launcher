/** 游戏版本信息（对应 Rust download/models.rs GameVersion，camelCase 序列化） */
export interface GameVersion {
  /** 版本 ID */
  id: string;
  /** 版本类型：release / snapshot / old_beta / old_alpha（Rust 端 serde rename 为 "type"） */
  type: string;
  /** 版本清单 URL */
  url: string;
  /** 更新时间（ISO 8601） */
  time: string;
  /** 发布时间（ISO 8601） */
  releaseTime: string;
  /** 版本 JSON 的 SHA1（仅 v2 清单） */
  sha1: string | null;
  /** 合规等级（0/1，仅 v2 清单） */
  complianceLevel: number | null;
}

/** 最新版本号 */
export interface LatestVersion {
  /** 最新正式版 */
  release: string;
  /** 最新快照版 */
  snapshot: string;
}

/** 版本清单（Minecraft 官方版本列表） */
export interface VersionManifest {
  /** 最新版本号 */
  latest: LatestVersion;
  /** 所有可用版本 */
  versions: GameVersion[];
}

/** 下载任务信息 */
export interface DownloadTask {
  /** 任务 ID */
  id: string;
  /** 下载源 URL */
  url: string;
  /** 存储路径 */
  path: string;
  /** 文件名 */
  filename: string;
  /** 文件总大小（字节） */
  total_size: number;
  /** 已下载大小（字节） */
  downloaded_size: number;
  /** 任务状态 */
  status: string;
}

/** 下载进度信息 */
export interface DownloadProgress {
  /** 任务 ID */
  task_id: string;
  /** 已下载字节数 */
  downloaded: number;
  /** 总字节数 */
  total: number;
  /** 下载速度（字节/秒） */
  speed: number;
  /** 状态 */
  status: string;
}

/** 单个文件下载描述 */
export interface FileDownload {
  /** 下载 URL */
  url: string;
  /** SHA1 校验值 */
  sha1: string | null;
  /** 文件大小（字节） */
  size: number;
  /** 相对路径 */
  path: string;
}

/** 版本下载清单（包含所有需下载的文件） */
export interface VersionDownloadManifest {
  /** 版本 ID */
  version_id: string;
  /** 客户端 JAR 文件 */
  client_jar: FileDownload | null;
  /** 依赖库列表 */
  libraries: FileDownload[];
  /** 资源文件列表 */
  assets: FileDownload[];
  /** 本地库（natives）列表 */
  natives: FileDownload[];
  /** 资源索引文件 */
  asset_index: FileDownload | null;
}

/** 下载部署选项 */
export interface DownloadOptions {
  /** 游戏名称 */
  game_name: string;
  /** 版本 ID */
  version_id: string;
  /** 模组加载器类型 */
  loader_type: string;
  /** 模组加载器版本（可为 null 使用默认） */
  loader_version: string | null;
  /** 已存在的目标游戏 ID（覆盖时使用） */
  target_existing_game: string | null;
}

/** 部署结果 */
export interface DownloadResult {
  /** 是否成功 */
  success: boolean;
  /** 部署后的游戏 ID */
  game_id: string;
  /** 游戏名称 */
  game_name: string;
  /** Minecraft 版本 */
  version: string;
  /** 已部署文件数 */
  deployed_files_count: number;
  /** 总文件数 */
  total_files_count: number;
  /** 结果消息 */
  message: string;
}
