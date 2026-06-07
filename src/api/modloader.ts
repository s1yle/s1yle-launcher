import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { ModLoaderType } from "./types/modloader";
import type { ModLoaderVersionList, FabricVersionDetail, ModLoaderInfo, CompatibilityCheck, InstallConfig } from "./types/modloader";

export const invokeGetFabricVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric 版本列表', { mcVersion });
  return await invokeRust("get_fabric_versions", { mcVersion }, options);
};

export const invokeGetFabricVersionDetail = async (
  mcVersion: string,
  loaderVersion: string,
  options?: InvokeOptions
): Promise<FabricVersionDetail> => {
  logger.info('获取 Fabric 版本详情', { mcVersion, loaderVersion });
  return await invokeRust("get_fabric_version_detail", { mcVersion, loaderVersion }, options);
};

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

export const invokeGetForgeVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Forge 版本列表', { mcVersion });
  return await invokeRust("get_forge_versions", { mcVersion }, options);
};

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

export const invokeGetInstalledModLoaders = async (
  versionId: string,
  options?: InvokeOptions
): Promise<ModLoaderType[]> => {
  logger.info('获取已安装的模组加载器', { versionId });
  return await invokeRust("get_installed_mod_loaders", { versionId }, options);
};

export const invokeGetQuiltVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Quilt 版本列表', { mcVersion });
  return await invokeRust("get_quilt_versions", { mcVersion }, options);
};

export const invokeGetFabricApiVersions = async (
  mcVersion: string,
  fabricVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 Fabric API 版本列表', { mcVersion, fabricVersion });
  return await invokeRust("get_fabric_api_versions", { mcVersion, fabricVersion }, options);
};

export const invokeGetQslVersions = async (
  mcVersion: string,
  quiltVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 QSL 版本列表', { mcVersion, quiltVersion });
  return await invokeRust("get_qsl_versions", { mcVersion, quiltVersion }, options);
};

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

export const invokeInstallWithLoaders = async (
  config: InstallConfig,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('安装实例及加载器', { config });
  return await invokeRust("install_with_loaders", { config }, options);
};
