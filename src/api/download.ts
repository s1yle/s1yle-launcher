import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { VersionManifest, VersionDownloadManifest, DownloadProgress, DownloadTask, MigrationResult, DeployResult } from "./types/download";
import type { DeployOptions } from "./types/download";

/**
 * 获取 Minecraft 版本清单
 * @param options Tauri invoke 选项
 * @returns 版本清单（含 latest 和 versions 列表）
 */
export const invokeGetVersionManifest = async (
  options?: InvokeOptions
): Promise<VersionManifest> => {
  logger.info('获取游戏版本列表');
  return await invokeRust("get_version_manifest", {}, options);
};

/**
 * 获取版本详情
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 版本详细数据
 */
export const invokeGetVersionDetail = async (
  versionId: string,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('获取版本详情', { versionId });
  return await invokeRust("get_version_detail", { versionId }, options);
};

/**
 * 获取版本下载清单（包含所有需要下载的文件索引）
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 版本下载清单
 */
export const invokeGetVersionDownloadManifest = async (
  versionId: string,
  options?: InvokeOptions
): Promise<VersionDownloadManifest> => {
  logger.info('获取版本下载清单', { versionId });
  return await invokeRust("get_version_download_manifest", { versionId }, options);
};

/**
 * 下载单个文件
 * @param versionId 版本 ID
 * @param url 下载 URL
 * @param filename 保存文件名
 * @param sha1 SHA1 校验值（可选）
 * @param skipVerify 是否跳过完整性校验（可选）
 * @param totalSize 文件总大小（可选）
 * @param options Tauri invoke 选项
 * @returns 下载进度信息
 */
export const invokeDownloadFile = async (
  versionId: string,
  url: string,
  filename: string,
  sha1?: string,
  skipVerify?: boolean,
  totalSize?: number,
  options?: InvokeOptions
): Promise<DownloadProgress> => {
  logger.info('开始下载文件', { url, filename, sha1, skipVerify, totalSize, versionId });

  const args: any = { versionId, url, filename };
  if (sha1 !== undefined) args.sha1 = sha1;
  if (skipVerify !== undefined) args.skip_verify = skipVerify;
  if (totalSize !== undefined) args.total_size = totalSize;

  return await invokeRust("download_file", args, options);
};

/**
 * 部署版本文件到实例目录
 * @param versionId 版本 ID
 * @param instancePath 实例路径
 * @param options Tauri invoke 选项
 * @returns 部署结果字符串
 */
export const invokeDeployVersionFiles = async (
  versionId: string,
  instancePath: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本文件到实例', { versionId, instancePath });
  return await invokeRust("deploy_version_files", {
    versionId,
    instance_path: instancePath
  }, options);
};

/**
 * 部署版本（全局资源）
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 部署结果字符串
 */
export const invokeDeployVersionHmcl = async (
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本（全局资源）', { versionId });
  return await invokeRust("deploy_version_global", {
    version_id: versionId
  }, options);
};

/**
 * 迁移目录结构（旧格式 -> 新格式）
 * @param options Tauri invoke 选项
 * @returns 迁移结果
 */
export const invokeMigrateDirectoryStructure = async (
  options?: InvokeOptions
): Promise<MigrationResult> => {
  logger.info('迁移目录结构');
  return await invokeRust("migrate_directory_structure", {}, options);
};

/**
 * 获取所有下载任务
 * @param options Tauri invoke 选项
 * @returns 下载任务列表
 */
export const invokeGetDownloadTasks = async (
  options?: InvokeOptions
): Promise<DownloadTask[]> => {
  logger.info('获取下载任务列表');
  return await invokeRust("get_download_tasks", {}, options);
};

/**
 * 获取单个下载任务
 * @param taskId 任务 ID
 * @param options Tauri invoke 选项
 * @returns 下载任务信息，不存在返回 null
 */
export const invokeGetDownloadTask = async (
  taskId: string,
  options?: InvokeOptions
): Promise<DownloadTask | null> => {
  logger.info('获取下载任务', { taskId });
  return await invokeRust("get_download_task", { taskId }, options);
};

/**
 * 取消下载任务
 * @param taskId 任务 ID
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeCancelDownload = async (
  taskId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('取消下载任务', { taskId });
  return await invokeRust("cancel_download", { taskId }, options);
};

/** 清理已完成的下载任务 */
export const invokeClearCompletedTasks = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('清理已完成任务');
  return await invokeRust("clear_completed_tasks", {}, options);
};

/**
 * 获取已安装的游戏版本列表
 * @param options Tauri invoke 选项
 * @returns 已安装版本 ID 列表
 */
export const invokeGetGameVersions = async (
  options?: InvokeOptions
): Promise<string[]> => {
  logger.info('获取已安装游戏版本');
  return await invokeRust("get_game_versions", {}, options);
};

/**
 * 下载并部署完整实例（含加载器）
 * @param options 部署选项
 * @param invokeOptions Tauri invoke 选项
 * @returns 部署结果
 */
export const invokeDownloadAndDeploy = async (
  options: DeployOptions,
  invokeOptions?: InvokeOptions
): Promise<DeployResult> => {
  logger.info('下载并部署实例', options);
  return await invokeRust("download_and_deploy", {
    options: {
      ...options,
      loader_version: options.loader_version || null,
      target_existing_instance: options.target_existing_instance || null
    }
  }, invokeOptions);
};
