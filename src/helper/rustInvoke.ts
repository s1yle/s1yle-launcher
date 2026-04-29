import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { logger } from "./logger";

// ======================== 账户相关类型定义 ========================

/**
 * 账户类型枚举（与Rust后端保持一致）
 */
export enum AccountType {
  Microsoft = "microsoft",
  Offline = "offline"
}

/**
 * 账户信息接口（与Rust后端保持一致）
 */
export interface AccountInfo {
  name: string;
  account_type: AccountType;
  uuid: string;
  create_time: string;
  last_login_time: string | null;
}

/**
 * 账户接口（包含敏感信息，仅后端使用）
 */
export interface Account {
  info: AccountInfo;
  access_token: string | null;
  refresh_token: string | null;
}

// ======================== 启动相关类型定义 ========================

/**
 * 启动状态枚举（与Rust后端保持一致）
 */
export enum LaunchStatus {
  Idle = "Idle",           // 未启动
  Launching = "Launching", // 启动中
  Running = "Running",     // 运行中
  Crashed = "Crashed",     // 崩溃
  Stopped = "Stopped",     // 已停止
}

/**
 * 启动配置接口（与Rust后端保持一致）
 */
export interface LaunchConfig {
  java_path: string;           // Java可执行文件路径
  memory_mb: number;           // 内存大小（MB）
  version: string;             // Minecraft版本
  game_dir: string;            // 游戏目录
  assets_dir: string;          // 资源目录
  username: string;            // 用户名
  uuid: string;                // 用户UUID
  access_token?: string;       // 访问令牌（微软账户）
}

/**
 * 调用Rust函数的通用工具函数
 * @param fnName Rust函数名
 * @param args 传给Rust的参数（可选）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust函数的返回值
 */
export const invokeRustFunction = async (
  fnName: string,
  args: InvokeArgs = {}, // 默认空对象，避免传undefined
  options?: InvokeOptions // 可选参数，符合Tauri原生设计
): Promise<any> => {
  try {
    // 1. 校验函数名
    const trimmedFnName = fnName.trim();
    if (trimmedFnName.length === 0) {
      throw new Error("Rust函数名不能为空！");
    }

    console.debug('调用Tauri的invoke');
    
    // 2. 调用Tauri的invoke，返回Promise
    const result = await invoke(trimmedFnName, args, options);
    return result;
  } catch (e) {
    console.error('错误，抛出自定义错误对象');

    let errorMsg: string;
    if (e instanceof Error) {
        errorMsg = e.message;
    } else if (typeof e === 'string') {
        errorMsg = e;
    } else if (e && typeof e === 'object') {
        errorMsg = JSON.stringify(e);
    } else {
        errorMsg = String(e);
    }

    // 统一错误处理，抛出自定义错误对象
    // const errorMsg = e instanceof Error ? e.message : " [未知错误] 调用Rust函数失败";
    // console.error(`[Rust调用失败] ${fnName}:`, errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * 添加账户的专用函数（业务逻辑封装）
 * @param accountName 账户名称（1-16字）
 * @param accountType 账户类型（离线或微软）
 * @param accountArgs 账户相关参数（传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeAddAccount = async (
  accountName: string,
  accountType: string,
  accessToken?: string,
  refreshToken?: string,
  options?: InvokeOptions
): Promise<string> => {
  const trimmedName = accountName.trim();
  if (trimmedName.length <= 0 || trimmedName.length > 16) {
    throw new Error("账户名称必须控制在1-16字之间且不能为空！");
  }

  const args: InvokeArgs = {
    name: trimmedName,
    accountType: accountType,
  };

  if (accountType === "microsoft") {
    if (!accessToken || !refreshToken) {
      throw new Error("微软账户必须提供完整的 Token");
    }
    args.access_token = accessToken;
    args.refresh_token = refreshToken;
  }

  logger.info('准备调用 add_account', args);

  return await invokeRustFunction("add_account", args, options);
};

/**
 * 获取账户列表
 * @param options invoke配置（可选）
 * @returns Promise<AccountInfo[]> 账户信息列表
 */
export const getAccountList = async (
  options?: InvokeOptions
): Promise<AccountInfo[]> => {
  logger.info('准备调用 get_account_list');
  const result = await invokeRustFunction("get_account_list", {}, options);
  return result as AccountInfo[];
};

/**
 * 获取当前账户
 * @param options invoke配置（可选）
 * @returns Promise<AccountInfo | null> 当前账户信息，如果没有则为null
 */
export const getCurrentAccount = async (
  options?: InvokeOptions
): Promise<AccountInfo | null> => {
  logger.info('准备调用 get_current_account');
  const result = await invokeRustFunction("get_current_account", {}, options);
  return result as AccountInfo | null;
};

/**
 * 删除账户
 * @param uuid 账户UUID
 * @param options invoke配置（可选）
 * @returns Promise<string> 删除结果消息
 */
export const deleteAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 delete_account', { uuid });
  return await invokeRustFunction("delete_account", { uuid }, options);
};

/**
 * 设为当前账户
 * @param uuid 账户UUID
 * @param options invoke配置（可选）
 * @returns Promise<string> 设置结果消息
 */
export const setCurrentAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 set_current_account', { uuid });
  return await invokeRustFunction("set_current_account", { uuid }, options);
};

