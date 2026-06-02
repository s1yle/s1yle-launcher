import { Transition } from 'framer-motion';
import { useUIModeStore } from '@/stores/uiModeStore';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { microInteractions as allMicro } from '@/utils/animations';

const noop: Record<string, undefined> = {};

/**
 * ## useAnimation — 统一动画控制钩子
 *
 * 提供全局动画开关能力，自动响应：
 * - 用户设置中的 `animation.enabled` 开关
 * - 系统 `prefers-reduced-motion` 媒体查询
 *
 * @returns
 * - `enabled` — 动画是否启用（用户设置 × 系统偏好）
 * - `prefersReducedMotion` — 系统是否开启了减弱动效
 * - `transition(preset)` — 返回预设过渡（动画禁用时返回 `{ duration: 0 }`）
 * - `micro` — 微交互预设（动画禁用时返回空对象，gesture 不生效）
 *
 * @example
 * ```tsx
 * const { enabled, transition, micro } = useAnimation();
 *
 * <motion.div
 *   transition={transition({ duration: 0.3 })}
 *   whileHover={micro.buttonHover}
 * />
 * ```
 */
export function useAnimation() {
  const { animation } = useUIModeStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  const enabled = animation.enabled && !prefersReducedMotion;

  const transition = (preset: Transition): Transition => {
    return enabled ? preset : { duration: 0 };
  };

  const micro = enabled ? allMicro : noop;

  return {
    enabled,
    prefersReducedMotion,
    transition,
    micro,
  };
}
