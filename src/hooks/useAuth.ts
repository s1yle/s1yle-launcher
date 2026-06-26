import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { useUserRoleStore, UserRole } from "@/stores/userRoleStore";
import { AccountType } from "@/api";
import { saveLoginState, clearLoginState } from "@/helper";
import { createMainWindow, closeLoginWindow, logoutAndShowLogin } from "@/api/window";

export function useAuth() {
  const loginAsPlayer = useCallback(async (uuid: string) => {
    const accountStore = useAuthStore.getState();
    await accountStore.setCurrentAccount(uuid);

    const currentAccount = useAuthStore.getState().currentAccount;
    if (!currentAccount) throw new Error("账户设置失败");

    useAuthStore.getState().setLoggedIn();
    useUserRoleStore.getState().switchRole(UserRole.PLAYER, false);

    await saveLoginState({
      is_logged_in: true,
      logged_in_type: currentAccount.account_type,
      current_acc_uuid: uuid,
      login_time: new Date().toISOString(),
    });

    await createMainWindow();
    setTimeout(() => closeLoginWindow().catch(() => { }), 300);
  }, []);

  const loginAsAdmin = useCallback(async (
    email: string,
    password: string,
    isRegister: boolean,
  ): Promise<boolean> => {
    const adminStore = useAdminStore.getState();
    const ok = isRegister
      ? await adminStore.register(email, password)
      : await adminStore.login(email, password);

    if (!ok) return false;

    useAuthStore.getState().setLoggedIn();
    useUserRoleStore.getState().switchRole(UserRole.ADMIN, false);

    await saveLoginState({
      is_logged_in: true,
      logged_in_type: AccountType.Admin,
      current_acc_uuid: null,
      login_time: new Date().toISOString(),
    });

    await createMainWindow();
    setTimeout(() => closeLoginWindow().catch(() => { }), 300);
    return true;
  }, []);

  const logout = useCallback(async () => {
    useAdminStore.getState().logout();
    useAuthStore.getState().setLoggedOut();
    await clearLoginState();
    await logoutAndShowLogin();
  }, []);

  return { loginAsPlayer, loginAsAdmin, logout };
}
