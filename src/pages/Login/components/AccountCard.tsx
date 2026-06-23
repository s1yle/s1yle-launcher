import type { AccountInfo } from "@/api/types/account";
import { SkinAvatar } from "@/components/common";

interface AccountCardProps {
  account: AccountInfo;
  isSelected: boolean;
  isMarked?: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function AccountCard({ account, isSelected, isMarked, isPinned, onClick, onContextMenu }: AccountCardProps) {
  const isActive = isSelected || isMarked || isPinned;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex flex-col items-center gap-1.5 p-2 w-25
        border-2 transition-all duration-200 cursor-pointer group
        hover:-translate-y-1 hover:shadow-lg
        ${isSelected
          ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/8 -translate-y-1 shadow-lg"
          : isMarked
            ? "border-amber-500/60 bg-amber-500/8 -translate-y-1 shadow-lg"
            : isPinned
              ? "border-cyan-500/40 bg-cyan-500/5 -translate-y-1 shadow-lg"
              : "border-transparent hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
        }
      `}
    >
      <div className={`w-16 h-16 overflow-hidden transition-all 
        ${isSelected
          ? "ring-[var(--color-primary)]/50"
          : isMarked
            ? "ring-amber-500/50"
            : isPinned
              ? "ring-cyan-500/40"
              : "ring-[var(--color-border)]/50 group-hover:ring-[var(--color-primary)]/30"
        }
      `}>
        {/* f8ab99b9-9e45-4001-a9ea-0f5c9ca285c8 */}
        <SkinAvatar uuid={account.uuid} avatarMode="isometric" />
        {/* <SkinAvatar uuid={"8667ba71b85a4004af54457a9734eed7"} avatarMode="isometric" /> */}
        {/* <SkinAvatar uuid={"ec561538f3fd461daff5086b22154bce"} avatarMode="isometric" /> */}
        {/* <SkinAvatar uuid={"069a79f444e94726a5befca90e38aaf5"} avatarMode="isometric" /> */}
      </div>
      <span className={`text-xs text-[var(--color-text-secondary)]/90 text-center truncate max-w-[72px]
        transition-opacity duration-200 font-medium
        ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
      `}>
        {account.name}
      </span>
    </button>
  );
}
