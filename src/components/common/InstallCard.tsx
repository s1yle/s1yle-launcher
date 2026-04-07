import React from 'react';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export type InstallCardStatus = 'not_installed' | 'installing' | 'installed' | 'incompatible';

export interface InstallCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: InstallCardStatus;
  compatible: boolean;
  onClick: () => void;
}

const InstallCard: React.FC<InstallCardProps> = ({
  icon,
  title,
  subtitle,
  status,
  compatible,
  onClick,
}) => {
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