/**
 * 保存账户到磁盘
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeSaveAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 save_accounts_to_disk', args);
  return await invokeRustFunction("save_accounts_to_disk", args, options);
};

/**
 * 从磁盘加载账户
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeLoadAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 load_accounts_from_disk', args);
  return await invokeRustFunction("load_accounts_from_disk", args, options);
};

/**
 * 初始化账户系统
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeAccInit = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 initialize_account_system', args);
  return await invokeRustFunction("initialize_account_system", args, options);
};

// ======================== 启动相关函数 ========================

/**
 * 启动Minecraft实例
 * @param config 可选的启动配置（如不提供则使用默认配置）
 * @param options invoke配置（可选）
 * @returns Promise<string> 启动结果消息
 */
export const launchInstance = async (
  config?: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('启动Minecraft实例，配置:', config);
    
    const result = await invokeRustFunction("tauri_launch_instance", {
      config: config || null,
    }, options);
    
    console.log('启动结果:', result);
    return result;
  } catch (e) {
    console.error('启动失败:', e);
    throw new Error(e instanceof Error ? e.message : "启动Minecraft失败");
  }
};

/**
 * 停止Minecraft实例
 * @param options invoke配置（可选）
 * @returns Promise<string> 停止结果消息
 */
export const stopInstance = async (
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('停止Minecraft实例');
    
    const result = await invokeRustFunction("tauri_stop_instance", {}, options);
    
    console.log('停止结果:', result);
    return result;
  } catch (e) {
    console.error('停止失败:', e);
    throw new Error(e instanceof Error ? e.message : "停止Minecraft失败");
  }
};

/**
 * 获取当前启动状态
 * @param options invoke配置（可选）
 * @returns Promise<LaunchStatus> 启动状态
 */
export const getLaunchStatus = async (
  options?: InvokeOptions
): Promise<LaunchStatus> => {
  try {
    const result = await invokeRustFunction("tauri_get_launch_status", {}, options);
    
    // 将字符串转换为枚举
    switch (result) {
      case "Idle":
      case "Launching":
      case "Running":
      case "Crashed":
      case "Stopped":
        return result as LaunchStatus;
      default:
        console.warn(`未知的启动状态: ${result}，返回Idle`);
        return LaunchStatus.Idle;
    }
  } catch (e) {
    console.error('获取启动状态失败:', e);
    return LaunchStatus.Idle; // 默认返回空闲状态
  }
};

/**
 * 获取当前启动配置
 * @param options invoke配置（可选）
 * @returns Promise<LaunchConfig> 启动配置
 */
export const getLaunchConfig = async (
  options?: InvokeOptions
): Promise<LaunchConfig> => {
  try {
    const result = await invokeRustFunction("tauri_get_launch_config", {}, options);
    
    // 验证返回的配置结构
    if (typeof result !== 'object' || result === null) {
      throw new Error("无效的启动配置格式");
    }
    
    return result as LaunchConfig;
  } catch (e) {
    console.error('获取启动配置失败:', e);
    
    // 返回默认配置
    return {
      java_path: "java",
      memory_mb: 2048,
      version: "1.20.4",
      game_dir: "./.minecraft",
      assets_dir: "./.minecraft/assets",
      username: "Steve",
      uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    };
  }
};

/**
 * 更新启动配置
 * @param config 新的启动配置
 * @param options invoke配置（可选）
 * @returns Promise<string> 更新结果消息
 */
