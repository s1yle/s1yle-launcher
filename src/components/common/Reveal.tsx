import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { DURATION, EASING } from '@/utils/animations';

/** 滚动显现动画组件 Props */
export interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  amount?: number | 'some' | 'all';
  margin?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  scale?: boolean;
}

/**
 * 滚动显现动画组件。
 * 与 PageSection 共用同一套曲线 token（入场带弹性，透明度 OUT_FLUENT + 位移 SPRING_ENTER）。
 * 显式传入 duration 时覆盖时长。
 */
export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.1,
  margin = '-40px',
  direction = 'up',
  distance = 20,
  duration,
  scale = false,
}: RevealProps) {
  const offsetMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: -distance },
    right: { x: distance },
  };

  const d = duration ?? DURATION.ELEMENT_ENTER;

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...offsetMap[direction],
        ...(scale ? { scale: 0.95 } : {}),
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        ...(scale ? { scale: 1 } : {}),
      }}
      viewport={{ once, amount, margin }}
      transition={{
        opacity: { duration: d, ease: EASING.OUT_FLUENT, delay },
        y: { ...EASING.SPRING_ENTER, delay },
        x: { ...EASING.SPRING_ENTER, delay },
        ...(scale ? { scale: { ...EASING.SPRING_ENTER, delay } } : {}),
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}