import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AppConfig, StoreLoginState } from "./types/config";

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

/**
 * 获取全局应用配置（启动引导阶段调用，用于初始化背景 / 迎新等状态）
 * @param options Tauri invoke 选项
 * @returns 全局配置
 */
export const invokeGetConfig = async (
  options?: InvokeOptions
): Promise<AppConfig> => {
  logger.info('获取应用配置');
  return (await invokeRust("get_config", {}, options)) as AppConfig;
};

/**
 * 增量写入配置值（背景、迎新标志等持久化到 L2 配置文件，随卸载清除）
 * @param key 点号分隔的配置路径
 * @param value 配置值
 * @param options Tauri invoke 选项
 */
export const invokeSetConfigValue = async (
  key: string,
  value: unknown,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('更新配置值', { key });
  return await invokeRust("set_config_value", { key, value }, options);
};