export const updateLaunchConfig = async (
  config: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('更新启动配置:', config);
    
    // 验证配置
    if (!config.java_path || !config.version || !config.username) {
      throw new Error("Java路径、版本和用户名不能为空");
    }
    
    const result = await invokeRustFunction("tauri_update_launch_config", {
      config,
    }, options);
    
    console.log('更新结果:', result);
    return result;
  } catch (e) {
    console.error('更新启动配置失败:', e);
    throw new Error(e instanceof Error ? e.message : "更新启动配置失败");
  }
};

/**
 * 关闭window
 * @returns Promise<string> 调用rust tauri_close_window消息
 */
export const closeWindow = async (
): Promise<string> => {
  try {
    console.log('调用rust tauri_close_window:');

    const result = await invokeRustFunction("tauri_close_window");
    
    console.log("调用rust tauri_close_window 结果: ", result);

    return result;
  } catch (e) {
    console.error('调用rust [tauri_close_window] 失败:', e);
    throw new Error(e instanceof Error ? e.message : "调用rust [tauri_close_window] 失败");
  }
};

/**
 * 日志
 * @param args 传递 level 和 message
 * @param options invoke配置（可选）
 * @returns Promise<any> 调用 invokeLogger
 */
export const invokeLogger = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  try {
    console.log('调用 invokeLogger:');

    const result = await invokeRustFunction("log_frontend",args, options);
    
    console.log("调用 invokeLogger 结果: ", result);

    return result;
  } catch (e) {
    console.error('调用 [invokeLogger] 失败:', e);
    throw new Error(e instanceof Error ? e.message : "调用 [invokeLogger] 失败");
  }
};

// ======================== 下载相关类型定义 ========================

export interface GameVersion {
  id: string;
  name: string;
  type_: string;
  release_time: string;
  url: string;
}

export interface LatestVersion {
  release: string;
  snapshot: string;
}

export interface VersionManifest {
  latest: LatestVersion;
  versions: GameVersion[];
}

export interface DownloadTask {
  id: string;
  url: string;
  path: string;
  filename: string;
  total_size: number;
  downloaded_size: number;
  status: string;
}

export interface DownloadProgress {
  task_id: string;
  downloaded: number;
  total: number;
  speed: number;
  status: string;
}

export interface FileDownload {
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}

export interface VersionDownloadManifest {
  version_id: string;
  client_jar: FileDownload | null;
  libraries: FileDownload[];
  assets: FileDownload[];
  natives: FileDownload[];
  asset_index: FileDownload | null;
}

// ======================== 下载相关函数 ========================

export const getVersionManifest = async (
  options?: InvokeOptions
): Promise<VersionManifest> => {
  logger.info('获取游戏版本列表');
  return await invokeRustFunction("get_version_manifest", {}, options);
};

export const getVersionDetail = async (
  versionId: string,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('获取版本详情', { versionId });
  return await invokeRustFunction("get_version_detail", { versionId }, options);
};

export const getVersionDownloadManifest = async (
  versionId: string,
  options?: InvokeOptions
): Promise<VersionDownloadManifest> => {
  logger.info('获取版本下载清单', { versionId });
  return await invokeRustFunction("get_version_download_manifest", { versionId }, options);
};

export const downloadFile = async (
  url: string,
  filename: string,
  sha1?: string,
  skipVerify?: boolean,
  totalSize?: number,
  options?: InvokeOptions
): Promise<DownloadProgress> => {
  logger.info('开始下载文件', { url, filename, sha1, skipVerify, totalSize });
  return await invokeRustFunction("download_file", { url, filename, sha1, skip_verify: skipVerify, total_size: totalSize }, options);
};

export const getDownloadTasks = async (
  options?: InvokeOptions
): Promise<DownloadTask[]> => {
  logger.info('获取下载任务列表');
  return await invokeRustFunction("get_download_tasks", {}, options);
};

export const getDownloadTask = async (
  taskId: string,
  options?: InvokeOptions
): Promise<DownloadTask | null> => {
  logger.info('获取下载任务', { taskId });
  return await invokeRustFunction("get_download_task", { taskId }, options);
};

export const cancelDownload = async (
  taskId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('取消下载任务', { taskId });
  return await invokeRustFunction("cancel_download", { taskId }, options);
};

export const clearCompletedTasks = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('清理已完成任务');
  return await invokeRustFunction("clear_completed_tasks", {}, options);
};

export const getGameVersions = async (
  options?: InvokeOptions
): Promise<string[]> => {
  logger.info('获取已安装游戏版本');
  return await invokeRustFunction("get_game_versions", {}, options);
};

