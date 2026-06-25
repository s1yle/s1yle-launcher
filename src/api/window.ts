import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { WindowPosition } from "./types/config";

/**
 * 关闭窗口
 * @param label 窗口标签名（默认 "main"）
 * @returns 操作结果字符串
 */
export const invokeCloseWindow = async (label?: string): Promise<string> => {
  logger.info('关闭窗口', { label });
  if (label) {
    return await invokeRust("close_window", { label });
  }
  return await invokeRust("close_window", { label: "main" });
};

/** 创建主窗口 */
export const createMainWindow = async (): Promise<void> => {
  logger.info('创建主窗口');
  await invokeRust("create_main_window");
};

/** 关闭登录窗口 */
export const closeLoginWindow = async (): Promise<void> => {
  logger.info('关闭登录窗口');
  await invokeRust("close_login_window");
};

/** 退出登录并返回登录窗口 */
export const logoutAndShowLogin = async (): Promise<void> => {
  logger.info('退出登录，返回登录窗口');
  await invokeRust("logout_and_show_login");
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
