import { Variants, Transition } from 'framer-motion';

/**
 * # 统一动效核心（单一事实源）
 *
 * 全项目所有动画的时长、缓动曲线与变体均定义在此文件，禁止在组件中硬编码魔数。
 * 文件按动画分类组织：
 *
 * 1. 主导航页面切换 — 路由容器水平滑动（`createRouteSlideVariants` / `routeFade`）
 * 2. 页面内部元素入场/出场 — `pageContainer` / `pageSection` / `sectionTitle`
 * 3. 弹窗 — `modalOpen` / `modalOverlay`
 * 4. 顶部悬浮通知 — `toast`
 * 5. 下拉面板 — `dropdown`
 * 6. 控件微交互 — `microInteractions`
 * 7. 循环动画 — 加载类组件（Spinner / Skeleton / ProgressBar 等）统一由 Loading/ 分发
 *
 * ## 曲线约定
 * - 入场位移（y/x/scale）用弹簧（`SPRING_ENTER`）轻微回弹，出场动画不带弹性（`IN_OUT_FLUENT`）
 * - "弹簧质感"来自 Back 族曲线过冲，而非实时物理弹簧积分
 */

/**
 * ## DURATION — 动画持续时间 token
 *
 * 命名层级：INSTANT（极快）→ FAST → NORMAL → MEDIUM → SLOW，
 * 业务语义：ROUTE_SLIDE（路由滑动）、ELEMENT_*（元素入场/出场）、
 * MODAL_*（弹窗开/关）、TOAST_*（通知入场/出场）、STAGGER_*（交错）。
 */
export const DURATION = {
  INSTANT: 0.05,
  FAST: 0.1,
  NORMAL: 0.15,
  MEDIUM: 0.2,
  SLOW: 0.3,
  ROUTE_SLIDE: 0.32,
  ELEMENT_ENTER: 0.32,
  ELEMENT_EXIT: 0.26,
  MODAL_OPEN: 0.34,
  MODAL_CLOSE: 0.28,
  TOAST_IN: 0.32,
  TOAST_OUT: 0.26,
  DROPDOWN: 0.26,
  STAGGER_CHILD: 0.07,
  STAGGER_SECTION: 0.1,
  SIDEBAR_TRANSITION: 0.26,
  LAYOUT_DEBOUNCE: 0.1,
} as const;

/**
 * ## EASING — 缓动曲线 token
 *
 * 曲线族（三次贝塞尔）：
 * - `LINEAR` — 线性，匀速
 * - `IN_FLUENT` — 立方缓动，先慢后快
 * - `OUT_FLUENT` — 立方缓动，先快后慢
 * - `IN_OUT_FLUENT` — 立方缓动，平滑启停（无越界）
 * - `IN_BACK` — 先向后退再前进（回弹）
 * - `SPRING_ENTER` — 元素入场位移弹簧（轻微回弹，弹性动效的主要来源）
 *
 * 弹簧族（用于布局与指示器跟位，如 layoutId 滑块）：
 * - `SPRING` — 通用
 * - `SPRING_ENTER` — 元素入场位移（y/x/scale），物理弹簧轻微回弹
 * - `SPRING_SOFT` — 大容器级入场（灵动岛岛体等）
 * - `SPRING_GENTLE` — 指示条移动
 * - `SPRING_BOUNCY` — 强调回弹
 * - `SPRING_STIFF` — 图标等小物件快速响应
 */
export const EASING = {
  LINEAR: [0, 0, 1, 1] as const,
  IN_FLUENT: [0.42, 0, 1, 1] as const,
  OUT_FLUENT: [0, 0, 0.58, 1] as const,
  IN_OUT_FLUENT: [0.42, 0, 0.58, 1] as const,
  IN_BACK: [0.36, 0, 0.66, -0.56] as const,
  OUT_BACK: [0.34, 1.15, 0.64, 1] as const,
  SPRING: { type: 'spring', stiffness: 500, damping: 38 } as Transition,
  SPRING_ENTER: { type: 'spring', stiffness: 250, damping: 30 } as Transition,
  SPRING_SOFT: { type: 'spring', stiffness: 350, damping: 30 } as Transition,
  SPRING_GENTLE: { type: 'spring', stiffness: 400, damping: 36 } as Transition,
  SPRING_BOUNCY: { type: 'spring', stiffness: 700, damping: 28 } as Transition,
  SPRING_STIFF: { type: 'spring', stiffness: 400, damping: 22 } as Transition,
} as const;

/**
 * ## transitions — 过渡速记（基于 DURATION + EASING 组合）
 *
 * @example
 * ```tsx
 * <motion.div transition={transitions.fast} />
 * ```
 */
export const transitions = {
  fast: { duration: DURATION.FAST, ease: EASING.OUT_FLUENT } as Transition,
  normal: { duration: DURATION.NORMAL, ease: EASING.OUT_FLUENT } as Transition,
  slow: { duration: DURATION.SLOW, ease: EASING.OUT_FLUENT } as Transition,
  spring: EASING.SPRING,
  springBouncy: EASING.SPRING_BOUNCY,
} as const;

/**
 * ## microInteractions — 微交互预设（for whileHover / whileTap）
 *
 * 直接赋值给 Framer Motion 的 gesture props，统一所有组件的悬停/点击反馈。
 * 悬停缩放 1.05 与点击缩放 0.95 为统一按钮反馈基准。
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
  listItemHover: { scale: 1.0 },
  listItemTap: { scale: 0.99 },
  itemHover: { scale: 1.01 },
  itemTap: { scale: 0.97 },
  menuItemHover: { scale: 1.02 },
  menuItemTap: { scale: 0.98 },
  contextMenuHover: { x: 2 },
} as const;

/**
 * 路由方向判定窗口（毫秒）。
 * 导航后该时间段内的方向视为"新鲜"，用于决定页面滑动方向。
 */
