import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { EASING, pageSection, pageSectionSpring } from '@/utils/animations';

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
 * 默认动效与 PageSection 一致（pageSection 变体 + 弹簧过渡，单一事实源 @utils/animations）。
 * 显式传入 duration 时退化为 tween 缓动。
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

  return (
    <motion.div
      initial={{
        ...pageSection.initial,
        ...offsetMap[direction],
        ...(scale ? { scale: 0.95 } : {}),
      }}
      whileInView={{
        ...pageSection.animate,
        ...(scale ? { scale: 1 } : {}),
      }}
      viewport={{ once, amount, margin }}
      transition={duration !== undefined
        ? { duration, delay, ease: EASING.DEFAULT }
        : { ...pageSectionSpring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}