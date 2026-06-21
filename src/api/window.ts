import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { WindowPosition } from "./types/config";

export const invokeCloseWindow = async (label?: string): Promise<string> => {
  logger.info('关闭窗口', { label });
  if (label) {
    return await invokeRust("close_window", { label });
  }
  return await invokeRust("close_window", { label: "main" });
};

export const createMainWindow = async (): Promise<void> => {
  logger.info('创建主窗口');
  await invokeRust("create_main_window");
};

export const closeLoginWindow = async (): Promise<void> => {
  logger.info('关闭登录窗口');
  await invokeRust("close_login_window");
};

export const logoutAndShowLogin = async (): Promise<void> => {
  logger.info('退出登录，返回登录窗口');
  await invokeRust("logout_and_show_login");
};

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

export const invokeLoadWindowPosition = async (
  options?: InvokeOptions
): Promise<WindowPosition | null> => {
  logger.info('加载窗口位置');
  return await invokeRust("load_window_position", {}, options);
};

export const invokeOpenFolder = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('打开文件夹', { path });
  return await invokeRust("open_folder", { path }, options);
};

export const invokeOpenUrl = async (
  url: string,
  options?: InvokeOptions,
): Promise<string> => {
  return await invokeRust("open_url", { url }, options);
};