export const ROUTE_DIRECTION_FRESH_MS = 500;

/**
 * ## createRouteSlideVariants — 主页面切换（容器水平滑动）
 *
 * 由 RouterRenderer 使用。进入侧带弹性（SPRING_ENTER，弹簧轻微回弹）。
 * 退出统一为淡出（不带 x）：保证动画中途变体切换时旧页无 x 目标可断开，永不冻结。
 *
 * @param forward - true 表示新页面从右侧滑入、旧页面滑向左侧
 */
export const createRouteSlideVariants = (forward: boolean): Variants => ({
  initial: { x: forward ? '100%' : '-100%' },
  animate: {
    x: 0,
    transition: { ...EASING.SPRING_ENTER },
  },
  exit: {
    opacity: 0.5,
    transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT },
  },
});

/** 路由首屏/无方向时的纯淡入过渡（animate 含 x: 0，防止中途变体切换时滑入冻结）。
 * 淡入/淡出收敛于半透明（0.5），避免切换中途页面全透明导致窗口空白闪烁。 */
export const routeFade: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.NORMAL, ease: EASING.OUT_FLUENT },
  },
  exit: {
    opacity: 0.5,
    transition: { duration: DURATION.NORMAL, ease: EASING.IN_OUT_FLUENT },
  },
};

/**
 * ## pageContainer — 页面容器
 *
 * 由 Page 使用，负责交错编排子区块（stagger），
 * 页面内容自身的透明/位移动画由 pageSection 承担。
 */
export const pageContainer: Variants = {
  initial: { opacity: 0.8 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: DURATION.STAGGER_CHILD,
      delayChildren: DURATION.STAGGER_SECTION,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: DURATION.STAGGER_CHILD * 0.6,
      staggerDirection: -1,
    },
  },
};

/**
 * ## pageSection — 页面区块入场/出场（页面内部元素动画基准）
 *
 * 入场：透明度淡入（OUT_FLUENT）+ 垂直上浮 16px（SPRING_ENTER，弹性来源）
 * 出场：透明度淡出 + 下移 12px（IN_OUT_FLUENT，无回弹）
 *
 * 规则：入场带弹性，出场不带弹性。
 */
export const pageSection: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0.7,
    y: -16,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 400,
    },
  },
};

/** 区块标题：水平偏移入场（TranslateX），出场无回弹 */
export const sectionTitle: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
      x: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT },
  },
};

/** 弹窗内容：缩放 0.95→1 + 淡入（打开带动弹出，关闭无回弹） */
export const modalOpen: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      opacity: { duration: DURATION.MODAL_OPEN, ease: EASING.OUT_FLUENT },
      scale: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATION.MODAL_CLOSE, ease: EASING.IN_OUT_FLUENT },
  },
};

/** 弹窗遮罩：淡入/淡出 */
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.MODAL_OPEN, ease: EASING.OUT_FLUENT },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.MODAL_CLOSE, ease: EASING.IN_OUT_FLUENT },
  },
};

/** 顶部悬浮通知：从窗口顶部滑入（弹出），滑出无回弹 */
export const toast: Variants = {
  initial: { opacity: 0, y: -48 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: DURATION.TOAST_IN, ease: EASING.OUT_FLUENT },
      y: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    y: -24,
    transition: { duration: DURATION.TOAST_OUT, ease: EASING.IN_OUT_FLUENT },
  },
};

/** 下拉面板：下滑 + 缩放淡入 */
export const dropdown: Variants = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.DROPDOWN, ease: EASING.OUT_FLUENT },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: DURATION.DROPDOWN, ease: EASING.IN_OUT_FLUENT },
  },
};

/**
 * ## staggerContainer / staggerItem — 错峰列表容器（配合互用，如实例列表）
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: DURATION.STAGGER_CHILD,
      delayChildren: DURATION.STAGGER_SECTION,
    },
  },
  exit: {
    transition: {
      staggerChildren: DURATION.STAGGER_SECTION * 0.6,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
      y: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT },
  },
};

/**
 * 侧边栏错峰参数（组内菜单项入场延迟：起始延迟 + 序号 * 步长）。
 * 供 sidebarStaggerContainer / sidebarStaggerItem 及 BaseSidebarContent 使用。
 */
export const SIDEBAR_STAGGER_DELAY = 0.15;
export const SIDEBAR_STAGGER_STEP = 0.14;

/** 侧边栏菜单项错峰容器 */
export const sidebarStaggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: SIDEBAR_STAGGER_STEP,
      delayChildren: SIDEBAR_STAGGER_DELAY,
    },
  },
};

/** 侧边栏菜单单项：水平偏移入场（弹性） */
export const sidebarStaggerItem: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
      x: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT },
  },
};

/** 列表项入场 + 悬停/点击变体（交上级容器编排 stagger，自身不设 initial/animate） */
export const listItem: Variants = {
  initial: { y: -20 },
  animate: { y: 0, transition: { ...EASING.SPRING_ENTER } },
  exit: { y: 20, transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT } },
  hover: microInteractions.listItemHover,
  tap: microInteractions.listItemTap,
};

/** 卡片悬停 + 点击变体 */
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.01,
    y: -2,
    boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
    transition: { duration: DURATION.FAST, ease: EASING.OUT_FLUENT },
  },
  tap: { scale: 0.99, transition: { duration: DURATION.INSTANT } },
};

/** 淡入 + 上移变体（空状态等） */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: DURATION.ELEMENT_ENTER, ease: EASING.OUT_FLUENT },
      y: { ...EASING.SPRING_ENTER },
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.ELEMENT_EXIT, ease: EASING.IN_OUT_FLUENT },
  },
};