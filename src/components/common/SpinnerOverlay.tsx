import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface SpinnerOverlayProps {
  visible: boolean;
  loading?: boolean;
  children?: ReactNode;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  className?: string;
}

const SpinnerOverlay = ({
  visible,
  loading = true,
  children,
  message,
  progress,
  showProgress = false,
  onCancel,
  cancelText = '取消',
  className,
}: SpinnerOverlayProps) => {
  if (!visible) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-4 p-8">
          {loading && (
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          )}
          {message && (
            <p className="text-white/80 text-sm font-medium">{message}</p>
          )}
          {showProgress && progress !== undefined && (
            <div className="w-64 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-md text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinnerOverlay;
