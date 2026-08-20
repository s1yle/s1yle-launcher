import { AccountType } from '@/api';
import type { AccountInfo } from '@/api/types/account';
import type { StoreLoginState } from '@/api/types/config';
import {
  invokeGetAccountList,
  invokeGetCurrentAccount,
  invokeSetCurrentAccount,
  invokeDeleteAccount,
  invokeAddPlayerAccount,
  invokeAccInit,
} from '@/api/account';
import { invokeGetLoginState } from '@/api/config';
import { saveLoginState, clearLoginState } from '@/helper';
import { navigateTo } from '@/router/navigationBridge';
import { useUserRoleStore, UserRole } from './userRoleStore';
import { create } from 'zustand';

const DEFAULT_LOGIN_STATE: StoreLoginState = {
  is_logged_in: false,
  logged_in_type: 'none',
  login_time: '',
};

interface AuthState {
  accounts: AccountInfo[];
  currentAccount: AccountInfo | null;
  loading: boolean;
  initialized: boolean;
  loginState: StoreLoginState;

  initialize: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  setCurrentAccount: (uuid: string) => Promise<void>;
  addAccount: (
    name: string,
    type: AccountType,
    accessToken?: string,
    refreshToken?: string
  ) => Promise<string>;
  deleteAccount: (uuid: string) => Promise<void>;
  refreshLoginState: () => Promise<void>;
  loginAsPlayer: (uuid: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  accounts: [],
  currentAccount: null,
  loading: false,
  initialized: false,
  loginState: { ...DEFAULT_LOGIN_STATE },

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      await invokeAccInit();
      const [accounts, current, loginState] = await Promise.all([
        invokeGetAccountList(),
        invokeGetCurrentAccount(),
        invokeGetLoginState(),
      ]);
      set({
        accounts,
        currentAccount: current,
        loginState,
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
  refreshLoginState: async () => {
    try {
      const loginState = await invokeGetLoginState();
      set({ loginState });
    } catch {
      // 静默失败，保持上次状态
    }
  },
  setCurrentAccount: async (uuid: string) => {
    await invokeSetCurrentAccount(uuid);
    const current = await invokeGetCurrentAccount();
    set({ currentAccount: current });
  },
  addAccount: async (name, type, accessToken, refreshToken) => {
    const result = await invokeAddPlayerAccount(name, type, accessToken, refreshToken);
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

  loginAsPlayer: async (uuid: string) => {
    const { setCurrentAccount } = get();
    await setCurrentAccount(uuid);

    const account = get().currentAccount;
    if (!account) throw new Error("账户设置失败");

    useUserRoleStore.getState().switchRole(UserRole.PLAYER, false);

    await saveLoginState({
      is_logged_in: true,
      logged_in_type: account.account_type,
      login_time: new Date().toISOString(),
    });

    await get().refreshLoginState();
    navigateTo('/');
  },


  logout: async () => {
    await clearLoginState();
    await get().refreshLoginState();
    navigateTo('/login');
  },
}));
