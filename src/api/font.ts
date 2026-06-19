import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { SystemFont, FontMap } from "./types/font";
import { logger } from "@/helper/logger";

export const invokeGetSystemFonts = async (
  options?: InvokeOptions
): Promise<SystemFont[]> => {
  logger.info("准备调用 get_system_fonts");
  return invokeRust('get_system_fonts', {}, options);
};

export const invokeGetFont = async (
  options?: InvokeOptions
): Promise<FontMap> => {
  logger.info("准备调用 get_font");
  return invokeRust('get_font', {}, options);
};

