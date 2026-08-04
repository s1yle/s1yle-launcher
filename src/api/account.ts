import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AccountInfo, DeviceCodeResponse } from "./types/account";

/**
 * 添加账户
 * @param accountName 账户名称（1-16 字符）
 * @param accountType 账户类型（microsoft / offline）
 * @param accessToken 微软账户的访问令牌（可选）
 * @param refreshToken 微软账户的刷新令牌（可选）
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeAddAccount = async (
  accountName: string,
  accountType: string,
  accessToken?: string,
  refreshToken?: string,
  options?: InvokeOptions
): Promise<string> => {
  const trimmedName = accountName.trim();
  if (trimmedName.length <= 0 || trimmedName.length > 16) {
    throw new Error("账户名称必须控制在1-16字之间且不能为空！");
  }

  const args: InvokeArgs = {
    name: trimmedName,
    accountType: accountType,
  };

  if (accountType === "microsoft") {
    if (!accessToken || !refreshToken) {
      throw new Error("微软账户必须提供完整的 Token");
    }
    args.access_token = accessToken;
    args.refresh_token = refreshToken;
  }

  logger.info('准备调用 add_account', args);

  return await invokeRust("add_account", args, options);
};

/**
 * 获取账户列表
 * @param options Tauri invoke 选项
 * @returns 账户信息数组
 */
export const invokeGetAccountList = async (
  options?: InvokeOptions
): Promise<AccountInfo[]> => {
  logger.info('准备调用 get_account_list');
  const result = await invokeRust("get_account_list", {}, options);
  return result as AccountInfo[];
};

/**
 * 获取当前选中的账户
 * @param options Tauri invoke 选项
 * @returns 当前账户信息，未选中返回 null
 */
export const invokeGetCurrentAccount = async (
  options?: InvokeOptions
): Promise<AccountInfo | null> => {
  logger.info('准备调用 get_current_account');
  const result = await invokeRust("get_current_account", {}, options);
  return result as AccountInfo | null;
};

/**
 * 删除账户
 * @param uuid 要删除的账户 UUID
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeDeleteAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 delete_account', { uuid });
  return await invokeRust("delete_account", { uuid }, options);
};

/**
 * 设置当前账户
 * @param uuid 要设为当前的账户 UUID
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeSetCurrentAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 set_current_account', { uuid });
  return await invokeRust("set_current_account", { uuid }, options);
};

/**
 * 保存账户列表到磁盘
 * @param args 额外参数（可选）
 * @param options Tauri invoke 选项
 * @returns Rust 命令返回结果
 */
export const invokeSaveAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 save_accounts_to_disk', args);
  return await invokeRust("save_accounts_to_disk", args, options);
};

/**
 * 从磁盘加载账户列表
 * @param args 额外参数（可选）
 * @param options Tauri invoke 选项
 * @returns Rust 命令返回结果
 */
export const invokeLoadAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 load_accounts_from_disk', args);
  return await invokeRust("load_accounts_from_disk", args, options);
};

/**
 * 初始化账户系统
 * @param args 额外参数（可选）
 * @param options Tauri invoke 选项
 * @returns Rust 命令返回结果
 */
export const invokeAccInit = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 initialize_account_system', args);
  return await invokeRust("initialize_account_system", args, options);
};


/**
 * 启动设备码流程，获取 user_code 并存入 SESSION
 * @param options Tauri invoke 选项
 * @returns 用户码（user_code），需展示给用户
 */
export const startDeviceCode = async (
  options?: InvokeOptions
): Promise<DeviceCodeResponse> => {
  logger.info('准备调用 start_device_code');
  return await invokeRust("start_device_code", {}, options) as DeviceCodeResponse;
};

/**
 * 轮询 OAuth Token，用户授权后调用
 * @param options Tauri invoke 选项
 * @returns 成功消息
 */
export const pollOauthToken = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 poll_oauth_token');
  return await invokeRust("poll_oauth_token", {}, options);
};

/**
 * Xbox Live 认证，从 SESSION 读取 ms_token
 * @param options Tauri invoke 选项
 */
export const doXboxAuth = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('准备调用 do_xbox_auth');
  await invokeRust("do_xbox_auth", {}, options);
};

/**
 * XSTS 认证，从 SESSION 读取 xbl_response
 * @param options Tauri invoke 选项
 */
export const doXstsAuth = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('准备调用 do_xsts_auth');
  await invokeRust("do_xsts_auth", {}, options);
};

/**
 * Minecraft 登录，从 SESSION 读取 xbl/xsts token
 * @param options Tauri invoke 选项
 */
export const doMinecraftLogin = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('准备调用 do_minecraft_login');
  await invokeRust("do_minecraft_login", {}, options);
};

/**
 * 最终存储，从 SESSION 读取 mc_login，获取 UUID 后存储到可信存储
 * @param options Tauri invoke 选项
 */
export const finalizeAndStore = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('准备调用 finalize_and_store');
  await invokeRust("finalize_and_store", {}, options);
};