export const getDownloadBasePath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取下载目录路径');
  return await invokeRustFunction("get_download_base_path", {}, options);
};

export const setDownloadBasePath = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('设置下载目录路径', { path });
  return await invokeRustFunction("set_download_base_path", { path }, options);
};

export const deployVersionFiles = async (
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本文件', { versionId });
  return await invokeRustFunction("deploy_version_files", { versionId }, options);
};

export const deployVersionToInstance = async (
  instancePath: string,
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本到实例', { instancePath, versionId });
  return await invokeRustFunction("deploy_version_to_instance", { instance_path: instancePath, version_id: versionId }, options);
};

export const isVersionDeployed = async (
  versionId: string,
  options?: InvokeOptions
): Promise<boolean> => {
  logger.info('检查版本是否已部署', { versionId });
  return await invokeRustFunction("is_version_deployed", { versionId }, options);
};

// ======================== 模组加载器相关类型定义 ========================

export enum ModLoaderType {
  Vanilla = "Vanilla",
  Fabric = "Fabric",
  Forge = "Forge",
  NeoForge = "NeoForge",
}

export interface LibraryInfo {
  name: string;
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}

export interface ModLoaderInfo {
  version_id: string;
  mod_loader_type: ModLoaderType;
  minecraft_version: string;
  loader_version: string | null;
  main_class: string;
  libraries: LibraryInfo[];
  client_jar_required: boolean;
}

export interface ModLoaderVersionItem {
  version: string;
  stable: boolean;
  url: string | null;
  sha1: string | null;
}

export interface ModLoaderVersionList {
  mod_loader_type: ModLoaderType;
  minecraft_version: string;
  versions: ModLoaderVersionItem[];
}

export interface FabricVersionDetail {
  id: string;
  inherits_from: string | null;
  jar: string | null;
  main_class: {
    client: string;
  };
  arguments: {
    game: any[];
    jvm: any[];
  };
  libraries: Array<{
    name: string;
    url: string | null;
    sha1: string | null;
    size: number | null;
    path: string | null;
  }>;
}

// ======================== 模组加载器相关函数 ========================

export const getFabricVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric 版本列表', { mcVersion });
  return await invokeRustFunction("get_fabric_versions", { mcVersion }, options);
};

export const getFabricVersionDetail = async (
  mcVersion: string,
  loaderVersion: string,
  options?: InvokeOptions
): Promise<FabricVersionDetail> => {
  logger.info('获取 Fabric 版本详情', { mcVersion, loaderVersion });
  return await invokeRustFunction("get_fabric_version_detail", { mcVersion, loaderVersion }, options);
};

export const buildFabricLaunchConfig = async (
  mcVersion: string,
  loaderVersion: string,
  gameDir: string,
  assetsDir: string,
  username: string,
  uuid: string,
  accessToken?: string,
  javaPath?: string,
  memoryMb?: number,
  options?: InvokeOptions
): Promise<ModLoaderInfo> => {
  logger.info('构建 Fabric 启动配置', { mcVersion, loaderVersion });
  return await invokeRustFunction("build_fabric_launch_config", {
    mc_version: mcVersion,
    loader_version: loaderVersion,
    game_dir: gameDir,
    assets_dir: assetsDir,
    username,
    uuid,
    access_token: accessToken,
    java_path: javaPath,
    memory_mb: memoryMb,
  }, options);
};

export const getForgeVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Forge 版本列表', { mcVersion });
  return await invokeRustFunction("get_forge_versions", { mcVersion }, options);
};

export const buildForgeLaunchConfig = async (
  mcVersion: string,
  forgeVersion: string,
  gameDir: string,
  assetsDir: string,
  username: string,
  uuid: string,
  accessToken?: string,
  javaPath?: string,
  memoryMb?: number,
  options?: InvokeOptions
): Promise<ModLoaderInfo> => {
  logger.info('构建 Forge 启动配置', { mcVersion, forgeVersion });
  return await invokeRustFunction("build_forge_launch_config", {
    mc_version: mcVersion,
    forge_version: forgeVersion,
    game_dir: gameDir,
    assets_dir: assetsDir,
    username,
    uuid,
    access_token: accessToken,
    java_path: javaPath,
    memory_mb: memoryMb,
  }, options);
};

export const getInstalledModLoaders = async (
  versionId: string,
  options?: InvokeOptions
): Promise<ModLoaderType[]> => {
  logger.info('获取已安装的模组加载器', { versionId });
  return await invokeRustFunction("get_installed_mod_loaders", { versionId }, options);
};

