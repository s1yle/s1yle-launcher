import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { LaunchStatus } from "./types/launch";
import type { LaunchConfig } from "./types/launch";

/**
 * 启动 Minecraft 实例
 * @param config 启动配置（可选）
 * @param options Tauri invoke 选项
 * @returns 启动结果字符串
 */
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

/** 停止 Minecraft 实例 */
export const invokeStopInstance = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('停止Minecraft实例');
  const result = await invokeRust("tauri_stop_instance", {}, options);
  return result;
};

/**
 * 获取启动状态
 * @param options Tauri invoke 选项
 * @returns 当前启动状态
 */
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

/**
 * 获取当前启动配置
 * @param options Tauri invoke 选项
 * @returns 启动配置
 */
export const invokeGetLaunchConfig = async (
  options?: InvokeOptions
): Promise<LaunchConfig> => {
  const result = await invokeRust("tauri_get_launch_config", {}, options);
  if (typeof result !== 'object' || result === null) {
    throw new Error("无效的启动配置格式");
  }
  return result as LaunchConfig;
};

/**
 * 更新启动配置
 * @param config 新的启动配置
 * @param options Tauri invoke 选项
 * @returns 操作结果字符串
 */
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
