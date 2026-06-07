import { useCallback, useRef } from 'react';
import { useLoadingStore, type LoadingVariant } from '@/stores/loadingStore';

export interface UseLoadingActionOptions<T = void> {
  key: string;
  action?: () => Promise<T>;
  variant?: LoadingVariant;
  message?: string;
  blocking?: boolean;
  onSuccess?: (result: T) => void;
  onError?: (error: string) => void;
  minDurationMs?: number;
}

export function useLoadingAction<T = void>(
  optionsOrKey: string | UseLoadingActionOptions<T>,
  action?: () => Promise<T>,
): () => Promise<T | undefined> {
  const opts: UseLoadingActionOptions<T> = typeof optionsOrKey === 'string'
    ? { key: optionsOrKey }
    : optionsOrKey;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(action ?? opts.action);
  const onSuccessRef = useRef(opts.onSuccess);
  const onErrorRef = useRef(opts.onError);

  actionRef.current = action ?? opts.action;
  onSuccessRef.current = opts.onSuccess;
  onErrorRef.current = opts.onError;

  const { key, variant, blocking, message, minDurationMs } = opts;

  return useCallback(async () => {
    const store = useLoadingStore.getState();
    const minDuration = minDurationMs ?? store.config.minDurationMs;

    store.register(key, {
      variant: variant ?? store.config.variant,
      blocking: blocking ?? false,
      message,
    });

    const startTime = Date.now();

    try {
      const fn = actionRef.current;
      const result = fn ? await fn() : undefined;

      const elapsed = Date.now() - startTime;
      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) => {
          timerRef.current = setTimeout(resolve, remaining);
        });
      }

      store.done(key);
      onSuccessRef.current?.(result as T);
      return result;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      store.done(key, errorMsg);
      onErrorRef.current?.(errorMsg);
      return undefined;
    }
  }, [key, variant, blocking, message, minDurationMs]);
}
