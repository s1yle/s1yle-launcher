import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { GameInstance, GameSettings } from "./types/instance";

/**
 * 获取实例的游戏设置
 * @param gameName 实例名称
 * @param options Tauri invoke 选项
 * @returns 游戏设置
 */
export const invokeGetGameSettings = async (
  gameName: string,
  options?: InvokeOptions
): Promise<GameSettings> => {
  return invokeRust('get_game_settings', { game_name: gameName }, options);
};

/**
 * 更新实例的游戏设置
 * @param gameName 实例名称
 * @param settings 新的游戏设置
 * @param options Tauri invoke 选项
 * @returns 更新后的游戏实例
 */
export const invokeUpdateGameSettings = async (
  gameName: string,
  settings: GameSettings,
  options?: InvokeOptions
): Promise<GameInstance> => {
  return invokeRust('update_game_settings', { game_name: gameName, settings }, options);
};

/**
 * 获取系统可用内存
 * @param options Tauri invoke 选项
 * @returns 系统总内存（MB）
 */
export const invokeGetSystemMemory = async (
  options?: InvokeOptions
): Promise<number> => {
  return invokeRust('get_system_memory', {}, options);
};

/**
 * 获取系统内存使用情况
 * @param options Tauri invoke 选项
 * @returns [已使用内存（MB）, 总内存（MB）]
 */
export const invokeGetMemoryUsage = async (
  options?: InvokeOptions
): Promise<[number, number]> => {
  return invokeRust('get_memory_usage', {}, options);
};

/**
 * 获取显示器支持的分辨率列表
 * @param options Tauri invoke 选项
 * @returns "WxH" 字符串数组（真实模式，按出现顺序去重）
 */
export const invokeGetDisplayResolutions = async (
  options?: InvokeOptions
): Promise<string[]> => {
  return invokeRust('get_display_resolutions', {}, options);
};

/**
 * 打开文件选择器让用户选择 Java 路径
 * @param options Tauri invoke 选项
 * @returns 选择的 Java 路径，取消返回 null
 */
export const invokeSelectJavaPath = async (
  options?: InvokeOptions
): Promise<string | null> => {
  return invokeRust('select_java_path', {}, options);
};

/**
 * 扫描所有已安装的实例
 * @param options Tauri invoke 选项
 * @returns 游戏实例列表
 */
export const invokeScanGames = async (
  options?: InvokeOptions
): Promise<GameInstance[]> => {
  return invokeRust('scan_games', {}, options);
};

/**
 * 获取单个实例详情
 * @param gameName 实例名称
 * @param options Tauri invoke 选项
 * @returns 实例信息，不存在返回 null
 */
export const invokeGetGame = async (
  gameName: string,
  options?: InvokeOptions
): Promise<GameInstance | null> => {
  logger.info('获取实例详情', { gameName });
  return await invokeRust("get_game", { game_name: gameName }, options);
};

/**
 * 创建新实例
 * @param name 实例名称
 * @param version Minecraft 版本号
 * @param loaderType 模组加载器类型
 * @param loaderVersion 加载器版本（可选）
 * @param iconPath 图标路径（可选）
 * @param options Tauri invoke 选项
 * @returns 新创建的实例
 */
export const invokeCreateGame = async (
  name: string,
  version: string,
  loaderType: string,
  loaderVersion?: string,
  iconPath?: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('创建实例', { name, version, loaderType });
  return await invokeRust("create_game", {
    name,
    version,
    loader_type: loaderType,
    loader_version: loaderVersion,
    icon_path: iconPath,
  }, options);
};

/**
 * 删除实例
 * @param gameName 实例名称
 * @param deleteFiles 是否同时删除文件（默认 false）
 * @param options Tauri invoke 选项
 */
export const invokeDeleteGame = async (
  gameName: string,
  deleteFiles: boolean = false,
  options?: InvokeOptions
): Promise<void> => {
  logger.info('删除实例', { gameName, deleteFiles });
  return await invokeRust("delete_game", { game_name: gameName, delete_files: deleteFiles }, options);
};

/**
 * 重命名实例
 * @param gameName 实例名称
 * @param newName 新名称
 * @param options Tauri invoke 选项
 * @returns 更新后的实例
 */
export const invokeRenameGame = async (
  gameName: string,
  newName: string,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('重命名实例', { gameName, newName });
  return await invokeRust("rename_game", { game_name: gameName, new_name: newName }, options);
};

/**
 * 更新实例属性
 * @param gameName 实例名称
 * @param name 新名称（可选）
 * @param enabled 是否启用（可选）
 * @param options Tauri invoke 选项
 * @returns 更新后的实例
 */
export const invokeUpdateGame = async (
  gameName: string,
  name?: string,
  enabled?: boolean,
  options?: InvokeOptions
): Promise<GameInstance> => {
  logger.info('更新实例', { gameName, name, enabled });
  return await invokeRust("update_game", { game_name: gameName, name, enabled }, options);
};

/**
 * 获取当前游戏根目录（.minecraft 所在目录）
 * @param options Tauri invoke 选项
 * @returns 游戏根目录绝对路径
 */
export const invokeGetGameRoot = async (
  options?: InvokeOptions
): Promise<string> => {
  logger.info('获取游戏根目录');
  return await invokeRust("get_game_root", {}, options);
};

/**
 * 切换游戏根目录（校验 + 持久化 + 运行时生效）
 * @param path 新的游戏根目录
 * @param options Tauri invoke 选项
 * @returns 生效后的游戏根目录
 */
export const invokeSetGameRoot = async (
  path: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('切换游戏根目录', { path });
  return await invokeRust("set_game_root", { path }, options);
};
