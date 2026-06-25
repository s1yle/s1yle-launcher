import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AppConfig, InstanceConfig, PathConfig } from "./types/config";

/**
 * 获取全局应用配置
 * @param options Tauri invoke 选项
 * @returns 全局配置对象
 */
export const invokeGetConfig = async (
  options?: InvokeOptions
): Promise<AppConfig> => {
  logger.info('获取全局配置');
  return await invokeRust("get_config", {}, options);
};

/**
 * 更新全局配置（完整覆盖）
 * @param newConfig 新的全局配置
 * @param options Tauri invoke 选项
 */
export const invokeUpdateConfig = async (
  newConfig: AppConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新全局配置', newConfig);
  return await invokeRust("config::update_config", { new_config: newConfig }, options);
};

/**
 * 获取单个配置值
 * @param key 配置键（点号分隔路径）
 * @param options Tauri invoke 选项
 * @returns 配置值字符串，不存在返回 null
 */
export const invokeGetConfigValue = async (
  key: string,
  options?: InvokeOptions
): Promise<string | null> => {
  logger.info('获取配置值', { key });
  return await invokeRust("get_config_value", { key }, options);
};

/**
 * 设置单个配置值（增量更新，推荐使用）
 * @param key 配置键（点号分隔路径）
 * @param value 配置值
 * @param options Tauri invoke 选项
 */
export const invokeSetConfigValue = async <T>(
  key: string,
  value: T,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('设置配置值', { key, value });
  return await invokeRust("set_config_value", { key, value }, options);
};

/**
 * 获取实例配置
 * @param instanceId 实例 ID
 * @param options Tauri invoke 选项
 * @returns 实例配置，不存在返回 null
 */
export const invokeGetInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<InstanceConfig | null> => {
  logger.info('获取实例配置', { instanceId });
  return await invokeRust("get_instance_config", { instance_id: instanceId }, options);
};

/**
 * 更新实例配置
 * @param instanceId 实例 ID
 * @param config 新的实例配置
 * @param options Tauri invoke 选项
 */
export const invokeUpdateInstanceConfig = async (
  instanceId: string,
  config: InstanceConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新实例配置', { instanceId, config });
  return await invokeRust("update_instance_config", {
    instance_id: instanceId,
    config,
  }, options);
};

/**
 * 删除实例配置
 * @param instanceId 实例 ID
 * @param options Tauri invoke 选项
 */
export const invokeRemoveInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例配置', { instanceId });
  return await invokeRust("remove_instance_config", { instance_id: instanceId }, options);
};

/** 重置配置到默认值 */
export const invokeResetConfig = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('重置配置到默认值');
  return await invokeRust("reset_config", {}, options);
};

/**
 * 导出配置到文件
 * @param targetPath 目标文件路径
 * @param options Tauri invoke 选项
 */
export const invokeExportConfig = async (
  targetPath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导出配置', { targetPath });
  return await invokeRust("export_config", { target_path: targetPath }, options);
};

/**
 * 从文件导入配置
 * @param sourcePath 源文件路径
 * @param options Tauri invoke 选项
 */
export const invokeImportConfig = async (
  sourcePath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导入配置', { sourcePath });
  return await invokeRust("import_config", { source_path: sourcePath }, options);
};

/**
 * 获取路径配置
 * @param options Tauri invoke 选项
 * @returns 路径配置对象
 */
export const invokeGetPathConfig = async (options?: InvokeOptions): Promise<PathConfig> => {
  logger.info('获取路径配置');
  return await invokeRust("get_path_config", {}, options);
};

/**
 * 更新路径配置
 * @param pathConfig 新的路径配置
 * @param options Tauri invoke 选项
 */
export const invokeUpdatePathConfig = async (
  pathConfig: PathConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新路径配置', pathConfig);
  return await invokeRust("update_path_config", { path_config: pathConfig }, options);
};

/**
 * 获取实例路径
 * @param instanceName 实例名称
 * @param options Tauri invoke 选项
 * @returns 实例绝对路径
 */
export const invokeGetInstancePath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取实例路径', { instanceName });
  return await invokeRust("get_instance_path", { instance_name: instanceName }, options);
};

/**
 * 获取实例的 versions 目录路径
 * @param instanceName 实例名称
 * @param options Tauri invoke 选项
 * @returns versions 目录绝对路径
 */
export const invokeGetVersionsPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 versions 路径', { instanceName });
  return await invokeRust("get_versions_path", { instance_name: instanceName }, options);
};

/**
 * 获取实例的 libraries 目录路径
 * @param instanceName 实例名称
 * @param options Tauri invoke 选项
 * @returns libraries 目录绝对路径
 */
export const invokeGetLibrariesPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 libraries 路径', { instanceName });
  return await invokeRust("get_libraries_path", { instance_name: instanceName }, options);
};

/**
 * 获取实例的 assets 目录路径
 * @param instanceName 实例名称
 * @param options Tauri invoke 选项
 * @returns assets 目录绝对路径
 */
export const invokeGetAssetsPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 assets 路径', { instanceName });
  return await invokeRust("get_assets_path", { instance_name: instanceName }, options);
};

/**
 * 获取实例的 natives 目录路径
 * @param instanceName 实例名称
 * @param options Tauri invoke 选项
 * @returns natives 目录绝对路径
 */
export const invokeGetNativesPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 natives 路径', { instanceName });
  return await invokeRust("get_natives_path", { instance_name: instanceName }, options);
};
