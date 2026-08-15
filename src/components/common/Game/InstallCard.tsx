import React from 'react';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

/** 安装卡片状态类型 */
export type InstallCardStatus = 'not_installed' | 'installing' | 'installed' | 'incompatible';

/** 安装卡片组件 Props */
export interface InstallCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: InstallCardStatus;
  compatible: boolean;
  onClick: () => void;
}

/** 安装卡片组件，根据兼容性和状态显示不同的交互样式 */
const InstallCard = ({
  icon,
  title,
  subtitle,
  status,
  compatible,
  onClick,
}: InstallCardProps) => {
  const statusConfig = {
    not_installed: {
      bg: 'bg-surface',
      border: 'border-border',
      text: 'text-text-secondary',
      hover: 'hover:border-border-hover hover:bg-surface-hover',
    },
    installing: {
      bg: 'bg-surface',
      border: 'border-primary',
      text: 'text-primary',
      hover: '',
    },
    installed: {
      bg: 'bg-surface',
      border: 'border-success',
      text: 'text-success',
      hover: '',
    },
    incompatible: {
      bg: 'bg-surface',
      border: 'border-border',
      text: 'text-text-disabled',
      hover: '',
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={compatible ? onClick : undefined}
      disabled={!compatible || status === 'installing'}
      className={cn(
        'relative flex flex-col items-start gap-3 p-4 rounded-lg border transition-all text-left',
        config.bg,
        config.border,
        compatible && config.hover,
        (!compatible || status === 'installing') && 'opacity-60 cursor-not-allowed',
        compatible && 'cursor-pointer'
      )}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-active">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{title}</p>
        <p className={cn('text-xs mt-0.5 truncate', config.text)}>{subtitle}</p>
      </div>

      {compatible && status !== 'installing' && (
        <ChevronRight className="w-4 h-4 text-text-tertiary absolute top-4 right-3" />
      )}
    </button>
  );
};

export default InstallCard;
