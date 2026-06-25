import { useState, useCallback } from "react";
import { useLoginStore } from "@/stores/loginStore";
import { useAccountStore } from "@/stores/accountStore";
import { useAdminStore } from "@/stores/adminStore";
import { useUserRoleStore, UserRole } from "@/stores/userRoleStore";

/**
 * 登录流程视图类型
 * - player-login: 玩家登录
 * - player-add: 添加玩家账户
 * - admin-login: 管理员登录
 * - admin-register: 管理员注册
 */
export type LoginView = "player-login" | "player-add" | "admin-login" | "admin-register";

const VIEW_STACK: Record<LoginView, LoginView | null> = {
  "player-login": null,
  "player-add": "player-login",
  "admin-login": "player-login",
  "admin-register": "admin-login",
};

/**
 * 登录流程控制 hook - 管理角色选择、视图切换、账户操作
 * @returns 登录流程的状态和方法
 */
export function useLoginFlow() {
  const [view, setView] = useState<LoginView>("player-login");
  const [role, setRole] = useState<"player" | "admin">("player");

  const setLoggedIn = useLoginStore((s) => s.setLoggedIn);
  const switchRole = useUserRoleStore((s) => s.switchRole);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);
  const setCurrentAccount = useAccountStore((s) => s.setCurrentAccount);
  const addAccount = useAccountStore((s) => s.addAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);
  const adminLogin = useAdminStore((s) => s.login);
  const adminRegister = useAdminStore((s) => s.register);

  const handlePlayerLogin = useCallback(async (uuid?: string) => {
    if (!uuid) return;
    try {
      await setCurrentAccount(uuid);
      setLoggedIn();
      switchRole(UserRole.PLAYER, false);
      const { createMainWindow, closeLoginWindow } = await import("@/api/window");
      createMainWindow().catch(() => {});
      setTimeout(() => closeLoginWindow().catch(() => {}), 300);
    } catch (e) {
      throw e;
    }
  }, [setCurrentAccount, setLoggedIn, switchRole]);

  const handleAdminAuth = useCallback(async (email: string, password: string, isRegister: boolean) => {
    try {
      const ok = isRegister
        ? await adminRegister(email, password)
        : await adminLogin(email, password);
      if (ok) {
        setLoggedIn();
        switchRole(UserRole.ADMIN, false);
        const { createMainWindow, closeLoginWindow } = await import("@/api/window");
        createMainWindow().catch(() => {});
        setTimeout(() => closeLoginWindow().catch(() => {}), 300);
      }
      return ok;
    } catch (e) {
      throw e;
    }
  }, [adminLogin, adminRegister, setLoggedIn, switchRole]);

  const navigateTo = useCallback((target: LoginView) => {
    setView(target);
  }, []);

  const goBack = useCallback(() => {
    const prev = VIEW_STACK[view];
    if (prev) setView(prev);
  }, [view]);

  const selectRole = useCallback((r: "player" | "admin") => {
    setRole(r);
    if (r === "player") {
      setView(accounts.length > 0 ? "player-login" : "player-add");
    } else {
      setView("admin-login");
    }
  }, [accounts.length]);

  const handleDeleteAccount = useCallback(async (uuid: string) => {
    try {
      await deleteAccount(uuid);
    } catch (e) {
      throw e;
    }
  }, [deleteAccount]);

  return {
    view,
    role,
    accounts,
    loadAccounts,
    addAccount,
    selectRole,
    navigateTo,
    goBack,
    handlePlayerLogin,
    handleAdminAuth,
    handleDeleteAccount,
  };
}
