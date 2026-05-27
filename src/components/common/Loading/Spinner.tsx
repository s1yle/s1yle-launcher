import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ComponentStackLayer, useIsInsideComponent } from '../ContextStack/ContextStack';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface SpinnerProps {
  active: boolean;
  loading?: boolean;
  children?: ReactNode;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  className?: string;
}

/**
 * ## 转圈加载动画
 * @param active 是否可见 
 */
const Spinner= ({
  active,
  loading = true,
  children,
  message,
  progress,
  showProgress = false,
  onCancel,
  cancelText = '取消',
  className = ' ',
}: SpinnerProps) => {
  if (!active) return <>{children}</>;
  
  const isInsideSelf = useIsInsideComponent("SpinnerOverlay");

  return (
    <ComponentStackLayer type='Spinner'>
      <div className={cn('spinner relative overflow-hidden', className)}>
        {children}
        <div className={`absolute inset-0 flex items-center 
          justify-center rounded-(--radius-full)
          ${isInsideSelf ? 'z-0' : 'z-50'}`}
        >
          <div className="flex flex-col items-center gap-4 p-8">

            {/* 转圈动画 */}
            {loading && (
              <Loader2 className="w-10 h-10 text-[--color-text-secondary] animate-spin" />
            )}

            {/* msg */}
            {message && (
              <p className="text-text-secondary text-sm font-medium">{message}</p>
            )}

            {/* 进度条 */}
            {showProgress && progress !== undefined && (
              <div className="w-64 h-2 rounded-(--raadius-full) bg-progress-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}

            {/* cancel 回调 */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded-md text-sm text-text-secondary hover:text-text-primary bg-progress-track hover:bg-surface-hover transition-colors"
              >
                {cancelText}
              </button>
            )}

          </div>
        </div>
      </div>
    </ComponentStackLayer>
  );
};

export default Spinner;
