import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Server,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLoginStore } from "@/stores/loginStore";
import { useAccountStore } from "@/stores/accountStore";
import { useAdminStore } from "@/stores/adminStore";
import { useUserRoleStore, UserRole } from "@/stores/userRoleStore";
import { IconButton, SkinAvatar } from "@/components/common";

type View = "player-login" | "player-add" | "admin-login" | "admin-register";

const VIEWS: View[] = ["player-login", "player-add", "admin-login", "admin-register"];

const LoginGate = () => {
  const [view, setView] = useState<View>("player-login");
  const currentIndex = VIEWS.indexOf(view);

  useEffect(() => {
    useAccountStore.getState().initialize();
  }, []);

  useEffect(() => {
    const fixSize = async () => {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const { PhysicalSize } = await import('@tauri-apps/api/dpi');
        const win = getCurrentWebviewWindow();
        await win.setSize(new PhysicalSize(480, 640));
        await win.setResizable(false);
      } catch {}
    };
    fixSize();
  }, []);

  const handleRoleSelect = (role: "player" | "admin") => {
    if (role === "player") {
      const { accounts } = useAccountStore.getState();
      setView(accounts.length > 0 ? "player-login" : "player-add");
    } else {
      setView("admin-login");
    }
  };
  return (

    <>
      <div className="h-screen w-screen 
          flex flex-col 
          items-center justify-center 
      ">
        <div className="flex flex-col 
            items-center gap-3.5
            py-6 rounded-2xl bg-[var(--color-surface)]/80 
            border border-[var(--color-border)] shadow-2xl
        ">

          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              WeCraft! Launcher
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              选择你的身份进入
            </p>
          </div>

          <RoleSelectorPill onSelect={handleRoleSelect} />

          <div className="flex w-150 h-auto
              items-center justify-center
              from-[var(--color-primary)]/15 
              to-[var(--color-surface)] select-none
              overflow-hidden
          ">

            {/* <div className="w-full mx-5"> */}

              <div
                className="w-full mx-5 py-2
                      flex flex-row items-center
                      transition-transform duration-300 ease-in-out
                "
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >

                <div className={`w-full flex-shrink-0 px-4
                    transition-all flex flex-col gap-3
                  ${view != "player-login" 
                    && "pr-10" }
                `}>
                  <PlayerLoginView
                    onBack={() => setView("player-add")}
                    onAdd={() => setView("player-add")}
                  />
                </div>

                <div className={`w-full flex-shrink-0 px-4 transition-all
                  ${view != "player-add" 
                    && "pl-10 pr-10" }
                `}>
                  <PlayerAddView
                    onBack={() => {
                      const { accounts } = useAccountStore.getState();
                      setView(accounts.length > 0 ? "player-login" : "player-login");
                    }}
                  />
                </div>

                <div className={`w-full flex-shrink-0 px-4 transition-all
                  ${view != "admin-login" 
                    && "pl-10 pr-10" }
                `}>
                  <AdminLoginView
                    onBack={() => setView("player-login")}
                    onRegister={() => setView("admin-register")}
                  />
                </div>

                <div className={`w-full flex-shrink-0 px-4 transition-all
                  ${view != "admin-register" 
                    && "pl-10 pr-10" }
                `}>
                  <AdminRegisterView
                    onBack={() => setView("admin-login")}
                  />
                </div>

              </div>

            </div>
          </div>

          <p className="text-[10px] text-[var(--color-text-secondary)]/50">
            v0.1.0-alpha.2
          </p>

        </div>
      {/* </div> */}
    </>
  );
};

/* ==================== 角色选择悬浮胶囊 ==================== */
const RoleSelectorPill = ({ onSelect }: { onSelect: (role: "player" | "admin") => void }) => {
  const [selected, setSelected] = useState<"player" | "admin">("player");

  const handleSelect = (role: "player" | "admin") => {
    setSelected(role);
    onSelect(role);
  };

  return (
    <div className="relative flex rounded-full 
          bg-[var(--color-surface)]/80
          border border-[var(--color-border)]/50 shadow-xl
    ">
      <div className="relative flex items-center w-full">
        <motion.div
          className="absolute inset-y-1 rounded-full bg-[var(--color-primary)]/15"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            left: selected === "player" ? "4px" : "calc(50% + 2px)",
            width: "calc(50% - 6px)",
          }}
        />
        <button
          onClick={() => handleSelect("player")}
          className={`flex-1 relative z-10 flex items-center justify-center 
                    gap-2 px-4 py-2 rounded-full text-sm 
                    font-medium transition-colors cursor-pointer
                    ${selected === "player"
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>玩家</span>
        </button>
        <button
          onClick={() => handleSelect("admin")}
          className={`flex-1 relative z-10 flex items-center justify-center 
                    gap-2 px-4 py-2 rounded-full text-sm 
                    font-medium transition-colors cursor-pointer
                    ${selected === "admin"
                    ? "text-purple-400"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
        >
          <Server className="w-4 h-4" />
          <span>服主</span>
        </button>
      </div>
    </div>
  );
};

