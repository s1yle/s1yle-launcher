import { useLoadingStore, type LoadingEntry } from '@/stores/loadingStore';

const EMPTY: LoadingEntry = {
  status: 'idle', blocking: false,
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
