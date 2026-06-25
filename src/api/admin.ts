import { postAuthRegister, postAuthLogin, postAuthLogout, postAuthRefresh, getAuthCheck, getAdminInfo, getAdminBoundPlayers, postAdminBind, deleteAdminBindByUuid } from '@/server/sdk.gen';
import { setTokens, clearTokens, getRefreshToken } from '@/api/auth';
import type { ModelsAdminInfo, ModelsBoundPlayer } from '@/server/types.gen';

export interface AdminSession {
  email: string;
  adminId: string;
  bound_player_uuids: string[];
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

export const apiRegisterAdmin = async (email: string, password: string): Promise<AdminSession> => {
  const { data, error } = await postAuthRegister({ body: { email, password } });
  if (error || !data) throw new Error((error as any)?.message ?? '注册失败');
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

export const apiLoginAdmin = async (email: string, password: string): Promise<AdminSession> => {
  const { data, error } = await postAuthLogin({ body: { email, password } });
  if (error || !data) throw new Error((error as any)?.message ?? '登录失败');
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

export const apiLogoutAdmin = async (): Promise<void> => {
  const rt = getRefreshToken();
  if (rt) {
    await postAuthLogout({ body: { refresh_token: rt } }).catch(() => {});
  }
  clearTokens();
};

export const apiRefreshAdmin = async (): Promise<AdminSession | null> => {
  const rt = getRefreshToken();
  if (!rt) return null;
  const { data, error } = await postAuthRefresh({ body: { refresh_token: rt } });
  if (error || !data) return null;
  setTokens(data.access_token ?? '', data.refresh_token ?? '');
  return mapAdminInfo(data.admin ?? {});
};

export const apiFetchAdminInfo = async (): Promise<AdminSession | null> => {
  const { data, error } = await getAdminInfo();
  if (error || !data) return null;
  return mapAdminInfo(data);
};

export const apiFetchBoundPlayers = async (): Promise<ModelsBoundPlayer[]> => {
  const { data } = await getAdminBoundPlayers();
  return data ?? [];
};

export const apiBindPlayer = async (playerUuid: string, playerName?: string): Promise<void> => {
  const { error } = await postAdminBind({ body: { player_uuid: playerUuid, player_name: playerName } });
  if (error) throw new Error((error as any)?.message ?? '绑定失败');
};

export const apiUnbindPlayer = async (uuid: string): Promise<void> => {
  const { error } = await deleteAdminBindByUuid({ path: { uuid } });
  if (error) throw new Error((error as any)?.message ?? '解绑失败');
};

export const apiCheckAdminRegistered = async (): Promise<boolean> => {
  const { data } = await getAuthCheck();
  return data?.registered ?? false;
};
