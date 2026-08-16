import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

import { ComponentStackLayer } from '../ContextStack/ContextStack';
import { useLoading } from '@/hooks/useLoading';



/** 加载旋转器组件 Props */
export interface SpinnerProps {
  active?: boolean;
  loadingKey?: string;
  loading?: boolean;
  children?: ReactNode;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  className?: string;
}

const RingSpinner = () => (
  <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
);

const Spinner = ({
  active: activeProp,
  loadingKey,
  loading = true,
  children,
  message: messageProp,
  progress: progressProp,
  showProgress = false,
  onCancel,
  cancelText = '取消',
  className = ' ',
}: SpinnerProps) => {
  const loadingEntry = loadingKey ? useLoading(loadingKey) : undefined;
  const isActive = loadingKey ? loadingEntry?.status === 'loading' : activeProp;
  const message = loadingKey ? loadingEntry?.message : messageProp;
  const progress = loadingKey ? loadingEntry?.progress : progressProp;

  if (!isActive) return <>{children}</>;

  return (
    <ComponentStackLayer type='Spinner'>
      <div className={cn('spinner relative overflow-hidden', className)}>
        {children}
        <div className={`absolute inset-0 flex items-center 
          justify-center rounded-(--radius-full)
          z-50`}
        >
          <div className="flex flex-col items-center gap-4 p-8">

            {loading && <RingSpinner />}

            {message && (
              <p className="text-text-secondary text-sm font-medium">{message}</p>
            )}

            {showProgress && progress !== undefined && (
              <div className="w-64 h-2 rounded-full bg-progress-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}

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
