import { motion } from "framer-motion";
import { Gamepad2, Server } from "lucide-react";

interface RoleSelectorProps {
  selected: "player" | "admin";
  onSelect: (role: "player" | "admin") => void;
  className: string;
}

export function RoleSelector({ selected, onSelect, className }: RoleSelectorProps) {
  return (
    <div 
      className={`relative flex rounded-full 
        bg-[var(--color-surface)]/80
        border border-[var(--color-border)]/50 shadow-xl ${className}
      `}
    >
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
          onClick={() => onSelect("player")}
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
          onClick={() => onSelect("admin")}
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
}