/* ==================== 玩家登录 (Steam 风格) ==================== */
const PlayerLoginView = ({
  onBack,
  onAdd,
}: {
  onBack: () => void;
  onAdd: () => void;
}) => {
  const { accounts, currentAccount, setCurrentAccount, loadAccounts } = useAccountStore();
  const setLoggedIn = useLoginStore((s) => s.setLoggedIn);
  const switchRole = useUserRoleStore((s) => s.switchRole);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(
    currentAccount?.uuid ?? accounts[0]?.uuid ?? null
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleLogin = async (uuid?: string) => {
    const targetUuid = uuid ?? selectedUuid;
    if (!targetUuid) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      await setCurrentAccount(targetUuid);
      setLoggedIn();
      switchRole(UserRole.PLAYER, false);
      const { createMainWindow, closeLoginWindow } = await import("@/api/window");
      await createMainWindow();
      await closeLoginWindow();
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "登录失败");
      setLoggingIn(false);
    }
  };

  return (
    <div className="space-y-4">
      {loginError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {loginError}
        </div>
      )}

      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        点击进入账号
      </h2>

      <div className="flex flex-wrap gap-3 justify-center py-2 max-h-56 overflow-y-auto
           scrollbar-hide 
      ">
        {accounts.map((acc) => (
          <button
            key={acc.uuid}
            onClick={() => handleLogin(acc.uuid)}
            className={`flex flex-col items-center gap-1.5 p-2 
              border-2 transition-all duration-200 cursor-pointer group
              hover:-translate-y-1 hover:shadow-lg
              ${selectedUuid === acc.uuid
                ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/8 "
                : "border-transparent hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
              }`}
          >
            <div className={`w-16 h-16 overflow-hidden transition-all 
              ${selectedUuid === acc.uuid
                ? "ring-[var(--color-primary)]/50"
                : "ring-[var(--color-border)]/50 group-hover:ring-[var(--color-primary)]/30"
              }`}
            >
              <SkinAvatar uuid={"f8ab99b9-9e45-4001-a9ea-0f5c9ca285c8"} avatarMode="isometric" />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]/90 text-center truncate max-w-[72px]
              opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium
            ">
              {acc.name}
            </span>
          </button>
        ))}
        {accounts.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm w-full">
            暂无账户，请添加
          </div>
        )}
      </div>

      <div className="space-y-2 pt-1">
        <button
          onClick={onAdd}
          className="w-full py-2.5 rounded-xl border border-[var(--color-border)] 
            text-[var(--color-text-secondary)] text-sm font-medium
            hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]
            hover:bg-[var(--color-primary)]/5
            transition-all duration-200 
            flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>添加账户</span>
        </button>
      </div>
    </div>
  );
};

