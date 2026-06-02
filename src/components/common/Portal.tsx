import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, type Transition } from 'framer-motion';
import { useFloating } from '@/hooks/useFloating';
import { useRefRegistryStore } from '@/stores/refRegistryStore';
import { Z_INDEX } from '@/utils/zIndex';
import { EASING } from '@/utils/animations';
import type { FloatingPlacement, CollisionBoundary } from '@/hooks/useFloating';

/**
 * 预设位置常量，用于 `Portal` 的 `preset` 参数。
 *
 * 提供一组预设的定位方式，适用于弹窗组件（Popup / Modal / Toast）。
 *
 * - `center`：视口正中央，flex 居中对齐，外层 `pointerEvents: none`，内层 `pointerEvents: auto`
 * - `top` / `bottom`：顶部 / 底部通栏
 * - `top-left` / `top-right` / `bottom-left` / `bottom-right`：四角固定（间距 16px）
 */
export type PresetPosition =
  | 'center'
  | 'top' | 'bottom'
  | 'top-left' | 'top-right'
  | 'bottom-left' | 'bottom-right';

interface PortalProps {
  children: React.ReactNode;

  /** 渲染容器，默认 `document.body` */
  container?: HTMLElement | null;

  /**
   * 外部传入的浮动层 ref。
   * anchor 模式下若需外部访问浮动层 DOM 节点时使用。
   */
  floatingRef?: React.RefObject<HTMLDivElement | null>;

  // ── anchor 模式 ──────────────────────────────────
  /** anchor 模式：钉在哪个元素上 */
  anchorTo?: React.RefObject<HTMLElement | null>;
  /** 放置位置，默认 `bottom-start` */
  placement?: FloatingPlacement;
  /** 浮动层与触发元素的间距，默认 4px */
  offset?: number;

  // ── origin 模式 ──────────────────────────────────
  /** origin 模式：绝对坐标 X */
  originX?: number;
  /** origin 模式：绝对坐标 Y */
  originY?: number;

  // ── preset 模式 ──────────────────────────────────
  /** preset 模式：使用预设定位（互斥于其他模式） */
  preset?: PresetPosition;

  // ── draggable 模式 ────────────────────────────────
  /** draggable 模式：启用鼠标拖拽（互斥于其他模式） */
  draggable?: boolean;
  /** 初始位置，默认 `{ x: 0, y: 0 }` */
  defaultPosition?: { x: number; y: number };
  /** 拖拽结束时的回调，参数为当前绝对坐标 */
  onPositionChange?: (pos: { x: number; y: number }) => void;

  /** 覆盖默认的 z-index，不传则根据模式自动选择 */
  zIndex?: number;

  /** 视口碰撞边界（anchor / origin 模式适用） */
  collisionBoundary?: CollisionBoundary;

  /**
   * 需要避开的元素列表。
   *
   * 支持两种格式：
   * - `React.RefObject<HTMLElement | null>`：直接传入 ref
   * - `string`：从 `refRegistryStore` 中查找已注册的 key
   *
   * 适用于下拉菜单等场景，避免遮挡其他 UI 元素。
   */
  avoidRefs?: (React.RefObject<HTMLElement | null> | string)[];

  /** 覆盖默认的弹簧动画过渡参数（仅 anchor / origin / draggable 模式） */
  transition?: Transition;
}

const springTransition = EASING.SPRING;

const presetStyles: Record<PresetPosition, React.CSSProperties> = {
  center: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  top: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
  },
  bottom: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
  },
  'top-left': {
    position: 'fixed',
    top: 16,
    left: 16,
  },
  'top-right': {
    position: 'fixed',
    top: 16,
    right: 16,
  },
  'bottom-left': {
    position: 'fixed',
    bottom: 16,
    left: 16,
  },
  'bottom-right': {
    position: 'fixed',
    bottom: 16,
    right: 16,
  },
};

/**
 * **anchor 模式**子组件。
 *
 * 通过 `useFloating` hook 实现相对定位 + L1 视口自动翻转 + L2 元素避开。
 * 位置变化通过 Framer Motion 弹簧动画过渡。
 */
