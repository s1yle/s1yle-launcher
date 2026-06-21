import { create } from "zustand";
import type { AccountInfo } from "@/api/types/account";
import {
  invokeGetAccountList,
  invokeGetCurrentAccount,
  invokeSetCurrentAccount,
  invokeDeleteAccount,
  invokeAddAccount,
  invokeAccInit,
} from "@/api/account";

interface AccountState {
  accounts: AccountInfo[];
  currentAccount: AccountInfo | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  setCurrentAccount: (uuid: string) => Promise<void>;
  addAccount: (
    name: string,
    type: "microsoft" | "offline",
    accessToken?: string,
    refreshToken?: string
  ) => Promise<string>;
  deleteAccount: (uuid: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  currentAccount: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      await invokeAccInit();
      const [accounts, current] = await Promise.all([
        invokeGetAccountList(),
        invokeGetCurrentAccount(),
      ]);
      set({
        accounts,
        currentAccount: current,
        initialized: true,
        loading: false,
      });
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  loadAccounts: async () => {
    set({ loading: true });
    try {
      const [accounts, current] = await Promise.all([
        invokeGetAccountList(),
        invokeGetCurrentAccount(),
      ]);
      set({ accounts, currentAccount: current, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setCurrentAccount: async (uuid: string) => {
    await invokeSetCurrentAccount(uuid);
    const current = await invokeGetCurrentAccount();
    set({ currentAccount: current });
  },

  addAccount: async (name, type, accessToken, refreshToken) => {
    const result = await invokeAddAccount(name, type, accessToken, refreshToken);
    await get().loadAccounts();
    return result;
  },

  deleteAccount: async (uuid: string) => {
    await invokeDeleteAccount(uuid);
    const { currentAccount } = get();
    if (currentAccount?.uuid === uuid) {
      set({ currentAccount: null });
    }
    await get().loadAccounts();
  },
}));
