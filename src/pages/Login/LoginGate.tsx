import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ViewContainer } from "./components/ViewContainer";
import { PlayerLogin } from "./views/PlayerLogin";
import { PlayerAdd } from "./views/PlayerAdd";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/common/NotificationProvider";
import { useWindowPosition } from "@/hooks";
import { useThemeStore } from "@/stores";

export type LoginView = "player-login" | "player-add";

const VIEW_STACK: Record<LoginView, LoginView | null> = {
  "player-login": null,
  "player-add": "player-login",
};

const LoginGateInner = () => {
  const [view, setView] = useState<LoginView>("player-login");
  const accounts = useAuthStore((s) => s.accounts);
  const addAccount = useAuthStore((s) => s.addAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const initTheme = useThemeStore((s) => s.init);

  useWindowPosition();

  useEffect(() => {
    useAuthStore.getState().initialize();
    initTheme();
  }, [initTheme]);

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

  const handlePlayerLogin = useCallback(async (uuid?: string) => {
    if (!uuid) return;
    await loginAsPlayer(uuid);
  }, [loginAsPlayer]);

  const navigateTo = useCallback((target: LoginView) => {
    setView(target);
  }, []);

  const goBack = useCallback(() => {
    const prev = VIEW_STACK[view];
    if (prev) setView(prev);
  }, [view]);

  const handleDeleteAccount = useCallback(async (uuid: string) => {
    await deleteAccount(uuid);
  }, [deleteAccount]);

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
          </ViewContainer>

          <p className="text-[10px] text-[var(--color-text-secondary)]/50">
            WeCraft! Launcher v0.1.0-alpha.2
          </p>

        </div>
      </div>
    </div>
  );
};

const LoginGate = () => (
  <NotificationProvider>
    <LoginGateInner />
  </NotificationProvider>
);

export default LoginGate;
