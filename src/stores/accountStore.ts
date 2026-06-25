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

/**
 * 账户管理 Store 的内部状态接口
 *
 * 管理 Minecraft 账户的增删改查，支持 Microsoft 和离线账户类型。
 */
interface AccountState {
  /** 所有已添加的账户列表 */
  accounts: AccountInfo[];
  /** 当前选中的活跃账户 */
  currentAccount: AccountInfo | null;
  /** 是否正在加载中 */
  loading: boolean;
  /** 是否已完成初始化 */
  initialized: boolean;

  /** 初始化 Store，拉取账户列表和当前账户 */
  initialize: () => Promise<void>;
  /** 重新加载账户列表和当前账户 */
  loadAccounts: () => Promise<void>;
  /** 切换当前活跃账户 */
  setCurrentAccount: (uuid: string) => Promise<void>;
  /** 添加新账户（microsoft 或 offline 类型） */
  addAccount: (
    name: string,
    type: "microsoft" | "offline",
    accessToken?: string,
    refreshToken?: string
  ) => Promise<string>;
  /** 删除指定 UUID 的账户 */
  deleteAccount: (uuid: string) => Promise<void>;
}

/**
 * 账户管理 Store
 *
 * 功能:
 * - 初始化时自动拉取账户列表和当前选中账户
 * - 支持 Microsoft 和离线两种登录方式
 * - 提供 setCurrentAccount 切换当前活跃账户
 * - 删除账户后自动切换到下一个可用账户
 */
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
