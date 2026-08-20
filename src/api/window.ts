import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";

/**
 * 保存指定窗口的位置和尺寸
 * @param label 窗口标签
 * @param x 窗口 X 坐标
 * @param y 窗口 Y 坐标
 * @param width 窗口宽度
 * @param height 窗口高度
 * @param maximized 是否最大化
 * @param options Tauri invoke 选项
 */
export const invokeSaveWindowPositionByLabel = async (
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  maximized: boolean,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('保存窗口位置', { label, x, y, width, height, maximized });
  await invokeRust("save_window_position_by_label", { label, x, y, width, height, maximized }, options);
};

/**
 * 在文件管理器中打开指定路径
 * @param path 要打开的文件夹路径
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeOpenFolder = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('打开文件夹', { path });
  return await invokeRust("open_folder", { path }, options);
};

/**
 * 在系统默认浏览器中打开 URL
 * @param url 要打开的链接
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeOpenUrl = async (
  url: string,
  options?: InvokeOptions,
): Promise<string> => {
  return await invokeRust("open_url", { url }, options);
};
