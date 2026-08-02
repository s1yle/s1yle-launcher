import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface SelectorOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  activeClass?: string;
}

interface SelectorProps<T extends string> {
  options: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const Selector = <T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SelectorProps<T>) => {
  const selectedIndex = options.findIndex(o => o.value === value);
  const optionCount = options.length;

  return (
    <div className={`relative flex rounded-full bg-[var(--color-surface)]/80 border border-[var(--color-border)]/50 ${className}`}>
      <div className="relative flex items-center w-full">
        <motion.div
          className="absolute inset-y-1 rounded-full bg-[var(--color-primary)]/15"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            left: `calc(${selectedIndex * (100 / optionCount)}% + 3px)`,
            width: `calc(${100 / optionCount}% - 6px)`,
          }}
        />
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              value === option.value
                ? option.activeClass || "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
