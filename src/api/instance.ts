import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { GameInstance, GameSettings } from "./types/instance";

/**
 * 扫描所有已安装的实例
 * @param options Tauri invoke 选项
 * @returns 游戏实例列表
 */
export const invokeScanInstances = async (
  options?: InvokeOptions
): Promise<GameInstance[]> => {
  return invokeRust('scan_instances', {}, options);
};

/**
 * 获取实例的游戏设置
 * @param instanceId 实例 ID
 * @param options Tauri invoke 选项
 * @returns 游戏设置
 */
export const invokeGetInstanceSettings = async (
  instanceId: string,
  options?: InvokeOptions
): Promise<GameSettings> => {
  return invokeRust('get_instance_settings', { instanceId }, options);
};

/**
 * 更新实例的游戏设置
 * @param instanceId 实例 ID
 * @param settings 新的游戏设置
 * @param options Tauri invoke 选项
 * @returns 更新后的游戏实例
 */
export const invokeUpdateInstanceSettings = async (
  instanceId: string,
  settings: GameSettings,
  options?: InvokeOptions
): Promise<GameInstance> => {
  return invokeRust('update_instance_settings', { instanceId, settings }, options);
};

/**
 * 获取系统可用内存
 * @param options Tauri invoke 选项
 * @returns 系统总内存（MB）
 */
export const invokeGetSystemMemory = async (
  options?: InvokeOptions
): Promise<number> => {
  return invokeRust('get_system_memory', {}, options);
};

/**
 * 打开文件选择器让用户选择 Java 路径
 * @param options Tauri invoke 选项
 * @returns 选择的 Java 路径，取消返回 null
 */
export const invokeSelectJavaPath = async (
  options?: InvokeOptions
): Promise<string | null> => {
  return invokeRust('select_java_path', {}, options);
};

/**
 * 获取单个实例详情
 * @param id 实例 ID
 * @param options Tauri invoke 选项
 * @returns 实例信息，不存在返回 null
 */
export const invokeGetInstance = async (
  id: string,
  options?: InvokeOptions
): Promise<GameInstance | null> => {
  logger.info('获取实例详情', { id });
  return await invokeRust("get_instance", { id }, options);
};

/**
 * 创建新实例
 * @param name 实例名称
 * @param version Minecraft 版本号
 * @param loaderType 模组加载器类型
 * @param loaderVersion 加载器版本（可选）
 * @param iconPath 图标路径（可选）
 * @param options Tauri invoke 选项
 * @returns 新创建的实例
 */
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

/**
 * 删除实例
 * @param id 实例 ID
 * @param deleteFiles 是否同时删除文件（默认 false）
 * @param options Tauri invoke 选项
 */
export const invokeDeleteInstance = async (
  id: string,
  deleteFiles: boolean = false,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例', { id, deleteFiles });
  return await invokeRust("delete_instance", { id, delete_files: deleteFiles }, options);
};

/**
 * 复制实例
 * @param id 源实例 ID
 * @param newName 新实例名称
 * @param options Tauri invoke 选项
 * @returns 复制后的新实例
 */
export const invokeCopyInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('复制实例', { id, newName });
  return await invokeRust("copy_instance", { id, new_name: newName }, options);
};

/**
 * 重命名实例
 * @param id 实例 ID
 * @param newName 新名称
 * @param options Tauri invoke 选项
 * @returns 更新后的实例
 */
export const invokeRenameInstance = async (
  id: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('重命名实例', { id, newName });
  return await invokeRust("rename_instance", { id, new_name: newName }, options);
};

/**
 * 更新实例属性
 * @param id 实例 ID
 * @param name 新名称（可选）
 * @param enabled 是否启用（可选）
 * @param options Tauri invoke 选项
 * @returns 更新后的实例
 */
export const invokeUpdateInstance = async (
  id: string,
  name?: string,
  enabled?: boolean,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('更新实例', { id, name, enabled });
  return await invokeRust("update_instance", { id, name, enabled }, options);
};

/**
 * 获取实例存放目录路径
 * @param options Tauri invoke 选项
 * @returns 实例目录绝对路径
 */
export const invokeGetInstancesPath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取实例目录路径');
  return await invokeRust("get_instances_path", {}, options);
};

/**
 * 获取下载基础目录路径
 * @param options Tauri invoke 选项
 * @returns 下载目录绝对路径
 */
export const invokeGetDownloadBasePath = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取下载目录路径');
  return await invokeRust("get_download_base_path", {}, options);
};

/**
 * 设置下载基础目录路径
 * @param path 新的下载目录路径
 * @param options Tauri invoke 选项
 * @returns 设置后的路径
 */
export const invokeSetDownloadBasePath = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('设置下载目录路径', { path });
  return await invokeRust("set_download_base_path", { path }, options);
};

/**
 * 部署版本到指定实例
 * @param instancePath 实例路径
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 部署结果字符串
 */
export const invokeDeployVersionToInstance = async (
  instancePath: string,
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本到实例', { instancePath, versionId });
  return await invokeRust("deploy_version_to_instance", { instance_path: instancePath, version_id: versionId }, options);
};

/**
 * 检查版本是否已部署
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 是否已部署
 */
export const invokeIsVersionDeployed = async (
  versionId: string,
  options?: InvokeOptions
): Promise<boolean> => {
  logger.info('检查版本是否已部署', { versionId });
  return await invokeRust("is_version_deployed", { versionId }, options);
};
