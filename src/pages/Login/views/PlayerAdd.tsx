import { useState } from "react";
import { ChevronLeft, Loader2, UserPlus } from "lucide-react";
import { IconButton } from "@/components/common";
import { useNotification } from "@/components/common/NotificationProvider";

interface PlayerAddProps {
  onAdd: (name: string, type: "microsoft" | "offline") => Promise<string>;
  onBack: () => void;
}

export function PlayerAdd({ onAdd, onBack }: PlayerAddProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"microsoft" | "offline">("offline");
  const [adding, setAdding] = useState(false);
  const { error: notifyError } = useNotification();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd(name.trim(), type);
      onBack();
    } catch (e) {
      notifyError("添加失败", e instanceof Error ? e.message : "未知错误");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <IconButton icon={ChevronLeft} size="sm" onClick={onBack} label="返回" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">添加账户</h2>
      </div>

      <div className="space-y-3">
        <div>
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

        <div>
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
                  border-amber-500/30 text-amber-400 text-xs mt-1"
            >
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
      </div>
    </div>
  );
}
