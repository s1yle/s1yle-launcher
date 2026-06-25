import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { SystemFont, FontMap } from "./types/font";
import { logger } from "@/helper/logger";

/**
 * 获取系统已安装的字体列表
 * @param options Tauri invoke 选项
 * @returns 系统字体列表
 */
export const invokeGetSystemFonts = async (
  options?: InvokeOptions
): Promise<SystemFont[]> => {
  logger.info("准备调用 get_system_fonts");
  return invokeRust('get_system_fonts', {}, options);
};

/**
 * 获取当前字体映射配置
 * @param options Tauri invoke 选项
 * @returns 字体类型到系统字体的映射
 */
export const invokeGetFont = async (
  options?: InvokeOptions
): Promise<FontMap> => {
  logger.info("准备调用 get_font");
  return invokeRust('get_font', {}, options);
};
