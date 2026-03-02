import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { logger } from "./logger";

// ======================== 账户相关类型定义 ========================

/**
 * 账户类型枚举（与Rust后端保持一致）
 */
export enum AccountType {
  Microsoft = "microsoft",
  Offline = "offline"
}

/**
 * 账户信息接口（与Rust后端保持一致）
 */
export interface AccountInfo {
  name: string;
  account_type: AccountType;
  uuid: string;
  create_time: string;
  last_login_time: string | null;
}

/**
 * 账户接口（包含敏感信息，仅后端使用）
 */
export interface Account {
  info: AccountInfo;
  access_token: string | null;
  refresh_token: string | null;
}

// ======================== 启动相关类型定义 ========================

/**
 * 启动状态枚举（与Rust后端保持一致）
 */
export enum LaunchStatus {
  Idle = "Idle",           // 未启动
  Launching = "Launching", // 启动中
  Running = "Running",     // 运行中
  Crashed = "Crashed",     // 崩溃
  Stopped = "Stopped",     // 已停止
}

/**
 * 启动配置接口（与Rust后端保持一致）
 */
export interface LaunchConfig {
  java_path: string;           // Java可执行文件路径
  memory_mb: number;           // 内存大小（MB）
  version: string;             // Minecraft版本
  game_dir: string;            // 游戏目录
  assets_dir: string;          // 资源目录
  username: string;            // 用户名
  uuid: string;                // 用户UUID
  access_token?: string;       // 访问令牌（微软账户）
}

/**
 * 调用Rust函数的通用工具函数
 * @param fnName Rust函数名
 * @param args 传给Rust的参数（可选）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust函数的返回值
 */
export const invokeRustFunction = async (
  fnName: string,
  args: InvokeArgs = {}, // 默认空对象，避免传undefined
  options?: InvokeOptions // 可选参数，符合Tauri原生设计
): Promise<any> => {
  try {
    // 1. 校验函数名
    const trimmedFnName = fnName.trim();
    if (trimmedFnName.length === 0) {
      throw new Error("Rust函数名不能为空！");
    }

    console.debug('调用Tauri的invoke');
    
    // 2. 调用Tauri的invoke，返回Promise
    const result = await invoke(trimmedFnName, args, options);
    return result;
  } catch (e) {
    console.error('错误，抛出自定义错误对象');

    let errorMsg: string;
    if (e instanceof Error) {
        errorMsg = e.message;
    } else if (typeof e === 'string') {
        errorMsg = e;
    } else if (e && typeof e === 'object') {
        errorMsg = JSON.stringify(e);
    } else {
        errorMsg = String(e);
    }

    // 统一错误处理，抛出自定义错误对象
    // const errorMsg = e instanceof Error ? e.message : " [未知错误] 调用Rust函数失败";
    // console.error(`[Rust调用失败] ${fnName}:`, errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * 添加账户的专用函数（业务逻辑封装）
 * @param accountName 账户名称（1-16字）
 * @param accountType 账户类型（离线或微软）
 * @param accountArgs 账户相关参数（传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
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
    account_type: accountType,
  };

  if (accountType === "microsoft") {
    if (!accessToken || !refreshToken) {
      throw new Error("微软账户必须提供完整的 Token");
    }
    args.access_token = accessToken;
    args.refresh_token = refreshToken;
  }

  logger.info('准备调用 add_account', args);

  return await invokeRustFunction("add_account", args, options);
};

/**
 * 获取账户列表
 * @param options invoke配置（可选）
 * @returns Promise<AccountInfo[]> 账户信息列表
 */
export const getAccountList = async (
  options?: InvokeOptions
): Promise<AccountInfo[]> => {
  logger.info('准备调用 get_account_list');
  const result = await invokeRustFunction("get_account_list", {}, options);
  return result as AccountInfo[];
};

/**
 * 获取当前账户
 * @param options invoke配置（可选）
 * @returns Promise<AccountInfo | null> 当前账户信息，如果没有则为null
 */
export const getCurrentAccount = async (
  options?: InvokeOptions
): Promise<AccountInfo | null> => {
  logger.info('准备调用 get_current_account');
  const result = await invokeRustFunction("get_current_account", {}, options);
  return result as AccountInfo | null;
};

/**
 * 删除账户
 * @param uuid 账户UUID
 * @param options invoke配置（可选）
 * @returns Promise<string> 删除结果消息
 */
export const deleteAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 delete_account', { uuid });
  return await invokeRustFunction("delete_account", { uuid }, options);
};

/**
 * 设为当前账户
 * @param uuid 账户UUID
 * @param options invoke配置（可选）
 * @returns Promise<string> 设置结果消息
 */
export const setCurrentAccount = async (
  uuid: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('准备调用 set_current_account', { uuid });
  return await invokeRustFunction("set_current_account", { uuid }, options);
};