function AnchorContent({
  children,
  container,
  anchorTo,
  externalRef,
  zIndex,
  placement,
  offset,
  collisionBoundary,
  avoidRefs,
  transition = springTransition,
}: {
  children: React.ReactNode;
  container: HTMLElement | null | undefined;
  anchorTo: React.RefObject<HTMLElement | null>;
  externalRef?: React.RefObject<HTMLDivElement | null>;
  zIndex?: number;
  placement?: FloatingPlacement;
  offset?: number;
  collisionBoundary?: CollisionBoundary;
  avoidRefs?: React.RefObject<HTMLElement | null>[];
  transition?: Transition;
}) {
  const internalRef = useRef<HTMLDivElement>(null);
  const floatingRef = externalRef || internalRef;

  const { x, y } = useFloating({
    floatingRef,
    anchorTo,
    placement,
    offset,
    collisionBoundary,
    avoidRefs,
    autoFlip: true,
    enabled: true,
  });

  return createPortal(
    <motion.div
      ref={floatingRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: zIndex ?? Z_INDEX.DROPDOWN,
      }}
      animate={{ left: x, top: y }}
      transition={{
        left: transition,
        top: transition,
      }}
    >
      {children}
    </motion.div>,
    container || document.body,
  );
}

/**
 * **origin 模式**子组件。
 *
 * 在指定绝对坐标处定位，仅监听 resize（不监听 scroll，因为 fixed 坐标不随滚动移动）。
 * 配合 L2 元素避开 + 视口碰撞回退（夹紧而非翻转）。
 */
function OriginContent({
  children,
  container,
  x: originX,
  y: originY,
  zIndex,
  collisionBoundary,
  avoidRefs,
  transition = springTransition,
}: {
  children: React.ReactNode;
  container: HTMLElement | null | undefined;
  x: number;
  y: number;
  zIndex?: number;
  collisionBoundary?: CollisionBoundary;
  avoidRefs?: React.RefObject<HTMLElement | null>[];
  transition?: Transition;
}) {
  const floatingRef = useRef<HTMLDivElement>(null);

  const { x, y } = useFloating({
    floatingRef,
    originX,
    originY,
    collisionBoundary,
    avoidRefs,
    autoFlip: false,
    enabled: true,
  });

  return createPortal(
    <motion.div
      ref={floatingRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: zIndex ?? Z_INDEX.DROPDOWN,
      }}
      animate={{ left: x, top: y }}
      transition={{
        left: transition,
        top: transition,
      }}
    >
      {children}
    </motion.div>,
    container || document.body,
  );
}

/**
 * **preset 模式**子组件。
 *
 * 使用预设的 CSS 定位方式（center / top / bottom / 四角）。
 * 不接入 `useFloating` hook，无碰撞检测或避开逻辑。
 *
 * TODO: add optional collisionBoundary/avoidRefs support for preset modes
 *       (e.g. center → clamp within safe-area when viewport is small)
 */
function PresetContent({
  children,
  container,
  preset,
  zIndex,
}: {
  children: React.ReactNode;
  container: HTMLElement | null | undefined;
  preset: PresetPosition;
  zIndex?: number;
}) {
  const style: React.CSSProperties = {
    ...presetStyles[preset],
    zIndex: zIndex ?? Z_INDEX.POPUP,
  };

  const innerStyle: React.CSSProperties =
    preset === 'center' ? { pointerEvents: 'auto' } : {};

  return createPortal(
    <div style={style}>
      <div style={innerStyle}>{children}</div>
    </div>,
    container || document.body,
  );
}

/**
 * **draggable 模式**子组件。
 *
 * 使用 Pointer Events 实现拖拽，内部用 ref 维护实时位置（避免 re-render 抖动）。
 * 拖拽时 transition 设为 `{ duration: 0 }` 以消除弹簧动画拖尾感；
 * 非拖拽时恢复弹簧动画。
 *
 * TODO: add `dragBoundary` prop to clamp position within viewport
 * TODO: add `onDragStart`/`onDragEnd` callbacks so consumers can track drag state
 * TODO: add optional `storageKey` prop for auto-persisting position to localStorage
 */
function DraggableContent({
  children,
  container,
  defaultPosition,
  onPositionChange,
  zIndex,
  transition = springTransition,
}: {
  children: React.ReactNode;
  container: HTMLElement | null | undefined;
  defaultPosition?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  transition?: Transition;
  // TODO: add floatingRef prop so DraggableContent surfaces its container element
}) {
  const [pos, setPos] = useState(defaultPosition ?? { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const posRef = useRef(pos);
  posRef.current = pos;
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: posRef.current.x,
        originY: posRef.current.y,
      };
    },
    [],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      onPositionChange?.(posRef.current);
      dragRef.current = null;
      setIsDragging(false);
    }
  }, [onPositionChange]);

  return createPortal(
    <motion.div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: zIndex ?? Z_INDEX.POPUP,
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      animate={{ left: pos.x, top: pos.y }}
      transition={isDragging ? { duration: 0 } : transition}
    >
      {children}
    </motion.div>,
    container || document.body,
  );
}

