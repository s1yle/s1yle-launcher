import { motion, type TargetAndTransition, type Transition, type Variants } from 'framer-motion';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { DURATION, pageContainer, pageSection } from '@/utils/animations';
import { useAnimation } from '@/hooks/useAnimation';

/**
 * 交错编排上下文：Page 负责派发序号，PageSection/PageTitle 依据序号计算入场延迟。
 *
 * 采用显式序号而非 framer-motion 变体编排（variantChildren orchestration）的原因：
 * 变体编排只作用于显式设置 initial/animate label 的子组件（controlling variants），
 * 而此类组件又会自行启动动画产生竞态；显式序号 + delay 实现确定性的错峰。
 * 序号在渲染期由 Page 重置、子组件按 DOM 树顺序递增，无需依赖编排注册机制。
 */
interface StaggerContextValue {
  enabled: boolean;
  register: () => number;
}

const StaggerContext = createContext<StaggerContextValue | null>(null);

/** 计算区块入场延迟：起始延迟 + 序号 * 交错间隔 */
const staggerDelay = (index: number): number =>
  DURATION.STAGGER_SECTION + index * DURATION.STAGGER_CHILD;

/** 页面容器 Props */
export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * 页面容器组件，全项目页面的唯一入场/出场入口。
 * 为子区块（PageSection / PageTitle）派发交错序号，使其错峰入场。
 */
export function Page({ children, className }: PageProps) {
  const { enabled } = useAnimation();
  const counter = useRef(0);
  counter.current = 0;
  const register = () => counter.current++;

  return (
    <StaggerContext.Provider value={{ enabled, register }}>
      <motion.div
        variants={pageContainer}
        initial={enabled ? 'initial' : false}
        animate={enabled ? 'animate' : false}
        exit={enabled ? 'exit' : undefined}
        className={`${className} h-full`}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

/** 页面区块 Props */
export interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * 页面区块组件，使用统一的区块入场/出场动画：
 * 入场 透明度淡入 + 上浮 16px（带弹性，按 Page 派发序号错峰）；
 * 出场 淡出 + 下移 12px（无回弹，同步退场）。
 */
export function PageSection({ children, className }: PageSectionProps) {
  const ctx = useContext(StaggerContext);
  const index = ctx?.register() ?? 0;
  const enabled = ctx?.enabled ?? true;
  let secVariant: Variants = pageSection;

  if (ctx) {
    const animate = pageSection.animate as TargetAndTransition | undefined;
    const transition = animate?.transition as Transition | undefined;
    if (animate && transition) {
      secVariant = {
        ...pageSection,
        animate: {
          ...animate,
          transition: { ...transition, delay: staggerDelay(index) },
        },
      };
    }
  }

  return (
    <motion.div
      variants={secVariant}
      initial={enabled && "initial"}
      animate={enabled && "animate"}
      exit={enabled ? "exit" : ""}
      className={className}
    >
      {children}
    </motion.div>
  );
}
