import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { pageContainer, pageSection, pageSectionSpring } from '@/utils/animations';

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
      transition={pageSectionSpring}
      className={className}
    >
      {children}
    </motion.div>
  );
}
