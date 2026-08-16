import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { ModLoaderVersionList, ModLoaderInfo } from "./types/modloader";

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
 * 获取指定 Minecraft 版本的 NeoForge 版本列表
 * @param mcVersion Minecraft 版本号
 * @param options Tauri invoke 选项
 * @returns NeoForge 版本列表
 */
export const invokeGetNeoForgeVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 NeoForge 版本列表', { mcVersion });
  return await invokeRust("get_neoforge_versions", { mcVersion }, options);
};

/**
 * 获取指定 Minecraft 版本的 OptiFine 版本列表
 * @param mcVersion Minecraft 版本号
 * @param options Tauri invoke 选项
 * @returns OptiFine 版本列表
 */
export const invokeGetOptifineVersions = async (
  mcVersion: string,
  options?: InvokeOptions
): Promise<ModLoaderVersionList> => {
  logger.info('获取 OptiFine 版本列表', { mcVersion });
  return await invokeRust("get_optifine_versions", { mcVersion }, options);
};

/**
 * 构建 Forge 启动配置
 * @param mcVersion Minecraft 版本号
 * @param forgeVersion Forge 版本号
 * @param gameDir 游戏目录
 * @param assetsDir 资源目录
 * @param username 玩家名称
 * @param uuid 玩家 UUID
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
  javaPath?: string,
  memoryMb?: number,
  options?: InvokeOptions
): Promise<ModLoaderInfo> => {
  logger.info('构建 Forge 启动配置', { mcVersion, forgeVersion });
  return await invokeRust("build_forge_launch_config", {
    mcVersion,
    forgeVersion,
    gameDir,
    assetsDir,
    username,
    uuid,
    javaPath,
    memoryMb,
  }, options);
};
