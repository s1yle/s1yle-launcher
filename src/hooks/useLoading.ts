import { useLoadingStore, type LoadingEntry } from '@/stores/loadingStore';

const EMPTY: LoadingEntry = {
  status: 'idle', variant: 'spinner', blocking: false,
};

/**
 * 获取指定 key 的加载状态
 * @param key - 加载状态标识
 * @returns 加载状态条目
 */
export function useLoading(key: string): LoadingEntry {
  const entry = useLoadingStore((state) => state.entries[key]);
  return entry ?? EMPTY;
}

/**
 * 批量获取多个 key 的加载状态
 * @param keys - 加载状态标识数组
 * @returns 加载状态条目数组
 */
export function useLoadingEntries(keys: string[]): LoadingEntry[] {
  return keys.map((key) => useLoading(key));
}

/**
 * 判断指定 key 是否正在加载中
 * @param key - 加载状态标识
 * @returns 是否正在加载
 */
export function useIsLoading(key: string): boolean {
  const entry = useLoading(key);
  return entry.status === 'loading';
}
