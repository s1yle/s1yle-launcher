import { postAuthRegister, postAuthLogin, postAuthLogout, postAuthRefresh, getAuthCheck, getAdminInfo, getAdminBoundPlayers, postAdminBind, deleteAdminBindByUuid } from '@/server/sdk.gen';
import { setTokens, clearTokens, getRefreshToken } from '@/api/auth';
import type { ModelsAdminInfo, ModelsBoundPlayer } from '@/server/types.gen';

/** 管理员会话信息 */
export interface AdminSession {
  /** 管理员邮箱 */
  email: string;
  /** 管理员 ID */
  adminId: string;
  /** 已绑定的玩家 UUID 列表 */
  bound_player_uuids: string[];
  /** 创建时间 */
  createdAt: string;
}

function mapAdminInfo(info: ModelsAdminInfo): AdminSession {
  return {
    email: info.email ?? '',
    adminId: info.id ?? '',
    bound_player_uuids: info.bound_players ?? [],
    createdAt: info.created_at ?? '',
  };
}

/**
 * 注册管理员账户
 * @param email 邮箱
 * @param password 密码
 * @returns 管理员会话信息
 */
export const apiRegisterAdmin = async (email: string, password: string): Promise<AdminSession> => {
  const { data, error } = await postAuthRegister({ body: { email, password } });
  if (error || !data) throw new Error((error as any)?.message ?? '注册失败');
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

/**
 * 管理员登录
 * @param email 邮箱
 * @param password 密码
 * @returns 管理员会话信息
 */
export const apiLoginAdmin = async (email: string, password: string): Promise<AdminSession> => {
  const { data, error } = await postAuthLogin({ body: { email, password } });
  if (error || !data) throw new Error((error as any)?.message ?? '登录失败');
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

/** 管理员退出登录 */
export const apiLogoutAdmin = async (): Promise<void> => {
  const rt = getRefreshToken();
  if (rt) {
    await postAuthLogout({ body: { refresh_token: rt } }).catch(() => {});
  }
  clearTokens();
};

/**
 * 刷新管理员令牌
 * @returns 新的管理员会话信息，刷新失败返回 null
 */
export const apiRefreshAdmin = async (): Promise<AdminSession | null> => {
  const rt = getRefreshToken();
  if (!rt) return null;
  const { data, error } = await postAuthRefresh({ body: { refresh_token: rt } });
  if (error || !data) return null;
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

/**
 * 获取管理员信息
 * @returns 管理员会话信息，未登录返回 null
 */
export const apiFetchAdminInfo = async (): Promise<AdminSession | null> => {
  const { data, error } = await getAdminInfo();
  if (error || !data) return null;
  return mapAdminInfo(data);
};

/**
 * 获取已绑定的玩家列表
 * @returns 已绑定的玩家数组
 */
export const apiFetchBoundPlayers = async (): Promise<ModelsBoundPlayer[]> => {
  const { data } = await getAdminBoundPlayers();
  return data ?? [];
};

/**
 * 绑定玩家到管理员账号
 * @param playerUuid 玩家 UUID
 * @param playerName 玩家名称（可选）
 */
export const apiBindPlayer = async (playerUuid: string, playerName?: string): Promise<void> => {
  const { error } = await postAdminBind({ body: { player_uuid: playerUuid, player_name: playerName } });
  if (error) throw new Error((error as any)?.message ?? '绑定失败');
};

/**
 * 解绑玩家
 * @param uuid 要解绑的玩家 UUID
 */
export const apiUnbindPlayer = async (uuid: string): Promise<void> => {
  const { error } = await deleteAdminBindByUuid({ path: { uuid } });
  if (error) throw new Error((error as any)?.message ?? '解绑失败');
};

/**
 * 检查服务端是否已注册管理员
 * @returns 是否已注册
 */
export const apiCheckAdminRegistered = async (): Promise<boolean> => {
  const { data } = await getAuthCheck();
  return data?.registered ?? false;
};
