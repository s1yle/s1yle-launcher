import { Variants, Transition } from 'framer-motion';

/**
 * ## DURATION — 动画持续时间常量（单一来源）
 *
 * 所有动画组件的持续时间应引用此处，禁止硬编码魔数。
 * 命名层级：INSTANT（极快）→ FAST → NORMAL → MEDIUM → SLOW
 *
 * @example
 * ```tsx
 * <motion.div transition={{ duration: DURATION.NORMAL }} />
 * <Animated duration={DURATION.MEDIUM} />
 * ```
 */
export const DURATION = {
  INSTANT: 0.05,
  FAST: 0.1,
  NORMAL: 0.15,
  MEDIUM: 0.2,
  SLOW: 0.3,
  PAGE_TRANSITION: 0.35,
  SIDEBAR_TRANSITION: 0.2,
  LAYOUT_DEBOUNCE: 0.10,
} as const;

/**
 * ## EASING — 缓动函数预设
 *
 * @property DEFAULT - 自定义三次贝塞尔 [0.25, 0.1, 0.25, 1]，适用于大多数 UI 动画
 * @property DEFAULT - 自定义三次贝塞尔 [0.1, 0.15, 0.1, 0.15]
 * @property SMOOTH - easeOut，快速进入、缓慢结束
 * @property SPRING - 弹簧 stiffness:500 damping:30，通用弹性
 * @property SPRING_BOUNCY - 弹力更强 stiffness:700 damping:20
 * @property SPRING_STIFF - 硬弹簧 stiffness:400 damping:15，用于图标悬停等微交互
 */
export const EASING = {
  DEFAULT: [0.25, 0.1, 0.25, 1] as const,
  FAST: [0.1, 0.15, 0.1, 0.15] as const,
  SMOOTH: 'easeOut' as const,
  SPRING: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  SPRING_BOUNCY: { type: 'spring', stiffness: 700, damping: 20 } as Transition,
  SPRING_STIFF: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
} as const;

/**
 * ## microInteractions — 微交互预设（for whileHover / whileTap）
 *
 * 直接赋值给 Framer Motion 的 gesture props，统一所有组件的悬停/点击反馈。
 *
 * @example
 * ```tsx
 * <motion.button
 *   whileHover={microInteractions.buttonHover}
 *   whileTap={microInteractions.buttonTap}
 * />
 * ```
 */
export const microInteractions = {
  buttonHover: { scale: 1.05 },
  buttonTap: { scale: 0.95 },
  secondaryButtonHover: { scale: 1.02 },
  secondaryButtonTap: { scale: 0.98 },
  iconHover: { scale: 1.15 },
  iconTap: { scale: 0.9 },
  cardHover: { scale: 1.01, y: -2 },
  cardTap: { scale: 0.99 },
  deleteIconHover: { scale: 1.1 },
  deleteIconTap: { scale: 0.9 },
  listItemHover: { scale: 1.01 },
  listItemTap: { scale: 0.99 },
  itemHover: { scale: 1.01 },
  itemTap: { scale: 0.97 },
  menuItemHover: { scale: 1.02 },
  menuItemTap: { scale: 0.98 },
  contextMenuHover: { x: 2 },
} as const;

/**
 * ## transitions — 过渡预设（向后兼容）
 *
 * 基于 DURATION + EASING 组合，提供语义化过渡配置。
 * 新组件优先使用 DURATION 常量直接传值，旧组件可直接引用此对象。
 *
 * @example
 * ```tsx
 * <motion.div transition={transitions.fast} />
 * ```
 */
export const transitions = {
  fast: { duration: DURATION.FAST, ease: EASING.SMOOTH } as Transition,
  normal: { duration: DURATION.NORMAL, ease: EASING.SMOOTH } as Transition,
  slow: { duration: DURATION.SLOW, ease: EASING.SMOOTH } as Transition,
  spring: EASING.SPRING,
  springBouncy: EASING.SPRING_BOUNCY,
} as const;

/**
 * ## pageTransition — 页面切换入场/退场变体
 *
 * 由 RouterRenderer 使用，配合 AnimatePresence mode="wait" 实现页面过渡。
 * 组合了缩放（0.97→1）+ 轻微上移（y:5→0）效果。
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 5 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -3 },
};

/**
 * ## sidebarSlide — 侧边栏面板滑入/滑出（完整面板级别）
 *
 * 由 AppSidebar 使用，基于 CSS 百分比宽度实现与 sidebarWidth 无关的滑动。
 */
export const sidebarSlide: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

/**
 * ## sidebarContent — 侧边栏内容区域切换
 *
 * 由 SmartSidebar 使用，在路由变化时切换侧边栏内容。
 * 轻微水平位移（±10px）+ 透明度变化。
 */
export const sidebarContent: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

/**
 * ## sidebarItemStagger — 侧边栏菜单项入场
 *
 * 配合 stagger delay（index * 0.03）实现逐项滑入效果。
 * 旧版 BaseSidebarContent 使用，已逐步迁移到 `<Animated>` 组件。
 */
export const sidebarItemStagger: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
};

/**
 * ## accordionExpand — 折叠面板展开/收起
 *
 * 通过 height: 0 ↔ auto + opacity 实现平滑展开/收起。
 * 旧版 BaseSidebarContent 的子菜单使用，已逐步迁移到 `<Animated accordion={}>`。
 */
export const accordionExpand: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

// ── Existing variants (backward-compatible, now reference constants) ──
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
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  hover: microInteractions.listItemHover,
  tap: microInteractions.listItemTap,
};

export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.01,
    y: -2,
    boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
    transition: { duration: DURATION.FAST },
  },
  tap: { scale: 0.99, transition: { duration: DURATION.INSTANT } },
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
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/** 侧边栏菜单项错峰入场 — spring 弹性交错 */
export const sidebarStaggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.15,
    },
  },
};

/** 侧边栏菜单单项 — 配合 sidebarStaggerContainer 使用 */
export const sidebarStaggerItem: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
  },
};

/** 区块级错峰入场 — 配合 staggerContainer 使用 */
export const staggerSection: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
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
