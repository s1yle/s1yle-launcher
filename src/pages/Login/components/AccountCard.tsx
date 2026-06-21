import type { AccountInfo } from "@/api/types/account";
import { SkinAvatar } from "@/components/common";

interface AccountCardProps {
  account: AccountInfo;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function AccountCard({ account, isSelected, onClick, onContextMenu }: AccountCardProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex flex-col items-center gap-1.5 p-2 
        border-2 transition-all duration-200 cursor-pointer group
        hover:-translate-y-1 hover:shadow-lg
        ${isSelected
          ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/8 "
          : "border-transparent hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
        }`}
    >
      <div className={`w-16 h-16 overflow-hidden transition-all 
        ${isSelected
          ? "ring-[var(--color-primary)]/50"
          : "ring-[var(--color-border)]/50 group-hover:ring-[var(--color-primary)]/30"
        }`}
      >
        <SkinAvatar uuid={"f8ab99b9-9e45-4001-a9ea-0f5c9ca285c8"} avatarMode="isometric" />
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]/90 text-center truncate max-w-[72px]
        opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium
      ">
        {account.name}
      </span>
    </button>
  );
}
