import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useLoginFlow } from "./hooks/useLoginFlow";
import { RoleSelector } from "./components/RoleSelector";
import { ViewContainer } from "./components/ViewContainer";
import { PlayerLogin } from "./views/PlayerLogin";
import { PlayerAdd } from "./views/PlayerAdd";
import { AdminLogin } from "./views/AdminLogin";
import { AdminRegister } from "./views/AdminRegister";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/common/NotificationProvider";
import { useWindowPosition } from "@/hooks";

/** 登录门禁内部组件 - 管理登录流程的视图渲染 */
const LoginGateInner = () => {
  // useLoginFlow hook
  const {
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
  } = useLoginFlow();

  useWindowPosition();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('scrollbar-hide');
    return () => {
      document.documentElement.classList.remove('scrollbar-hide');
    };
  }, []);

  useEffect(() => {
    const fixSize = async () => {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const { PhysicalSize } = await import('@tauri-apps/api/dpi');
        const win = getCurrentWebviewWindow();
        await win.setSize(new PhysicalSize(480, 640));
        await win.setResizable(false);
      } catch { }
    };
    fixSize();
  }, []);

  return (
    <div
      className="h-screen w-screen flex flex-col relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Header type="main" title="WeCraft! Launcher" />

      <div
        className="flex-1 flex flex-col 
          items-center justify-center 
          relative"
      >
        <div className="flex flex-col items-center gap-4 py-4 px-6 w-full max-w-md">

          <div className="absolute top-5">

            <RoleSelector selected={role} onSelect={selectRole} className="absolute top-5" />
          </div>

          <ViewContainer view={view}>
            {view === "player-login" && (
              <PlayerLogin
                accounts={accounts}
                onLogin={handlePlayerLogin}
                onDeleteAccount={handleDeleteAccount}
                onNavigate={navigateTo}
              />
            )}
            {view === "player-add" && (
              <PlayerAdd
                onAdd={addAccount}
                onBack={goBack}
              />
            )}
            {view === "admin-login" && (
              <AdminLogin
                onLogin={(email, password) => handleAdminAuth(email, password, false)}
                onNavigate={() => navigateTo("admin-register")}
              />
            )}
            {view === "admin-register" && (
              <AdminRegister
                onRegister={(email, password) => handleAdminAuth(email, password, true)}
                onBack={goBack}
              />
            )}
          </ViewContainer>

          <p className="text-[10px] text-[var(--color-text-secondary)]/50">
            WeCraft! Launcher v0.1.0-alpha.2
          </p>

        </div>
      </div>
    </div>
  );
};

/** 登录门禁组件 - 玩家/管理员登录/注册的入口包装 */
const LoginGate = () => (
  <NotificationProvider>
    <LoginGateInner />
  </NotificationProvider>
);

export default LoginGate;
