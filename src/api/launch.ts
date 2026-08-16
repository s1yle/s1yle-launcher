import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import { LaunchStatus } from "./types/launch";
import type {
  GameLogResult,
  LaunchConfig,
  LaunchGameInfo,
  LaunchStatusInfo,
} from "./types/launch";

/**
 * 启动 Minecraft 游戏（成功返回游戏会话唯一 ID，同一游戏目录可多开）
 * @param config 启动配置（可选）
 * @param options Tauri invoke 选项
 * @returns 游戏会话唯一 ID
 */
export const invokeLaunchGame = async (
  config?: LaunchConfig,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('启动Minecraft游戏');
  const result = await invokeRust("front_launch_game", {
    config: config || null,
  }, options);
  return result;
};

/**
 * 停止 Minecraft 游戏；不传 gameId 时停止全部游戏会话
 * @param gameId 游戏会话唯一 ID，可选
 * @param options Tauri invoke 选项
 */
export const invokeStopGame = async (
  gameId?: string,
  options?: InvokeOptions
): Promise<string> => {
  logger.info('停止Minecraft游戏', { gameId });
  const result = await invokeRust("front_stop_game", {
    gameId: gameId ?? null,
  }, options);
  return result;
};

/**
 * 获取指定游戏会话的启动状态与真实进度
 * @param gameId 游戏会话唯一 ID
 * @param options Tauri invoke 选项
 * @returns 该游戏会话的状态 + 进度快照
 */
export const invokeGetLaunchStatusByKey = async (
  gameId: string,
  options?: InvokeOptions
): Promise<LaunchStatusInfo> => {
  try {
    const result = await invokeRust("front_get_launch_status_by_key", { gameId }, options);
    if (
      typeof result === 'object' &&
      result !== null &&
      'status' in result &&
      typeof result.progress === 'number'
    ) {
      return result as unknown as LaunchStatusInfo;
    }
    logger.warn(`未知的启动状态快照: ${JSON.stringify(result)}，返回Idle`);
    return { status: LaunchStatus.Idle, progress: 0, stage: '' };
  } catch (e) {
    logger.error('获取游戏会话启动状态失败:', e);
    return { status: LaunchStatus.Idle, progress: 0, stage: '' };
  }
};

/**
 * 获取全部运行游戏会话的快照列表
 * @param options Tauri invoke 选项
 * @returns 游戏会话快照数组
 */
export const invokeGetLaunchGames = async (
  options?: InvokeOptions
): Promise<LaunchGameInfo[]> => {
  logger.info('获取全部启动游戏会话');
  const result = await invokeRust("front_get_launch_games", {}, options);
  return Array.isArray(result) ? result as LaunchGameInfo[] : [];
};

/**
 * 增量拉取指定游戏会话的捕获日志
 * @param gameId 游戏会话唯一 ID
 * @param offset 上次拉取游标（0 表示全量）
 * @param options Tauri invoke 选项
 * @returns 日志增量 + 新游标
 */
export const invokeGetGameLog = async (
  gameId: string,
  offset: number,
  options?: InvokeOptions
): Promise<GameLogResult> => {
  const result = await invokeRust("front_get_game_log", { gameId, offset }, options);
  if (typeof result !== 'object' || result === null || !Array.isArray(result.lines)) {
    throw new Error("无效的游戏日志格式");
  }
  return result as GameLogResult;
};