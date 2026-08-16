import {  InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { VersionManifest, DownloadTask, DownloadOptions, DownloadResult } from "./types/download";

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

/**
 * 取消整个版本的部署下载（触发后端取消令牌，立即中断下载链路）
 * @param versionId 版本 ID
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeCancelVersionDownload = async (
  versionId: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('取消版本下载', { versionId });
  return await invokeRust("cancel_version_download", { versionId }, options);
};

/** 清理已完成的下载任务 */
export const invokeClearCompletedTasks = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('清理已完成任务');
  return await invokeRust("clear_completed_tasks", {}, options);
};

/**
 * 下载并部署完整游戏（含加载器）
 * @param options 部署选项
 * @param invokeOptions Tauri invoke 选项
 * @returns 部署结果
 */
export const invokeDownload = async (
  options: DownloadOptions,
  invokeOptions?: InvokeOptions
): Promise<DownloadResult> => {
  logger.info('下载并部署游戏', options);
  return await invokeRust("download", {
    options: {
      ...options,
      loader_version: options.loader_version || null,
      target_existing_game: options.target_existing_game || null
    }
  }, invokeOptions);
};
