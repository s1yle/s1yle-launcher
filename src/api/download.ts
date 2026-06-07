import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { VersionManifest, VersionDownloadManifest, DownloadProgress, DownloadTask, MigrationResult, DeployResult } from "./types/download";
import type { DeployOptions } from "./types/download";

export const invokeGetVersionManifest = async (
  options?: InvokeOptions
): Promise<VersionManifest> => {
  logger.info('获取游戏版本列表');
  return await invokeRust("get_version_manifest", {}, options);
};

export const invokeGetVersionDetail = async (
  versionId: string,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('获取版本详情', { versionId });
  return await invokeRust("get_version_detail", { versionId }, options);
};

export const invokeGetVersionDownloadManifest = async (
  versionId: string,
  options?: InvokeOptions
): Promise<VersionDownloadManifest> => {
  logger.info('获取版本下载清单', { versionId });
  return await invokeRust("get_version_download_manifest", { versionId }, options);
};

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

export const invokeDeployVersionHmcl = async (
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('部署版本（全局资源）', { versionId });
  return await invokeRust("deploy_version_global", {
    version_id: versionId
  }, options);
};

export const invokeMigrateDirectoryStructure = async (
  options?: InvokeOptions
): Promise<MigrationResult> => {
  logger.info('迁移目录结构');
  return await invokeRust("migrate_directory_structure", {}, options);
};

export const invokeGetDownloadTasks = async (
  options?: InvokeOptions
): Promise<DownloadTask[]> => {
  logger.info('获取下载任务列表');
  return await invokeRust("get_download_tasks", {}, options);
};

export const invokeGetDownloadTask = async (
  taskId: string,
  options?: InvokeOptions
): Promise<DownloadTask | null> => {
  logger.info('获取下载任务', { taskId });
  return await invokeRust("get_download_task", { taskId }, options);
};

export const invokeCancelDownload = async (
  taskId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('取消下载任务', { taskId });
  return await invokeRust("cancel_download", { taskId }, options);
};

export const invokeClearCompletedTasks = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('清理已完成任务');
  return await invokeRust("clear_completed_tasks", {}, options);
};

export const invokeGetGameVersions = async (
  options?: InvokeOptions
): Promise<string[]> => {
  logger.info('获取已安装游戏版本');
  return await invokeRust("get_game_versions", {}, options);
};

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
