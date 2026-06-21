import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminSession } from "@/api/types/account";
import {
  invokeRegisterAdmin,
  invokeLoginAdmin,
  invokeBindPlayerToAdmin,
  invokeUnbindPlayerFromAdmin,
} from "@/api/admin";

interface AdminState {
  session: AdminSession | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;

  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  bindPlayer: (playerUuid: string) => Promise<void>;
  unbindPlayer: (playerUuid: string) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoggedIn: false,
      loading: false,
      error: null,

      register: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const session = await invokeRegisterAdmin(email, password);
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
          const session = await invokeLoginAdmin(email, password);
          set({ session, isLoggedIn: true, loading: false });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "登录失败";
          set({ error: msg, loading: false });
          return false;
        }
      },

      logout: () => {
        set({ session: null, isLoggedIn: false, error: null });
      },

      bindPlayer: async (playerUuid) => {
        const session = get().session;
        if (!session) throw new Error("未登录");
        await invokeBindPlayerToAdmin(session.email, playerUuid);
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
        await invokeUnbindPlayerFromAdmin(session.email, playerUuid);
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
    }),
    {
      name: "admin-storage",
      partialize: (state) => ({
        session: state.session,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
