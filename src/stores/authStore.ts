import { AccountType } from '@/api';
import type { AccountInfo } from '@/api/types/account';
import type { StoreLoginState } from '@/api/types/config';
import {
  invokeGetAccountList,
  invokeGetCurrentAccount,
  invokeSetCurrentAccount,
  invokeDeleteAccount,
  invokeAddPlayerAccount, invokeAddAdminAccount,
  invokeAccInit,
} from '@/api/account';
import { invokeGetConfig } from '@/api/config';
import { saveLoginState, clearLoginState, switchWindow } from '@/helper';
import { useAdminStore } from './adminStore';
import { useUserRoleStore, UserRole } from './userRoleStore';
import { create } from 'zustand';

const DEFAULT_LOGIN_STATE: StoreLoginState = {
  is_logged_in: false,
  logged_in_type: 'none',
  current_acc_uuid: null,
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
  loginAsAdmin: (email: string, password: string, isRegister: boolean) => Promise<boolean>;
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
      const [accounts, current, config] = await Promise.all([
        invokeGetAccountList(),
        invokeGetCurrentAccount(),
        invokeGetConfig(),
      ]);
      set({
        accounts,
        currentAccount: current,
        loginState: config.login_state ?? { ...DEFAULT_LOGIN_STATE },
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
      const config = await invokeGetConfig();
      set({ loginState: config.login_state ?? { ...DEFAULT_LOGIN_STATE } });
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
      current_acc_uuid: uuid,
      login_time: new Date().toISOString(),
    });

    await get().refreshLoginState();
    await switchWindow("login", "Main");
  },

  loginAsAdmin: async (email: string, password: string, isRegister: boolean) => {
    const adminStore = useAdminStore.getState();
    const ok = isRegister
      ? await adminStore.register(email, password)
      : await adminStore.login(email, password);

    // 持久化存储admin account
    if (isRegister) {
      if (adminStore.session) {
        await invokeAddAdminAccount(
          adminStore.session?.email,
          adminStore.session?.adminId,
          adminStore.session?.bound_player_uuids,
          adminStore.session?.loginTime
        );
      } else {
        await invokeAddAdminAccount(
          "unknown",
          "unknown",
          ["unknown"],
          "1970/1/1"
        );
      }
      await get().loadAccounts();
    }

    if (!ok) return false;

    useUserRoleStore.getState().switchRole(UserRole.ADMIN, false);

    await saveLoginState({
      is_logged_in: true,
      logged_in_type: AccountType.Admin,
      current_acc_uuid: null,
      login_time: new Date().toISOString(),
    });

    await get().refreshLoginState();
    await switchWindow("login", "Main");
    return true;
  },

  logout: async () => {
    useAdminStore.getState().logout();
    await clearLoginState();
    await get().refreshLoginState();
    await switchWindow("main", "Login");
  },
}));
