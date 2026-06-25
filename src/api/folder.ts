import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { KnownPath, FolderValidationResult } from "./types/folder";

/**
 * 扫描已知的 Minecraft 路径
 * @param options Tauri invoke 选项
 * @returns 已知路径列表
 */
export const invokeScanKnownMcPaths = async (
  options?: InvokeOptions,
): Promise<KnownPath[]> => {
  return await invokeRust("scan_known_mc_paths", {}, options);
};

/**
 * 添加已知路径
 * @param path 文件夹路径
 * @param options Tauri invoke 选项
 * @returns 添加后的路径记录
 */
export const invokeAddKnownPath = async (
  path: string,
  options?: InvokeOptions,
): Promise<KnownPath> => {
  return await invokeRust("add_known_path", { path }, options);
};

/**
 * 移除已知路径
 * @param id 路径记录 ID
 * @param options Tauri invoke 选项
 */
export const invokeRemoveKnownPath = async (
  id: string,
  options?: InvokeOptions,
): Promise<void> => {
  return await invokeRust("remove_known_path", { id }, options);
};

/**
 * 设置默认 Minecraft 文件夹
 * @param id 路径记录 ID
 * @param options Tauri invoke 选项
 */
export const invokeSetDefaultFolder = async (
  id: string,
  options?: InvokeOptions,
): Promise<void> => {
  return await invokeRust("set_default_folder", { id }, options);
};

/**
 * 验证文件夹是否为有效的 Minecraft 目录
 * @param path 要验证的文件夹路径
 * @param options Tauri invoke 选项
 * @returns 验证结果
 */
export const invokeValidateFolder = async (
  path: string,
  options?: InvokeOptions
): Promise<FolderValidationResult> => {
  logger.info('验证文件夹', { path });
  return await invokeRust("validate_folder", { path }, options);
};

/**
 * 添加已验证的 Minecraft 文件夹
 * @param path 文件夹路径
 * @param customName 自定义名称（可选）
 * @param options Tauri invoke 选项
 * @returns 添加后的路径记录
 */
export const invokeAddValidatedFolder = async (
  path: string,
  customName?: string,
  options?: InvokeOptions
): Promise<KnownPath> => {
  logger.info('添加已验证的文件夹', { path, customName });
  return await invokeRust("add_validated_folder", {
    path,
    custom_name: customName || null
  }, options);
};
