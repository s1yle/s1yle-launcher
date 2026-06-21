import { invokeRust } from "./client";
import { logger } from "@/helper/logger";
import type { AdminSession, AdminAccountInfo } from "./types/account";

export const invokeRegisterAdmin = async (
  email: string,
  password: string
): Promise<AdminSession> => {
  logger.info("注册管理员账号", { email });
  return await invokeRust("register_admin", { email, password });
};

export const invokeLoginAdmin = async (
  email: string,
  password: string
): Promise<AdminSession> => {
  logger.info("管理员登录", { email });
  return await invokeRust("login_admin", { email, password });
};

export const invokeBindPlayerToAdmin = async (
  email: string,
  playerUuid: string
): Promise<void> => {
  logger.info("绑定玩家到管理员", { email, playerUuid });
  await invokeRust("bind_player_to_admin", { email, playerUuid });
};

export const invokeUnbindPlayerFromAdmin = async (
  email: string,
  playerUuid: string
): Promise<void> => {
  logger.info("解绑玩家", { email, playerUuid });
  await invokeRust("unbind_player_from_admin", { email, playerUuid });
};

export const invokeGetAdminInfo = async (
  email: string
): Promise<AdminAccountInfo | null> => {
  logger.info("获取管理员信息", { email });
  return await invokeRust("get_admin_info", { email });
};

export const invokeGetBoundPlayers = async (
  email: string
): Promise<string[]> => {
  logger.info("获取绑定的玩家", { email });
  return await invokeRust("get_bound_players", { email });
};

export const invokeIsAdminRegistered = async (): Promise<boolean> => {
  logger.info("检查是否有管理员注册");
  return await invokeRust("is_admin_registered");
};

export const invokeInitializeAdminSystem = async (): Promise<void> => {
  logger.info("初始化管理员系统");
  await invokeRust("initialize_admin_system");
};
