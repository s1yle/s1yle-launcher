import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AppConfig, StoreLoginState } from "./types/config";

/**
 * 获取全局应用配置
 * @param options Tauri invoke 选项
 * @returns 全局配置对象
 */
export const invokeGetConfig = async (
  options?: InvokeOptions
): Promise<AppConfig> => {
  logger.info('获取全局配置');
  return await invokeRust("get_config", {}, options);
};

/**
 * 设置单个配置值（增量更新，推荐使用）
 * @param key 配置键（点号分隔路径）
 * @param value 配置值
 * @param options Tauri invoke 选项
 */
export const invokeSetConfigValue = async <T>(
  key: string,
  value: T,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('设置配置值', { key, value });
  return await invokeRust("set_config_value", { key, value }, options);
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
