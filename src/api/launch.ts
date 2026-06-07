import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { LaunchStatus } from "./types/launch";
import type { LaunchConfig } from "./types/launch";

export const invokeLaunchInstance = async (
  config?: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('启动Minecraft实例', { config });
  const result = await invokeRust("tauri_launch_instance", {
    config: config || null,
  }, options);
  return result;
};

export const invokeStopInstance = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('停止Minecraft实例');
  const result = await invokeRust("tauri_stop_instance", {}, options);
  return result;
};

export const invokeGetLaunchStatus = async (
  options?: InvokeOptions
): Promise<LaunchStatus> => {
  try {
    const result = await invokeRust("tauri_get_launch_status", {}, options);
    switch (result) {
      case "Idle":
      case "Launching":
      case "Running":
      case "Crashed":
      case "Stopped":
        return result as LaunchStatus;
      default:
        logger.warn(`未知的启动状态: ${result}，返回Idle`);
        return LaunchStatus.Idle;
    }
  } catch (e) {
    logger.error('获取启动状态失败:', e);
    return LaunchStatus.Idle;
  }
};

export const invokeGetLaunchConfig = async (
  options?: InvokeOptions
): Promise<LaunchConfig> => {
  const result = await invokeRust("tauri_get_launch_config", {}, options);
  if (typeof result !== 'object' || result === null) {
    throw new Error("无效的启动配置格式");
  }
  return result as LaunchConfig;
};

export const invokeUpdateLaunchConfig = async (
  config: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  if (!config.java_path || !config.version || !config.username) {
    throw new Error("Java路径、版本和用户名不能为空");
  }
  logger.info('更新启动配置', { config });
  return await invokeRust("tauri_update_launch_config", { config }, options);
};