// ======================== 扩展模组加载器类型定义 ========================

export const enum ExtendedModLoaderType {
  OptiFine = "OptiFine",
  Quilt = "Quilt",
  FabricApi = "FabricApi",
  QSL = "QSL",
}

export interface OptiFineVersion {
  mcVersion: string;
  patch: string;
  type: string;
  date: string;
  downloadUrl: string;
}

export interface QuiltVersion {
  loader: {
    version: string;
    stable: boolean;
  };
  game: string[];
}

export interface FabricApiVersion {
  loader: string;
  game: string[];
  versions: {
    [version: string]: {
      version: string;
      stable: boolean;
    };
  };
}

export interface CompatibilityCheck {
  loader_type: string;
  mc_version: string;
  is_compatible: boolean;
  reason: string | null;
  available_versions: string[];
  warning: string | null;
}

export interface InstallConfig {
  instance_name: string;
  mc_version: string;
  loaders: LoaderInstallConfig[];
}

export interface LoaderInstallConfig {
  loader_type: string;
  loader_version: string | null;
  install: boolean;
}

// ======================== 扩展模组加载器函数 ========================

export const getQuiltVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Quilt 版本列表', { mcVersion });
  return await invokeRustFunction("get_quilt_versions", { mcVersion }, options);
};

export const getFabricApiVersions = async (
  mcVersion: string,
  fabricVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric API 版本列表', { mcVersion, fabricVersion });
  return await invokeRustFunction("get_fabric_api_versions", { mcVersion, fabricVersion }, options);
};

export const getQslVersions = async (
  mcVersion: string,
  quiltVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 QSL 版本列表', { mcVersion, quiltVersion });
  return await invokeRustFunction("get_qsl_versions", { mcVersion, quiltVersion }, options);
};

export const getAllLoaderCompatibility = async (
  mcVersion: string,
  installedLoaders: ModLoaderType[],
  options?: InvokeOptions
): Promise<CompatibilityCheck[]> => {
  logger.info('检查所有加载器兼容性', { mcVersion, installedLoaders });
  return await invokeRustFunction("get_all_loader_compatibility", {
    mc_version: mcVersion,
    installed_loaders: installedLoaders
  }, options);
};

export const installWithLoaders = async (
  config: InstallConfig,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('安装实例及加载器', { config });
  return await invokeRustFunction("install_with_loaders", { config }, options);
};

// ======================== 实例管理相关类型定义 ========================

export interface GameInstance {
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  path: string;
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}

export interface InstanceFormData {
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version?: string;
  icon_path?: string;
}

// ======================== 实例管理相关函数 ========================

export const scanInstances = async (
  options?: InvokeOptions
): Promise<GameInstance[]> => {
  logger.info('扫描实例列表');
  return await invokeRustFunction("scan_instances", {}, options);
};

export const getInstance = async (
  id: string,
  options?: InvokeOptions
): Promise<GameInstance | null> => {
  logger.info('获取实例详情', { id });
  return await invokeRustFunction("get_instance", { id }, options);
};

export const createInstance = async (
  name: string,
  version: string,
  loaderType: ModLoaderType,
  loaderVersion?: string,
  iconPath?: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('创建实例', { name, version, loaderType });
  return await invokeRustFunction("create_instance", {
    name,
    version,
    loader_type: loaderType,
    loader_version: loaderVersion,
    icon_path: iconPath,
  }, options);
};

export const deleteInstance = async (
  id: string,
  deleteFiles: boolean = false,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例', { id, deleteFiles });
  return await invokeRustFunction("delete_instance", { id, delete_files: deleteFiles }, options);
};

export const copyInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('复制实例', { id, newName });
  return await invokeRustFunction("copy_instance", { id, new_name: newName }, options);
};

export const renameInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('重命名实例', { id, newName });
  return await invokeRustFunction("rename_instance", { id, new_name: newName }, options);
};

export const updateInstance = async (
  id: string,
  name?: string,
  enabled?: boolean,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('更新实例', { id, name, enabled });
  return await invokeRustFunction("update_instance", { id, name, enabled }, options);
};

export const getInstancesPath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取实例目录路径');
  return await invokeRustFunction("get_instances_path", {}, options);
};

export const openFolder = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('打开文件夹', { path });
  return await invokeRustFunction("open_folder", { path }, options);
};
export const openUrl = async (
  url: string,
  options?: InvokeOptions,
): Promise<string> => {
  return await invokeRustFunction("open_url", { url }, options);
};

