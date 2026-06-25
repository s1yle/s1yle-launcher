import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';
import { DURATION } from '@/utils/animations';

const pageContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: DURATION.PAGE_TRANSITION,
    },
  },
};

const pageSection: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/** 页面容器 Props */
export interface PageProps {
  children: ReactNode;
  className?: string;
}

/** 页面容器组件，带交错入场动画 */
export function Page({ children, className }: PageProps) {
  return (
    <motion.div
      variants={pageContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** 页面区块 Props */
export interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

/** 页面区块组件，带弹簧入场动画 */
export function PageSection({ children, className }: PageSectionProps) {
  return (
    <motion.div
      variants={pageSection}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
