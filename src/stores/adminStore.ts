import { create } from "zustand";
import type { AdminSession } from "@/api/admin";
import { apiRegisterAdmin, apiLoginAdmin, apiLogoutAdmin, apiRefreshAdmin, apiBindPlayer, apiUnbindPlayer } from "@/api/admin";
import { initAuth } from "@/api/auth";

interface AdminState {
  session: AdminSession | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  bindPlayer: (playerUuid: string) => Promise<void>;
  unbindPlayer: (playerUuid: string) => Promise<void>;
  clearError: () => void;
}

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
