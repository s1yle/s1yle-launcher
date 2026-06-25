import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { ModLoaderType } from "./types/modloader";
import type { ModLoaderVersionList, FabricVersionDetail, ModLoaderInfo, CompatibilityCheck, InstallConfig } from "./types/modloader";

/**
 * 获取指定 Minecraft 版本的 Fabric 版本列表
 * @param mcVersion Minecraft 版本号
 * @param options Tauri invoke 选项
 * @returns Fabric 版本列表
 */
export const invokeGetFabricVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric 版本列表', { mcVersion });
  return await invokeRust("get_fabric_versions", { mcVersion }, options);
};

/**
 * 获取 Fabric 版本详情
 * @param mcVersion Minecraft 版本号
 * @param loaderVersion Fabric 加载器版本号
 * @param options Tauri invoke 选项
 * @returns Fabric 版本详细数据
 */
export const invokeGetFabricVersionDetail = async (
  mcVersion: string,
  loaderVersion: string,
  options?: InvokeOptions
): Promise<FabricVersionDetail> => {
  logger.info('获取 Fabric 版本详情', { mcVersion, loaderVersion });
  return await invokeRust("get_fabric_version_detail", { mcVersion, loaderVersion }, options);
};

/**
 * 构建 Fabric 启动配置
 * @param mcVersion Minecraft 版本号
 * @param loaderVersion Fabric 加载器版本
 * @param gameDir 游戏目录
 * @param assetsDir 资源目录
 * @param username 玩家名称
 * @param uuid 玩家 UUID
 * @param accessToken 访问令牌（可选）
 * @param javaPath Java 路径（可选）
 * @param memoryMb 分配内存 MB（可选）
 * @param options Tauri invoke 选项
 * @returns 模组加载器信息（含主类、库列表等）
 */
export const invokeBuildFabricLaunchConfig = async (
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
  return await invokeRust("build_fabric_launch_config", {
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

/**
 * 获取指定 Minecraft 版本的 Forge 版本列表
 * @param mcVersion Minecraft 版本号
 * @param options Tauri invoke 选项
 * @returns Forge 版本列表
 */
export const invokeGetForgeVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Forge 版本列表', { mcVersion });
  return await invokeRust("get_forge_versions", { mcVersion }, options);
};

/**
 * 构建 Forge 启动配置
 * @param mcVersion Minecraft 版本号
 * @param forgeVersion Forge 版本号
 * @param gameDir 游戏目录
 * @param assetsDir 资源目录
 * @param username 玩家名称
 * @param uuid 玩家 UUID
 * @param accessToken 访问令牌（可选）
 * @param javaPath Java 路径（可选）
 * @param memoryMb 分配内存 MB（可选）
 * @param options Tauri invoke 选项
 * @returns 模组加载器信息（含主类、库列表等）
 */
export const invokeBuildForgeLaunchConfig = async (
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
  return await invokeRust("build_forge_launch_config", {
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

/**
 * 获取已安装的模组加载器
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 已安装的加载器类型列表
 */
export const invokeGetInstalledModLoaders = async (
  versionId: string,
  options?: InvokeOptions
): Promise<ModLoaderType[]> => {
  logger.info('获取已安装的模组加载器', { versionId });
  return await invokeRust("get_installed_mod_loaders", { versionId }, options);
};

/**
 * 获取指定 Minecraft 版本的 Quilt 版本列表
 * @param mcVersion Minecraft 版本号
 * @param options Tauri invoke 选项
 * @returns Quilt 版本列表
 */
export const invokeGetQuiltVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Quilt 版本列表', { mcVersion });
  return await invokeRust("get_quilt_versions", { mcVersion }, options);
};

/**
 * 获取指定 Fabric 版本的 Fabric API 版本列表
 * @param mcVersion Minecraft 版本号
 * @param fabricVersion Fabric 版本号
 * @param options Tauri invoke 选项
 * @returns Fabric API 版本列表
 */
export const invokeGetFabricApiVersions = async (
  mcVersion: string,
  fabricVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric API 版本列表', { mcVersion, fabricVersion });
  return await invokeRust("get_fabric_api_versions", { mcVersion, fabricVersion }, options);
};

/**
 * 获取指定 Quilt 版本的 QSL 版本列表
 * @param mcVersion Minecraft 版本号
 * @param quiltVersion Quilt 版本号
 * @param options Tauri invoke 选项
 * @returns QSL 版本列表
 */
export const invokeGetQslVersions = async (
  mcVersion: string,
  quiltVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 QSL 版本列表', { mcVersion, quiltVersion });
  return await invokeRust("get_qsl_versions", { mcVersion, quiltVersion }, options);
};

/**
 * 检查所有加载器兼容性
 * @param mcVersion Minecraft 版本号
 * @param installedLoaders 已安装的加载器列表
 * @param options Tauri invoke 选项
 * @returns 各加载器的兼容性检查结果
 */
export const invokeGetAllLoaderCompatibility = async (
  mcVersion: string,
  installedLoaders: ModLoaderType[],
  options?: InvokeOptions
): Promise<CompatibilityCheck[]> => {
  logger.info('检查所有加载器兼容性', { mcVersion, installedLoaders });
  return await invokeRust("get_all_loader_compatibility", {
    mc_version: mcVersion,
    installed_loaders: installedLoaders
  }, options);
};

/**
 * 安装实例及模组加载器
 * @param config 安装配置（含实例名、MC 版本、加载器列表）
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeInstallWithLoaders = async (
  config: InstallConfig,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('安装实例及加载器', { config });
  return await invokeRust("install_with_loaders", { config }, options);
};
