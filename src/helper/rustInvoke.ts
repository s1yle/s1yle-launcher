import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";

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

    console.log('调用Tauri的invoke，返回Promise');
    
    // 2. 调用Tauri的invoke，返回Promise
    const result = await invoke(trimmedFnName, args, options);
    return result;
  } catch (e) {

    console.log('错误，抛出自定义错误对象');

    // 3. 统一错误处理，抛出自定义错误对象
    const errorMsg = e instanceof Error ? e.message : "调用Rust函数失败";
    console.error(`[Rust调用失败] ${fnName}:`, errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * 添加账户的专用函数（业务逻辑封装）
 * @param accountName 账户名称（1-16字）
 * @param accountArgs 账户相关参数（传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const addAccount = async (
  accountName: string,
  accountArgs?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  const trimmedName = accountName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 16) {
    throw new Error("账户名称必须控制在1-16字之间且不能为空！");
  }

  accountArgs = {name:accountName};
  console.log('accountArgs, ', accountArgs);

  if (!accountArgs || Object.keys(accountArgs).length === 0) {
    throw new Error("账户参数不能为空！");
  }

  return await invokeRustFunction("add_account", {
    name: trimmedName,
    ...accountArgs, // 合并账户名称和其他参数
  }, options);
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