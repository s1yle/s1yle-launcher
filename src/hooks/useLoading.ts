import { useLoadingStore, type LoadingEntry } from '@/stores/loadingStore';

const EMPTY: LoadingEntry = {
  status: 'idle', variant: 'spinner', blocking: false,
};

export function useLoading(key: string): LoadingEntry {
  const entry = useLoadingStore((state) => state.entries[key]);
  return entry ?? EMPTY;
}

export function useLoadingEntries(keys: string[]): LoadingEntry[] {
  return keys.map((key) => useLoading(key));
}

export function useIsLoading(key: string): boolean {
  const entry = useLoading(key);
  return entry.status === 'loading';
}
