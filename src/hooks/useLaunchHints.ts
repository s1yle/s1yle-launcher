import { useCallback, useState } from 'react';
import { usePolling } from './usePolling';
import { LAUNCH_HINTS } from '@/utils/launchHints';

/**
 * ## useLaunchHints — 启动小贴士统一切换 hook
 *
 * 从启动覆盖层抽取的"你知道吗"随机小贴士逻辑，供多个消费方统一使用。
 * 默认在指定的轮询间隔内随机切换提示文本。
 *
 * @param interval 随机切换间隔（ms），默认 6000
 * @returns
 * - `hint` — 当前展示的小贴士
 * - `rotate` — 手动切换到下一条小贴士
 */
export function useLaunchHints(interval = 6000) {
  const [hint, setHint] = useState(
    () => LAUNCH_HINTS[Math.floor(Math.random() * LAUNCH_HINTS.length)]
  );

  const rotate = useCallback(() => {
    setHint(prev => {
      const next = LAUNCH_HINTS[Math.floor(Math.random() * LAUNCH_HINTS.length)];
      return next === prev ? LAUNCH_HINTS[(LAUNCH_HINTS.indexOf(prev) + 1) % LAUNCH_HINTS.length] : next;
    });
  }, []);

  usePolling(rotate, { interval });

  return { hint, rotate };
}