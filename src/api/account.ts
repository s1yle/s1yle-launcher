import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { AccountType } from "./types/account";
import type { AccountInfo } from "./types/account";

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
