import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { EASING } from '@/utils/animations';

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
  children,  
  className,  
  delay = 0,  
  once = true,  
  amount = 0.1,  
  margin = '-40px',  
  direction = 'up',  
  distance = 24,  
  duration = 0.5,  
  scale = false,  
 */
export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.1,
  margin = '-40px',
  direction = 'up',
  distance = 24,
  duration = 0.5,
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
        opacity: 0,
        ...offsetMap[direction],
        ...(scale ? { scale: 0.95 } : {}),
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        ...(scale ? { scale: 1 } : {}),
      }}
      viewport={{ once, amount, margin }}
      transition={{
        duration,
        delay,
        ease: EASING.DEFAULT,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
