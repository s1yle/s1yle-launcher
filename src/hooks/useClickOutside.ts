import { useEffect, useRef } from 'react';

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
