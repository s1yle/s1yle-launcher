import { useState } from "react";
import { ChevronLeft, Loader2, UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { IconButton } from "@/components/common";
import { useNotification } from "@/components/common/NotificationProvider";

interface AdminRegisterProps {
  onRegister: (email: string, password: string) => Promise<boolean>;
  onBack: () => void;
}

export function AdminRegister({ onRegister, onBack }: AdminRegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const { error: notifyError } = useNotification();

  const handleRegister = async () => {
    if (!email.trim()) { notifyError("输入错误", "请输入邮箱"); return; }
    if (password.length < 6) { notifyError("输入错误", "密码至少6位"); return; }
    if (password !== confirmPassword) { notifyError("输入错误", "两次密码不一致"); return; }
    setRegistering(true);
    try {
      await onRegister(email.trim(), password);
    } catch (e) {
      notifyError("注册失败", e instanceof Error ? e.message : "未知错误");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <IconButton icon={ChevronLeft} size="sm" onClick={onBack} label="返回" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">注册服主</h2>
      </div>

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
}
