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

export interface PageProps {
  children: ReactNode;
  className?: string;
}

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

export interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

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
