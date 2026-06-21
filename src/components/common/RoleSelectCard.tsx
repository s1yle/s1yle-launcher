import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export interface RoleSelectCardProps {
  icon: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  hoverBorderClass?: string;
  hoverBgClass?: string;
  hoverTextClass?: string;
  title: string;
  description: string;
  onClick: () => void;
}

const RoleSelectCard = ({
  icon: Icon,
  iconBgClass = "bg-blue-500/20",
  iconColorClass = "text-blue-400",
  hoverBorderClass = "hover:border-[var(--color-primary)]/50",
  hoverBgClass = "hover:bg-[var(--color-primary)]/5",
  hoverTextClass = "group-hover:text-[var(--color-primary)]",
  title,
  description,
  onClick,
}: RoleSelectCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl 
        bg-[var(--color-surface-hover)] 
        border border-[var(--color-border)] 
        ${hoverBorderClass} ${hoverBgClass} 
        transition-all duration-200 group text-left
        hover:cursor-pointer
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
        <div className="flex-1">
          <div className={`font-semibold text-[var(--color-text-primary)] ${hoverTextClass} transition-colors`}>
            {title}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {description}
          </div>
        </div>
        <ArrowRight className={`w-4 h-4 text-[var(--color-text-secondary)] ${hoverTextClass} transition-colors`} />
      </div>
    </button>
  );
};

export default RoleSelectCard;
