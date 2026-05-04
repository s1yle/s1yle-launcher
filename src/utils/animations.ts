import { Variants, Transition } from 'framer-motion';

export const transitions = {
  fast: { duration: 0.1, ease: 'easeOut' } as Transition,
  normal: { duration: 0.15, ease: 'easeOut' } as Transition,
  slow: { duration: 0.25, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  springBouncy: { type: 'spring', stiffness: 700, damping: 20 } as Transition,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

export const scaleIn: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const listItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  hover: { scale: 1.01, transition: { duration: 0.08 } },
  tap: { scale: 0.99, transition: { duration: 0.05 } },
};

export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.01, 
    y: -2,
    boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
    transition: { duration: 0.1 } 
  },
  tap: { scale: 0.99, transition: { duration: 0.05 } },
};

export const buttonHover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: transitions.fast },
  tap: { scale: 0.95, transition: transitions.fast },
};

export const iconButtonHover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.15, rotate: 5, transition: transitions.spring },
  tap: { scale: 0.9, transition: transitions.fast },
};

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export const dropdown: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const notification: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 300, scale: 0.9 },
};

export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (width: number) => ({ width: `${width}%` }),
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmer = {
  x: ['-100%', '100%'],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const createStaggerVariants = (delay: number = 0.05): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: delay,
      staggerDirection: -1,
    },
  },
});

export const createSlideVariants = (direction: 'left' | 'right' | 'up' | 'down' = 'up'): Variants => {
  const offset = 20;
  const directions = {
    left: { x: -offset, y: 0 },
    right: { x: offset, y: 0 },
    up: { x: 0, y: offset },
    down: { x: 0, y: -offset },
  };

  return {
    initial: { opacity: 0, ...directions[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...directions[direction] },
  };
};
