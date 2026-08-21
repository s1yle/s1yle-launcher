import { AccountType } from "@/api";
import { PlayerAdd } from "@/components/common/PlayerAdd";
import { NotificationProvider } from "@/components/common/NotificationProvider";
import { useAuthStore } from "@/stores/authStore";
import { Z_INDEX } from "@/utils/zIndex";

interface FirstRunAccountDialogProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭（标记首次初始化完成） */
  onClose: () => void;
}

/**
 * 首次使用启动器引导弹窗：当为初次使用且不存在任何账户时弹出，
 * 引导用户添加一个玩家账户；也可选择"稍后再说"跳过。
 */
export function FirstRunAccountDialog({ open, onClose }: FirstRunAccountDialogProps) {
  const addAccount = useAuthStore((s) => s.addAccount);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);

  if (!open) return null;

  const handleAdd = async (name: string, type: AccountType): Promise<string> => {
    const uuid = await addAccount(name, type);
    try {
      await loginAsPlayer(uuid);
    } catch {
      // 选中账户失败不影响首次引导完成
    }
    onClose();
    return uuid;
  };

  return (
    <NotificationProvider>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        style={{ zIndex: Z_INDEX.MODAL }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              欢迎使用 WeCraft! Launcher
            </h1>
            <button
              onClick={onClose}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              稍后再说
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">
            首次使用，请添加一个账户以开始游戏。
          </p>
          <PlayerAdd onAdd={handleAdd} onBack={onClose} />
        </div>
      </div>
    </NotificationProvider>
  );
}
