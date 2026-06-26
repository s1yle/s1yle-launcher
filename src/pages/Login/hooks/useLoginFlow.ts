import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { useUserRoleStore, UserRole } from "@/stores/userRoleStore";
import { useAuth } from "@/hooks";

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

  const { loginAsPlayer, loginAsAdmin } = useAuth();
  const accounts = useAuthStore((s) => s.accounts);
  const loadAccounts = useAuthStore((s) => s.loadAccounts);
  const addAccount = useAuthStore((s) => s.addAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const handlePlayerLogin = useCallback(async (uuid?: string) => {
    if (!uuid) return;
    await loginAsPlayer(uuid);
  }, [loginAsPlayer]);

  const handleAdminAuth = useCallback(async (email: string, password: string, isRegister: boolean) => {
    return await loginAsAdmin(email, password, isRegister);
  }, [loginAsAdmin]);

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
    await deleteAccount(uuid);
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
