import { useEffect, useRef } from 'react';

/**
 * 点击外部检测 hook
 * @param handler - 点击外部时的回调函数
 * @param enabled - 是否启用检测，默认 true
 * @param extraRefs - 额外的 ref 元素，点击这些元素内部不会触发 handler
 * @returns ref - 需要绑定到被检测元素的 ref
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true,
  extraRefs: React.RefObject<HTMLElement | null>[] = [],
) {
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const handleEvent = (event: MouseEvent | TouchEvent) => {
      const path = event.composedPath();
      const isInside = [ref, ...extraRefs].some(
        r => r.current && path.includes(r.current),
      );
      if (!isInside) {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleEvent, true);
    document.addEventListener('touchstart', handleEvent, true);

    return () => {
      document.removeEventListener('mousedown', handleEvent, true);
      document.removeEventListener('touchstart', handleEvent, true);
    };
  }, [enabled]);

  return ref;
}