/**
 * **智能 Portal** — DOM 传送 + 浮动定位统一入口。
 *
 * 提供 5 种互斥渲染模式，按 props 优先级匹配：
 *
 * | 模式 | 触发条件 | 典型场景 |
 * |------|----------|----------|
 * | `anchorTo` | 传入 `anchorTo` ref | 下拉菜单、工具提示 |
 * | `originX/Y` | 传入 `originX` + `originY` | 右键菜单 |
 * | `preset` | 传入 `preset` 字符串 | 弹窗、模态框、Toast |
 * | `draggable` | 传入 `draggable=true` | 可拖拽浮动按钮 |
 * | **simple**（兜底） | 以上均不匹配 | 仅需 DOM 传送，自管理定位 |
 *
 * 定位保障（仅 anchor / origin 模式）：
 * - **L1** 视口碰撞自动调整（anchor 翻转，origin 夹紧）
 * - **L2** 元素避开，避免与 `avoidRefs` 重叠
 * - **L3** Framer Motion 弹簧动画提供平滑过渡
 *
 * TODO: consider adding `onClickOutside` prop for unified outside-click handling
 *       (currently each consumer implements `useClickOutside` independently)
 *
 * **SSR 安全**：通过 `mounted` 状态守卫，在客户端渲染前返回 null。
 *
 * @example anchor 模式
 * ```tsx
 * <Portal anchorTo={buttonRef} placement="bottom-start" offset={4}>
 *   <DropdownMenu />
 * </Portal>
 * ```
 *
 * @example origin 模式
 * ```tsx
 * <Portal originX={mouseX} originY={mouseY} collisionBoundary={{bottom:10,right:10}}>
 *   <ContextMenu />
 * </Portal>
 * ```
 *
 * @example preset 模式
 * ```tsx
 * <Portal preset="center" zIndex={Z_INDEX.MODAL}>
 *   <ModalContent />
 * </Portal>
 * ```
 *
 * @example draggable 模式
 * ```tsx
 * <Portal draggable defaultPosition={{x:100,y:16}} zIndex={Z_INDEX.POPUP}>
 *   <FloatingButton />
 * </Portal>
 * ```
 *
 * @example simple 模式
 * ```tsx
 * <Portal>
 *   <CustomTooltip />
 * </Portal>
 * ```
 */
export function Portal({
  children,
  container,
  floatingRef,
  anchorTo,
  placement,
  offset,
  originX,
  originY,
  preset,
  draggable,
  defaultPosition,
  onPositionChange,
  zIndex,
  collisionBoundary,
  avoidRefs,
  transition = springTransition,
}: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const refRegistry = useRefRegistryStore((s) => s.refs);

  const resolvedAvoidRefs = useMemo(() => {
    if (!avoidRefs || avoidRefs.length === 0) return [];
    return avoidRefs.map((r) => {
      if (typeof r === 'string') {
        return { current: refRegistry[r] ?? null } as React.RefObject<HTMLElement | null>;
      }
      return r;
    });
  }, [avoidRefs, refRegistry]);

  if (!mounted) return null;

  if (anchorTo) {
    return (
      <AnchorContent
        container={container}
        anchorTo={anchorTo}
        externalRef={floatingRef}
        zIndex={zIndex}
        placement={placement}
        offset={offset}
        collisionBoundary={collisionBoundary}
        avoidRefs={resolvedAvoidRefs}
        transition={transition}
      >
        {children}
      </AnchorContent>
    );
  }

  if (originX !== undefined && originY !== undefined) {
    return (
      <OriginContent
        container={container}
        x={originX}
        y={originY}
        zIndex={zIndex}
        collisionBoundary={collisionBoundary}
        avoidRefs={resolvedAvoidRefs}
        transition={transition}
      >
        {children}
      </OriginContent>
    );
  }

  if (preset) {
    return (
      <PresetContent container={container} preset={preset} zIndex={zIndex}>
        {children}
      </PresetContent>
    );
  }

  if (draggable) {
    // TODO: pass avoidRefs + collisionBoundary into DraggableContent
    return (
      <DraggableContent
        container={container}
        defaultPosition={defaultPosition}
        onPositionChange={onPositionChange}
        zIndex={zIndex}
        transition={transition}
      >
        {children}
      </DraggableContent>
    );
  }

  // TODO: when zIndex is passed in simple mode, wrap children in a `<div style{{zIndex}}>` container
  return createPortal(children, container || document.body);
}
