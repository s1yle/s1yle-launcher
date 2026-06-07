import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { KnownPath, FolderValidationResult } from "./types/folder";

export const invokeScanKnownMcPaths = async (
  options?: InvokeOptions,
): Promise<KnownPath[]> => {
  return await invokeRust("scan_known_mc_paths", {}, options);
};

export const invokeAddKnownPath = async (
  path: string,
  options?: InvokeOptions,
): Promise<KnownPath> => {
  return await invokeRust("add_known_path", { path }, options);
};

export const invokeRemoveKnownPath = async (
  id: string,
  options?: InvokeOptions,
): Promise<void> => {
  return await invokeRust("remove_known_path", { id }, options);
};

export const invokeSetDefaultFolder = async (
  id: string,
  options?: InvokeOptions,
): Promise<void> => {
  return await invokeRust("set_default_folder", { id }, options);
};

export const invokeValidateFolder = async (
  path: string,
  options?: InvokeOptions
): Promise<FolderValidationResult> => {
  logger.info('验证文件夹', { path });
  return await invokeRust("validate_folder", { path }, options);
};

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
