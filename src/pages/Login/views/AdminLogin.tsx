import { useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNotification } from "@/components/common/NotificationProvider";

/** AdminLogin 组件的 Props */
interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onNavigate: (view: "admin-register") => void;
}

/** 管理员登录视图 - 邮箱密码登录服主账号 */
export function AdminLogin({ onLogin, onNavigate }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const { error: notifyError } = useNotification();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoggingIn(true);
    try {
      await onLogin(email.trim(), password);
    } catch (e) {
      notifyError("登录失败", e instanceof Error ? e.message : "未知错误");
      setLoggingIn(false);
    }
  };

  return (
    <div className="space-y-3">
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
          <><LogIn className="w-4 h-4 animate-spin" /><span>登录中...</span></>
        ) : (
          <><LogIn className="w-4 h-4" /><span>登录</span></>
        )}
      </button>

      <div className="text-center">
        <button
          onClick={() => onNavigate("admin-register")}
          className="text-xs text-[var(--color-text-secondary)]"
        >
          没有账号？<span className="text-purple-400 font-medium hover:cursor-pointer">注册服主账号</span>
        </button>
      </div>
    </div>
  );
}
