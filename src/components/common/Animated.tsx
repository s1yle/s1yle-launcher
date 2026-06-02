import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DURATION, EASING } from '@/utils/animations';

type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * ## AnimatedProps — 动画行为组合的声明式接口
 *
 * 每个 prop 代表一种独立的动画行为，多个行为通过变体对象合并自然组合。
 * 空行为（无 fade/slide/scale）时直接渲染 children，无额外包装。
 *
 * @prop fade - 透明度 0→1
 * @prop slide - 方向滑入（offset ±10px）
 * @prop scale - 缩放 0.95→1（传 number 自定义初始值）
 * @prop accordion - 折叠展开（高度 0↔auto），基于 AnimatePresence 的条件挂载
 * @prop stagger - 交错容器（值为子项间延迟秒数），配合 `<Animated.Item>` 使用
 * @prop delay - 动画开始延迟（秒）
 * @prop duration - 动画持续时间（秒），默认 DURATION.NORMAL
 * @prop disabled - 禁用动画，直接渲染 children
 */
export interface AnimatedProps {
  children: React.ReactNode;
  fade?: boolean;
  slide?: SlideDirection;
  scale?: boolean | number;
  accordion?: boolean;
  stagger?: number;
  delay?: number;
  duration?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 将行为 props 合并为 Framer Motion variants 对象。
 * 每个行为贡献自己的 initial / animate / exit 片段，通过 Object.assign 合并。
 */
function getBehaviorVariants({ fade, slide, scale }: AnimatedProps): Variants {
  const initial: Record<string, any> = {};
  const animate: Record<string, any> = {};
  const exit: Record<string, any> = {};

  if (fade) {
    initial.opacity = 0;
    animate.opacity = 1;
    exit.opacity = 0;
  }

  if (slide) {
    const offset = 10;
    const reverse: Record<SlideDirection, SlideDirection> = {
      left: 'right', right: 'left', up: 'down', down: 'up',
    };
    const dir: Record<SlideDirection, Record<string, number>> = {
      left: { x: -offset },
      right: { x: offset },
      up: { y: offset },
      down: { y: -offset },
    };
    Object.assign(initial, dir[slide]);
    Object.assign(exit, dir[reverse[slide]]);
    animate.x = 0;
    animate.y = 0;
  }

  if (scale) {
    const s = typeof scale === 'number' ? scale : 0.95;
    initial.scale = s;
    animate.scale = 1;
    exit.scale = 0.95;
  }

  return { initial, animate, exit };
}

/** Animated.Item 的子项入场变体 */
const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * 交错列表子项组件，配合 `<Animated stagger={}>` 容器使用。
 * 每个子项自动获得淡入 + 上移入场动画，由父容器的 staggerChildren 驱动延时。
 */
const AnimatedItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div variants={itemVariants} className={className}>
    {children}
  </motion.div>
);

/**
 * ## `<Animated>` — 行为组合动画包装器
 *
 * 通过 props 组合声明动画行为（fade / slide / scale），
 * 内部行为变体自动合并。支持三种特殊模式：
 *
 * - **accordion**: 基于 AnimatePresence 的条件挂载展开/折叠
 * - **stagger**: 交错列表容器，子项需使用 `<Animated.Item>`
 * - **默认**: 无行为 prop 时直接渲染 children（零开销）
 *
 * 动画禁用时（`disabled` prop），内部 transition 设为 `{ duration: 0 }`，
 * 组件结构保持一致，不卸载 motion 包装器。
 *
 * @example
 * ```tsx
 * <Animated fade slide="left" delay={index * 0.03}>
 *   <SidebarItem />
 * </Animated>
 *
 * <Animated accordion={isOpen}>
 *   <SubMenu />
 * </Animated>
 *
 * <Animated stagger={0.05}>
 *   {items.map(i => <Animated.Item key={i.id}>{i}</Animated.Item>)}
 * </Animated>
 * ```
 */
function AnimatedInner({
  children,
  accordion,
  stagger,
  disabled = false,
  delay = 0,
  duration = DURATION.NORMAL,
  className,
  style,
  ...behaviors
}: AnimatedProps): React.ReactElement {
  const t = { duration: disabled ? 0 : duration, delay: disabled ? 0 : delay };

  // Accordion — needs AnimatePresence + conditional mount
  if (accordion !== undefined) {
    return (
      <AnimatePresence>
        {accordion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: disabled ? 0 : DURATION.MEDIUM, ease: EASING.DEFAULT }}
            className={`overflow-hidden ${className ?? ''}`}
            style={style}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Stagger container
  if (stagger !== undefined) {
    const staggerVariants: Variants = {
      initial: {},
      animate: {
        transition: {
          staggerChildren: stagger,
          delayChildren: disabled ? 0 : (delay || 0.1),
        },
      },
      exit: disabled ? {} : {
        transition: { staggerChildren: stagger, staggerDirection: -1 },
      },
    };

    return (
      <motion.div
        className={className}
        style={style}
        variants={staggerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    );
  }

  // Behavior composition
  const variants = getBehaviorVariants(behaviors as AnimatedProps);

  if (Object.keys(variants.initial as object).length === 0) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={t}
    >
      {children}
    </motion.div>
  );
}

/**
 * 组合动画组件，包含：
 * - `Animated` — 行为组合包装器（fade / slide / scale / accordion / stagger）
 * - `Animated.Item` — 交错列表子项（配合 `stagger` 容器使用）
 */
export const Animated = Object.assign(AnimatedInner, { Item: AnimatedItem });
