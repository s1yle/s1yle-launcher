import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { StoreLoginState } from "./types/config";

/**
 * 获取登录状态（启动时用于判断是否展示登录门禁）
 * @param options Tauri invoke 选项
 * @returns 登录状态
 */
export const invokeGetLoginState = async (
  options?: InvokeOptions
): Promise<StoreLoginState> => {
  logger.info('获取登录状态');
  return await invokeRust("get_login_state", {}, options);
};

/**
 * 保存登录状态（玩家登录/管理员登录成功后调用）
 * @param loginState 登录状态
 * @param options Tauri invoke 选项
 */
export const invokeSaveLoginState = async (
  loginState: StoreLoginState,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('保存登录状态', { loginState });
  return await invokeRust("save_login_state", { loginState: loginState }, options);
};

/**
 * 清除登录状态（登出时调用）
 * @param options Tauri invoke 选项
 */
export const invokeClearLoginState = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('清除登录状态');
  return await invokeRust("clear_login_state", {}, options);
};
