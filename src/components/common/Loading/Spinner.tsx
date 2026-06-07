import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ComponentStackLayer, useIsInsideComponent } from '../ContextStack/ContextStack';
import { useLoading } from '@/hooks/useLoading';
import { useLoadingStore } from '@/stores/loadingStore';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

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

const DotsSpinner = () => (
  <div className="flex items-center gap-1.5">
    {[0, 150, 300].map((delay) => (
      <div
        key={delay}
        className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const PulseSpinner = () => (
  <div className="relative flex items-center justify-center w-16 h-16">
    <div className="absolute inset-0 rounded-full bg-[var(--color-primary)] animate-ping opacity-30" />
    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] animate-pulse" />
  </div>
);

const BarsSpinner = () => (
  <div className="flex items-end gap-1 h-10">
    {[0, 100, 200, 300].map((delay) => (
      <div
        key={delay}
        className="w-1.5 rounded-full bg-[var(--color-primary)]"
        style={{
          height: '24px',
          transformOrigin: 'bottom',
          animation : 'loading-bar 1.2s ease-in-out infinite',
          animationDelay: `${delay}ms`,
        }}
      />
    ))}
  </div>
);

const SPINNER_MAP = {
  ring: RingSpinner,
  dots: DotsSpinner,
  pulse: PulseSpinner,
  bars: BarsSpinner,
} as const;

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

  const entryVariant = loadingEntry?.variant;
  const spinnerStyle = useLoadingStore((s) => s.config.spinnerStyle);

  const isInsideSelf = useIsInsideComponent("SpinnerOverlay");

  if (!isActive) return <>{children}</>;

  const shouldRenderOverlay = !loadingKey || entryVariant === 'spinner';
  if (!shouldRenderOverlay) return <>{children}</>;

  const SpinnerIcon = SPINNER_MAP[spinnerStyle] ?? SPINNER_MAP.ring;

  return (
    <ComponentStackLayer type='Spinner'>
      <div className={cn('spinner relative overflow-hidden', className)}>
        {children}
        <div className={`absolute inset-0 flex items-center 
          justify-center rounded-(--radius-full)
          ${isInsideSelf ? 'z-0' : 'z-50'}`}
        >
          <div className="flex flex-col items-center gap-4 p-8">

            {loading && <SpinnerIcon />}

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