export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

export const saveWindowPosition = async (
  x: number,
  y: number,
  width: number,
  height: number,
  maximized: boolean,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('保存窗口位置', { x, y, width, height, maximized });
  await invokeRustFunction("save_window_position", { x, y, width, height, maximized }, options);
};

export const loadWindowPosition = async (
  options?: InvokeOptions
): Promise<WindowPosition | null> => {
  logger.info('加载窗口位置');
  return await invokeRustFunction("load_window_position", {}, options);
};

export interface KnownPath {
  id: string;
  name: string;
  path: string;
  is_default: boolean;
}

export const scanKnownMcPaths = async (
  options?: InvokeOptions,
): Promise<KnownPath[]> => {
  return await invokeRustFunction("scan_known_mc_paths", {}, options);
};

export const addKnownPath = async (
  path: string,
  options?: InvokeOptions,
): Promise<KnownPath> => {
  return await invokeRustFunction("add_known_path", { path }, options);
};

// ======================== 配置相关类型定义 ========================

export interface AppConfig {
  version: number;
  base_path: string;
  window_position: WindowPosition;
  preferences: UserPreferences;
  download: DownloadConfig;
  instance_configs: Record<string, InstanceConfig>;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  accent_color: string;
  language: 'zh-CN' | 'en-US';
  enable_animation: boolean;
}

export interface DownloadConfig {
  download_path: string;
  concurrent_limit: number;
  auto_verify: boolean;
}

export interface InstanceConfig {
  id: string;
  name: string;
  version: string;
  loader_type: ModLoaderType;
  loader_version: string | null;
  java: JavaConfig;
  memory: MemoryConfig;
  graphics: GraphicsConfig;
  custom_args: string[];
  icon_path: string | null;
  last_played: number | null;
  created_at: number;
  enabled: boolean;
}

export interface JavaConfig {
  java_path: string | null;
  java_args: string[];
  use_bundled: boolean;
}

export interface MemoryConfig {
  min_memory: number;
  max_memory: number;
}

export interface GraphicsConfig {
  width: number;
  height: number;
  fullscreen: boolean;
}

// ======================== 配置相关函数 ========================

/**
 * 获取全局配置
 */
export const getConfig = async (
  options?: InvokeOptions
): Promise<AppConfig> => {
  logger.info('获取全局配置');
  return await invokeRustFunction("config::get_config", {}, options);
};

/**
 * 更新全局配置
 */
export const updateConfig = async (
  newConfig: AppConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新全局配置', newConfig);
  return await invokeRustFunction("config::update_config", { new_config: newConfig }, options);
};

/**
 * 动态获取配置值
 * @param key 配置键路径，如 'preferences.theme'
 */
export const getConfigValue = async (
  key: string,
  options?: InvokeOptions
): Promise<string | null> => {
  logger.info('获取配置值', { key });
  return await invokeRustFunction("get_config_value", { key }, options);
};

/**
 * 动态设置配置值
 * @param key 配置键路径
 * @param value 配置值
 */
export const setConfigValue = async <T>(
  key: string,
  value: T,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('设置配置值', { key, value });
  return await invokeRustFunction("set_config_value", { key, value }, options);
};

/**
 * 获取实例配置
 */
export const getInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<InstanceConfig | null> => {
  logger.info('获取实例配置', { instanceId });
  return await invokeRustFunction("get_instance_config", { instance_id: instanceId }, options);
};

/**
 * 更新实例配置
 */
export const updateInstanceConfig = async (
  instanceId: string,
  config: InstanceConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新实例配置', { instanceId, config });
  return await invokeRustFunction("update_instance_config", {
    instance_id: instanceId,
    config,
  }, options);
};

/**
 * 删除实例配置
 */
export const removeInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例配置', { instanceId });
  return await invokeRustFunction("remove_instance_config", { instance_id: instanceId }, options);
};

/**
 * 重置配置到默认值
 */
export const resetConfig = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('重置配置到默认值');
  return await invokeRustFunction("reset_config", {}, options);
};

/**
 * 导出配置到文件
 */
export const exportConfig = async (
  targetPath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导出配置', { targetPath });
  return await invokeRustFunction("export_config", { target_path: targetPath }, options);
};

/**
 * 从文件导入配置
 */
export const importConfig = async (
  sourcePath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导入配置', { sourcePath });
  return await invokeRustFunction("import_config", { source_path: sourcePath }, options);
};
