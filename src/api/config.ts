import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AppConfig, InstanceConfig, PathConfig } from "./types/config";

export const invokeGetConfig = async (
  options?: InvokeOptions
): Promise<AppConfig> => {
  logger.info('获取全局配置');
  return await invokeRust("get_config", {}, options);
};

export const invokeUpdateConfig = async (
  newConfig: AppConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新全局配置', newConfig);
  return await invokeRust("config::update_config", { new_config: newConfig }, options);
};

export const invokeGetConfigValue = async (
  key: string,
  options?: InvokeOptions
): Promise<string | null> => {
  logger.info('获取配置值', { key });
  return await invokeRust("get_config_value", { key }, options);
};

export const invokeSetConfigValue = async <T>(
  key: string,
  value: T,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('设置配置值', { key, value });
  return await invokeRust("set_config_value", { key, value }, options);
};

export const invokeGetInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<InstanceConfig | null> => {
  logger.info('获取实例配置', { instanceId });
  return await invokeRust("get_instance_config", { instance_id: instanceId }, options);
};

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

export const invokeRemoveInstanceConfig = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例配置', { instanceId });
  return await invokeRust("remove_instance_config", { instance_id: instanceId }, options);
};

export const invokeResetConfig = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('重置配置到默认值');
  return await invokeRust("reset_config", {}, options);
};

export const invokeExportConfig = async (
  targetPath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导出配置', { targetPath });
  return await invokeRust("export_config", { target_path: targetPath }, options);
};

export const invokeImportConfig = async (
  sourcePath: string,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('导入配置', { sourcePath });
  return await invokeRust("import_config", { source_path: sourcePath }, options);
};

export const invokeGetPathConfig = async (options?: InvokeOptions): Promise<PathConfig> => {
  logger.info('获取路径配置');
  return await invokeRust("get_path_config", {}, options);
};

export const invokeUpdatePathConfig = async (
  pathConfig: PathConfig,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新路径配置', pathConfig);
  return await invokeRust("update_path_config", { path_config: pathConfig }, options);
};

export const invokeGetInstancePath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取实例路径', { instanceName });
  return await invokeRust("get_instance_path", { instance_name: instanceName }, options);
};

export const invokeGetVersionsPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 versions 路径', { instanceName });
  return await invokeRust("get_versions_path", { instance_name: instanceName }, options);
};

export const invokeGetLibrariesPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 libraries 路径', { instanceName });
  return await invokeRust("get_libraries_path", { instance_name: instanceName }, options);
};

export const invokeGetAssetsPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 assets 路径', { instanceName });
  return await invokeRust("get_assets_path", { instance_name: instanceName }, options);
};

export const invokeGetNativesPath = async (
  instanceName: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取 natives 路径', { instanceName });
  return await invokeRust("get_natives_path", { instance_name: instanceName }, options);
};
