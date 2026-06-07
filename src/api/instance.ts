import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { GameInstance, GameSettings } from "./types/instance";

export const invokeScanInstances = async (
  options?: InvokeOptions
): Promise<GameInstance[]> => {
  return invokeRust('scan_instances', {}, options);
};

export const invokeGetInstanceSettings = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<GameSettings> => {
  return invokeRust('get_instance_settings', { instanceId }, options);
};

export const invokeUpdateInstanceSettings = async (
  instanceId: string,
  settings: GameSettings,
  options?: InvokeOptions
): Promise<GameInstance> => {
  return invokeRust('update_instance_settings', { instanceId, settings }, options);
};

export const invokeGetSystemMemory = async (
  options?: InvokeOptions
): Promise<number> => {
  return invokeRust('get_system_memory', {}, options);
};

export const invokeSelectJavaPath = async (
  options?: InvokeOptions
): Promise<string | null> => {
  return invokeRust('select_java_path', {}, options);
};

export const invokeGetInstance = async (
  id: string,
  options?: InvokeOptions
): Promise<GameInstance | null> => {
  logger.info('获取实例详情', { id });
  return await invokeRust("get_instance", { id }, options);
};

export const invokeCreateInstance = async (
  name: string,
  version: string,
  loaderType: string,
  loaderVersion?: string,
  iconPath?: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('创建实例', { name, version, loaderType });
  return await invokeRust("create_instance", {
    name,
    version,
    loader_type: loaderType,
    loader_version: loaderVersion,
    icon_path: iconPath,
  }, options);
};

export const invokeDeleteInstance = async (
  id: string,
  deleteFiles: boolean = false,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例', { id, deleteFiles });
  return await invokeRust("delete_instance", { id, delete_files: deleteFiles }, options);
};

export const invokeCopyInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('复制实例', { id, newName });
  return await invokeRust("copy_instance", { id, new_name: newName }, options);
};

export const invokeRenameInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('重命名实例', { id, newName });
  return await invokeRust("rename_instance", { id, new_name: newName }, options);
};

export const invokeUpdateInstance = async (
  id: string,
  name?: string,
  enabled?: boolean,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('更新实例', { id, name, enabled });
  return await invokeRust("update_instance", { id, name, enabled }, options);
};

export const invokeGetInstancesPath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取实例目录路径');
  return await invokeRust("get_instances_path", {}, options);
};

export const invokeGetDownloadBasePath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取下载目录路径');
  return await invokeRust("get_download_base_path", {}, options);
};

export const invokeSetDownloadBasePath = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('设置下载目录路径', { path });
  return await invokeRust("set_download_base_path", { path }, options);
};

export const invokeDeployVersionToInstance = async (
  instancePath: string,
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本到实例', { instancePath, versionId });
  return await invokeRust("deploy_version_to_instance", { instance_path: instancePath, version_id: versionId }, options);
};

export const invokeIsVersionDeployed = async (
  versionId: string,
  options?: InvokeOptions
): Promise<boolean> => {
  logger.info('检查版本是否已部署', { versionId });
  return await invokeRust("is_version_deployed", { versionId }, options);
};
