import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { WindowPosition } from "./types/config";

export type WindowType = "Main" | "Login" | "Loading";

/** 统一创建窗口 */
export const invokeCreateWindow = async (windowType: WindowType): Promise<void> => {
  logger.info('创建窗口', { windowType });
  await invokeRust("create_window", { windowType });
};

/** 关闭指定标签的窗口 */
export const invokeCloseWindow = async (label: string): Promise<void> => {
  logger.info('关闭窗口', { label });
  await invokeRust("close_window", { label });
};

/**
 * 关闭指定窗口并打开另一个窗口
 * @param closeLabel (注意)这个参数，一定要传窗口的label，如main/login/loading
 * @param openType (注意)这个参数，一定要传窗口的类型，如Main/Login/Loading
 * @param options Tauri invoke 选项
 */
export const invokeSwitchWindow = async (closeLabel: string, openType: WindowType): Promise<void> => {
  logger.info('切换窗口', { closeLabel, openType });
  await invokeRust("switch_window", { closeLabel, openType });
};

/**
 * 保存窗口位置和尺寸
 * @param x 窗口 X 坐标
 * @param y 窗口 Y 坐标
 * @param width 窗口宽度
 * @param height 窗口高度
 * @param maximized 是否最大化
 * @param options Tauri invoke 选项
 */
export const invokeSaveWindowPosition = async (
  x: number,
  y: number,
  width: number,
  height: number,
  maximized: boolean,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('保存窗口位置', { x, y, width, height, maximized });
  await invokeRust("save_window_position", { x, y, width, height, maximized }, options);
};

/**
 * 加载已保存的窗口位置
 * @param options Tauri invoke 选项
 * @returns 窗口位置信息，不存在返回 null
 */
export const invokeLoadWindowPosition = async (
  options?: InvokeOptions
): Promise<WindowPosition | null> => {
  logger.info('加载窗口位置');
  return await invokeRust("load_window_position", {}, options);
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
