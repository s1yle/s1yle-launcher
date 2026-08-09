import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";

/**
 * 获取指定路径所在磁盘的剩余可用空间（字节）
 * @param path 路径
 * @param options Tauri invoke 选项
 * @returns 磁盘剩余可用空间（字节）
 */
export const invokeGetDiskFreeSpace = async (
  path: string,
  options?: InvokeOptions
): Promise<number> => {
  logger.info('获取磁盘剩余空间', { path });
  return await invokeRust("get_disk_free_space", { path }, options);
};
