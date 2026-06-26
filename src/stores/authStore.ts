import { AccountType } from '@/api';
import type { AccountInfo } from '@/api/types/account';
import {
  invokeGetAccountList,
  invokeGetCurrentAccount,
  invokeSetCurrentAccount,
  invokeDeleteAccount,
  invokeAddAccount,
  invokeAccInit,
} from '@/api/account';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LOGIN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthState {
  isLoggedIn: boolean;
  loggedInType: AccountType;
  loginTime: number | null;
  accounts: AccountInfo[];
  currentAccount: AccountInfo | null;
  loading: boolean;
  initialized: boolean;

  setLoggedIn: () => void;
  setLoggedOut: () => void;
  setLoggedInType: (type: AccountType) => void;
  checkLoginStatus: () => boolean;

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      loginTime: null,
      loggedInType: AccountType.None,
      accounts: [],
      currentAccount: null,
      loading: false,
      initialized: false,

      setLoggedIn: () => {
        set({ isLoggedIn: true, loginTime: Date.now() });
      },
      setLoggedOut: () => {
        set({ isLoggedIn: false, loginTime: null, loggedInType: AccountType.None });
      },
      setLoggedInType: (type: AccountType) => {
        set({ loggedInType: type });
      },
      checkLoginStatus: () => {
        const { loginTime } = get();
        if (!loginTime) return false;
        const now = Date.now();
        const isExpired = (now - loginTime) > LOGIN_EXPIRY_MS;
        if (isExpired) {
          set({ isLoggedIn: false, loginTime: null });
          return false;
        }
        return true;
      },

      initialize: async () => {
        if (get().initialized) return;
        set({ loading: true });
        try {
          await invokeAccInit();
          const [accounts, current] = await Promise.all([
            invokeGetAccountList(),
            invokeGetCurrentAccount(),
          ]);
          set({ accounts, currentAccount: current, initialized: true, loading: false });
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
    }),
    {
      name: 'login-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        loginTime: state.loginTime,
        loggedInType: state.loggedInType,
      }),
    }
  )
);
