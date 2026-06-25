import { create } from "zustand";
import type { AdminSession } from "@/api/admin";
import { apiRegisterAdmin, apiLoginAdmin, apiLogoutAdmin, apiRefreshAdmin, apiBindPlayer, apiUnbindPlayer } from "@/api/admin";
import { initAuth } from "@/api/auth";

/**
 * 管理员认证 Store 的内部状态接口
 *
 * 管理与服主后台相关的认证流程，包括注册、登录、登出以及玩家绑定。
 */
interface AdminState {
  /** 当前管理员会话信息 */
  session: AdminSession | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 操作是否正在加载中 */
  loading: boolean;
  /** 最近一次操作的错误信息 */
  error: string | null;

  /** 初始化认证并尝试刷新会话 */
  init: () => Promise<void>;
  /** 使用邮箱和密码注册管理员账号 */
  register: (email: string, password: string) => Promise<boolean>;
  /** 使用邮箱和密码登录管理员账号 */
  login: (email: string, password: string) => Promise<boolean>;
  /** 登出当前管理员账号 */
  logout: () => Promise<void>;
  /** 将指定玩家 UUID 绑定到当前管理员 */
  bindPlayer: (playerUuid: string) => Promise<void>;
  /** 解绑指定玩家 UUID */
  unbindPlayer: (playerUuid: string) => Promise<void>;
  /** 清除错误信息 */
  clearError: () => void;
}

/**
 * 管理员认证 Store
 *
 * 功能:
 * - 管理管理员会话的生命周期（注册/登录/登出/刷新）
 * - 管理绑定的玩家列表（bindPlayer/unbindPlayer）
 * - 自动从持久化 Token 恢复会话（init）
 */
export const useAdminStore = create<AdminState>()((set, get) => ({
  session: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  init: async () => {
    const ok = await initAuth();
    if (ok) {
      const session = await apiRefreshAdmin();
      if (session) {
        set({ session, isLoggedIn: true });
      }
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const session = await apiRegisterAdmin(email, password);
      set({ session, isLoggedIn: true, loading: false });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "注册失败";
      set({ error: msg, loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const session = await apiLoginAdmin(email, password);
      set({ session, isLoggedIn: true, loading: false });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "登录失败";
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: async () => {
    await apiLogoutAdmin();
    set({ session: null, isLoggedIn: false, error: null });
  },

  bindPlayer: async (playerUuid) => {
    const session = get().session;
    if (!session) throw new Error("未登录");
    await apiBindPlayer(playerUuid);
    set({
      session: {
        ...session,
        bound_player_uuids: [...session.bound_player_uuids, playerUuid],
      },
    });
  },

  unbindPlayer: async (playerUuid) => {
    const session = get().session;
    if (!session) throw new Error("未登录");
    await apiUnbindPlayer(playerUuid);
    set({
      session: {
        ...session,
        bound_player_uuids: session.bound_player_uuids.filter(
          (uuid) => uuid !== playerUuid
        ),
      },
    });
  },

  clearError: () => set({ error: null }),
}));
