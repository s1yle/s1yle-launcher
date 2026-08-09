import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AccountInfo, DeviceCodeResponse, LoginStatus } from "./types/account";

/**
 * 添加玩家账户（microsoft / offline）
 * @param accountName 账户名称（1-16 字符）
 * @param accountType 账户类型（microsoft / offline）
 * @param accessToken 微软账户的访问令牌（可选）
 * @param refreshToken 微软账户的刷新令牌（可选）
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeAddPlayerAccount = async (
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

  logger.info('准备调用 add_player_account', args);

  return await invokeRust("add_player_account", args, options);
};

/**
 * 添加管理员账户
 * @param email 管理员邮箱
 * @param password 密码
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
export const invokeAddAdminAccount = async (
  email: string,
  admin_id: string,
  bound_player_uuids: string[],
  login_time: string,
  options?: InvokeOptions
): Promise<string> => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error("请输入有效的邮箱地址");
  }

  logger.info('准备调用 add_admin_account', { email: trimmedEmail });

  return await invokeRust("add_admin_account", {
    email: trimmedEmail,
    adminId: admin_id,
    boundPlayerUuids: bound_player_uuids,
    loginTime: login_time,
  }, options);
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
 * 获取当前账户的访问令牌（微软账户有效，离线账户返回 null）
 * @param options Tauri invoke 选项
 * @returns 访问令牌或 null
 */
export const invokeGetCurrentAccountToken = async (
  options?: InvokeOptions
): Promise<string | null> => {
  logger.info('准备调用 get_current_account_token');
  const result = await invokeRust("get_current_account_token", {}, options);
  return result as string | null;
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
 * 取消设备码登录流程，中止后台轮询/认证任务
 * @param options Tauri invoke 选项
 */
export const cancelDeviceCode = async (
  options?: InvokeOptions
): Promise<void> => {
  logger.info('准备调用 cancel_device_code');
  await invokeRust("cancel_device_code", {}, options);
};

/**
 * 轮询授权并完成 Microsoft 登录全流程（单命令）
 * 轮询 + Xbox/XSTS/Minecraft 认证 + UUID 获取 + 凭据存储 + 账户入库 均在 Rust 端完成，
 * 不向前端暴露任何 Token 敏感信息；任何阶段取消后流程立即终止
 * @param options Tauri invoke 选项
 * @returns 已创建的账户信息（仅公开字段）
 */
export const pollAndCompleteLogin = async (
  options?: InvokeOptions
): Promise<AccountInfo> => {
  logger.info('准备调用 poll_and_complete_login');
  return await invokeRust("poll_and_complete_login", {}, options) as AccountInfo;
};

/**
 * 查询当前 Microsoft 登录流程状态
 * @param options Tauri invoke 选项
 * @returns 登录流程状态：idle | polling | completing | done | cancelled
 */
export const getLoginStatus = async (
  options?: InvokeOptions
): Promise<LoginStatus> => {
  logger.info('准备调用 get_login_status');
  return await invokeRust("get_login_status", {}, options) as LoginStatus;
};