/* ==================== 玩家添加 ==================== */
const PlayerAddView = ({ onBack }: { onBack: () => void }) => {
  const addAccount = useAccountStore((s) => s.addAccount);
  const [name, setName] = useState("");
  const [type, setType] = useState<"microsoft" | "offline">("offline");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await addAccount(name.trim(), type);
      onBack();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="transition-all duration-75 ease-in">
      <div className="flex items-center gap-2 mb-5">
        <IconButton icon={ChevronLeft} size="sm" onClick={onBack} label="返回" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">添加账户</h2>
      </div>

      {addError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {addError}
        </div>
      )}

      <>
        <div className="mb-3">
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">账户名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入游戏名称"
            maxLength={16}
            className="w-full px-3 py-2 rounded-lg 
              bg-[var(--color-surface-hover)] 
              border border-[var(--color-border)] 
              text-[var(--color-text-primary)] text-sm 
              placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-[var(--color-primary)]/50 
              focus:ring-1 focus:ring-[var(--color-primary)]/20
              transition-all"
          />
        </div>

        <div className="mb-6 transition-all duration-75">
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">账户类型</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType("offline")}
              className={`flex-1 py-2 rounded-lg text-sm border transition-all ${type === "offline"
                ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50"
                }`}
            >
              离线
            </button>
            <button
              onClick={() => setType("microsoft")}
              className={`flex-1 py-2 rounded-lg text-sm border transition-all ${type === "microsoft"
                ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                : "bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50"
                }`}
            >
              Microsoft
            </button>
          </div>
          {type === "microsoft" && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border 
                  border-amber-500/30 text-amber-400 text-xs
                  mt-1
            ">
              微软账户需要完整的 OAuth 流程，当前为占位实现
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim() || adding}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/90 text-white font-medium
            hover:from-[var(--color-primary)]/90 hover:to-[var(--color-primary)]/80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          {adding ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>添加中...</span></>
          ) : (
            <><UserPlus className="w-4 h-4" /><span>添加并返回</span></>
          )}
        </button>
      </>
    </div>
  );
};

/* ==================== 服主登录 ==================== */
const AdminLoginView = ({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: () => void;
}) => {
  const adminLogin = useAdminStore((s) => s.login);
  const setLoggedIn = useLoginStore((s) => s.setLoggedIn);
  const switchRole = useUserRoleStore((s) => s.switchRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      const ok = await adminLogin(email.trim(), password);
      if (ok) {
        setLoggedIn();
        switchRole(UserRole.ADMIN, false);
        const { createMainWindow, closeLoginWindow } = await import("@/api/window");
        await createMainWindow();
        await closeLoginWindow();
      } else {
        setLoginError(useAdminStore.getState().error || "登录失败");
      }
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="">

      {loginError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {loginError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱地址"
            type="email"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
              transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            type={showPassword ? "text" : "password"}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
              transition-all"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={!email.trim() || !password || loggingIn}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium
            hover:from-purple-600 hover:to-purple-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg hover:shadow-xl
            flex items-center justify-center gap-2 text-sm"
        >
          {loggingIn ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>登录中...</span></>
          ) : (
            <><LogIn className="w-4 h-4" /><span>登录</span></>
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onRegister}
          className="text-xs text-[var(--color-text-secondary)]"
        >
          没有账号？<span className="text-purple-400 font-medium hover:cursor-pointer">注册服主账号</span>
        </button>
      </div>
    </div>
  );
};

/* ==================== 服主注册 ==================== */
const AdminRegisterView = ({ onBack }: { onBack: () => void }) => {
  const adminRegister = useAdminStore((s) => s.register);
  const setLoggedIn = useLoginStore((s) => s.setLoggedIn);
  const switchRole = useUserRoleStore((s) => s.switchRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");

  const handleRegister = async () => {
    if (!email.trim()) { setRegError("请输入邮箱"); return; }
    if (password.length < 6) { setRegError("密码至少6位"); return; }
    if (password !== confirmPassword) { setRegError("两次密码不一致"); return; }
    setRegistering(true);
    setRegError("");
    try {
      const ok = await adminRegister(email.trim(), password);
      if (ok) {
        setLoggedIn();
        switchRole(UserRole.ADMIN, false);
        const { createMainWindow, closeLoginWindow } = await import("@/api/window");
        await createMainWindow();
        await closeLoginWindow();
      } else {
        setRegError(useAdminStore.getState().error || "注册失败");
      }
    } catch (e) {
      setRegError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-5">
        <IconButton icon={ChevronLeft} size="sm" onClick={onBack} label="返回" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">注册服主</h2>
      </div>

      {regError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {regError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱地址"
            type="email"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
              transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少6位）"
            type={showPassword ? "text" : "password"}
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
              transition-all"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认密码"
            type={showPassword ? "text" : "password"}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
              transition-all"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={!email.trim() || !password || !confirmPassword || registering}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium
            hover:from-purple-600 hover:to-purple-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg hover:shadow-xl
            flex items-center justify-center gap-2 text-sm"
        >
          {registering ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>注册中...</span></>
          ) : (
            <><UserPlus className="w-4 h-4" /><span>注册并进入</span></>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginGate;