/**
 * 保存账户到磁盘
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeSaveAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 save_accounts_to_disk', args);
  return await invokeRustFunction("save_accounts_to_disk", args, options);
};

/**
 * 从磁盘加载账户
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeLoadAccount = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 load_accounts_from_disk', args);
  return await invokeRustFunction("load_accounts_from_disk", args, options);
};

/**
 * 初始化账户系统
 * @param args （传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const invokeAccInit = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  logger.info('准备调用 initialize_account_system', args);
  return await invokeRustFunction("initialize_account_system", args, options);
};

// ======================== 启动相关函数 ========================

/**
 * 启动Minecraft实例
 * @param config 可选的启动配置（如不提供则使用默认配置）
 * @param options invoke配置（可选）
 * @returns Promise<string> 启动结果消息
 */
export const launchInstance = async (
  config?: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('启动Minecraft实例，配置:', config);
    
    const result = await invokeRustFunction("tauri_launch_instance", {
      config: config || null,
    }, options);
    
    console.log('启动结果:', result);
    return result;
  } catch (e) {
    console.error('启动失败:', e);
    throw new Error(e instanceof Error ? e.message : "启动Minecraft失败");
  }
};

/**
 * 停止Minecraft实例
 * @param options invoke配置（可选）
 * @returns Promise<string> 停止结果消息
 */
export const stopInstance = async (
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('停止Minecraft实例');
    
    const result = await invokeRustFunction("tauri_stop_instance", {}, options);
    
    console.log('停止结果:', result);
    return result;
  } catch (e) {
    console.error('停止失败:', e);
    throw new Error(e instanceof Error ? e.message : "停止Minecraft失败");
  }
};

/**
 * 获取当前启动状态
 * @param options invoke配置（可选）
 * @returns Promise<LaunchStatus> 启动状态
 */
export const getLaunchStatus = async (
  options?: InvokeOptions
): Promise<LaunchStatus> => {
  try {
    const result = await invokeRustFunction("tauri_get_launch_status", {}, options);
    
    // 将字符串转换为枚举
    switch (result) {
      case "Idle":
      case "Launching":
      case "Running":
      case "Crashed":
      case "Stopped":
        return result as LaunchStatus;
      default:
        console.warn(`未知的启动状态: ${result}，返回Idle`);
        return LaunchStatus.Idle;
    }
  } catch (e) {
    console.error('获取启动状态失败:', e);
    return LaunchStatus.Idle; // 默认返回空闲状态
  }
};

/**
 * 获取当前启动配置
 * @param options invoke配置（可选）
 * @returns Promise<LaunchConfig> 启动配置
 */
export const getLaunchConfig = async (
  options?: InvokeOptions
): Promise<LaunchConfig> => {
  try {
    const result = await invokeRustFunction("tauri_get_launch_config", {}, options);
    
    // 验证返回的配置结构
    if (typeof result !== 'object' || result === null) {
      throw new Error("无效的启动配置格式");
    }
    
    return result as LaunchConfig;
  } catch (e) {
    console.error('获取启动配置失败:', e);
    
    // 返回默认配置
    return {
      java_path: "java",
      memory_mb: 2048,
      version: "1.20.4",
      game_dir: "./.minecraft",
      assets_dir: "./.minecraft/assets",
      username: "Steve",
      uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    };
  }
};

/**
 * 更新启动配置
 * @param config 新的启动配置
 * @param options invoke配置（可选）
 * @returns Promise<string> 更新结果消息
 */
export const updateLaunchConfig = async (
  config: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  try {
    console.log('更新启动配置:', config);
    
    // 验证配置
    if (!config.java_path || !config.version || !config.username) {
      throw new Error("Java路径、版本和用户名不能为空");
    }
    
    const result = await invokeRustFunction("tauri_update_launch_config", {
      config,
    }, options);
    
    console.log('更新结果:', result);
    return result;
  } catch (e) {
    console.error('更新启动配置失败:', e);
    throw new Error(e instanceof Error ? e.message : "更新启动配置失败");
  }
};

/**
 * 关闭window
 * @returns Promise<string> 调用rust tauri_close_window消息
 */
export const closeWindow = async (
): Promise<string> => {
  try {
    console.log('调用rust tauri_close_window:');

    const result = await invokeRustFunction("tauri_close_window");
    
    console.log("调用rust tauri_close_window 结果: ", result);

    return result;
  } catch (e) {
    console.error('调用rust [tauri_close_window] 失败:', e);
    throw new Error(e instanceof Error ? e.message : "调用rust [tauri_close_window] 失败");
  }
};

/**
 * 日志
 * @param args 传递 level 和 message
 * @param options invoke配置（可选）
 * @returns Promise<any> 调用 invokeLogger
 */
export const invokeLogger = async (
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  try {
    console.log('调用 invokeLogger:');

    const result = await invokeRustFunction("log_frontend",args, options);
    
    console.log("调用 invokeLogger 结果: ", result);

    return result;
  } catch (e) {
    console.error('调用 [invokeLogger] 失败:', e);
    throw new Error(e instanceof Error ? e.message : "调用 [invokeLogger] 失败");
  }
};