import { useEffect, useRef } from 'react';

/** usePolling 的配置选项 */
export interface UsePollingOptions {
  /** 轮询间隔（ms） */
  interval: number;
  /** 是否在挂载后立即执行一次，默认 true */
  immediate?: boolean;
  /** 是否启用轮询，默认 true（禁用时不执行也不注册定时器） */
  enabled?: boolean;
}

/**
 * 轮询 hook - 统一 interval 清理与立即执行语义。
 * 回调始终调用最新版本（通过 ref），避免因依赖变化导致定时器反复重建。
 *
 * @param fn - 每次轮询要执行的函数（支持同步或返回 Promise）
 * @param options - 配置选项
 */
export function usePolling(
  fn: () => void | Promise<void>,
  options: UsePollingOptions,
): void {
  const { interval, immediate = true, enabled = true } = options;
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    if (immediate) void fnRef.current();
    const timer = setInterval(() => {
      void fnRef.current();
    }, interval);
    return () => clearInterval(timer);
  }, [interval, immediate, enabled]);
}
