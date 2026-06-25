import { useCallback } from 'react';
import { create } from 'zustand';

/**
 * Zustand store 维护一个全局的 DOM 元素注册表。
 *
 * 允许通过字符串 key 跨组件共享 DOM ref，避免 prop drilling。
 * Portal 组件使用此注册表将 `avoidRefs` 中的 string key 解析为真实 `RefObject`。
 */
interface RefRegistryState {
  /** key → HTMLElement 映射 */
  refs: Record<string, HTMLElement | null>;
  /** 注册或更新一个元素 */
  register: (key: string, element: HTMLElement | null) => void;
  /** 移除一个 key 的注册 */
  unregister: (key: string) => void;
}

/** DOM 元素注册表 Store — 通过字符串 key 跨组件共享 DOM ref */
export const useRefRegistryStore = create<RefRegistryState>((set) => ({
  refs: {},
  register: (key, element) =>
    set((state) => ({ refs: { ...state.refs, [key]: element } })),
  unregister: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.refs;
      return { refs: rest };
    }),
}));

/**
 * 返回一个 ref callback，在元素挂载时自动注册、卸载时自动注销。
 *
 * 配合 `useRegisteredRef` 或 Portal 的 `avoidRefs` 使用。
 *
 * @example
 * ```tsx
 * const register = useRegisterRef('my-header');
 * return <header ref={register}>...</header>;
 * ```
 */
export function useRegisterRef(key: string): (element: HTMLElement | null) => void {
  const register = useRefRegistryStore((s) => s.register);
  const unregister = useRefRegistryStore((s) => s.unregister);

  return useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        register(key, element);
      } else {
        unregister(key);
      }
    },
    [key, register, unregister],
  );
}

/**
 * 读取已注册的 DOM 元素。
 *
 * @example
 * ```tsx
 * const headerEl = useRegisteredRef('my-header');
 * // headerEl 是 HTMLElement | null
 * ```
 */
export function useRegisteredRef(key: string): HTMLElement | null {
  return useRefRegistryStore((s) => s.refs[key] ?? null);
}
