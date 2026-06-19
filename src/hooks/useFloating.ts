import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * 浮动层相对触发元素的放置位置。
 *
 * 格式 `{side}-{alignment}`：
 * - `side`: top / bottom / left / right
 * - `alignment`: start / center (省略) / end
 *
 * @example `top-start` — 触发元素上方，左对齐
 * @example `bottom` — 触发元素下方，居中对齐
 * @example `right-end` — 触发元素右侧，底部对齐
 */
export type FloatingPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

/**
 * 视口碰撞检测边界，各方向留白像素。
 */
export interface CollisionBoundary {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface UseFloatingOptions {
  /** 浮动元素的 ref（必须） */
  floatingRef: React.RefObject<HTMLElement | null>;
  /** anchor 模式：钉在哪个元素上 */
  anchorTo?: React.RefObject<HTMLElement | null>;
  /** 首选放置位置，默认 `bottom-start` */
  placement?: FloatingPlacement;
  /** 浮动层与触发元素之间的间距，默认 4px */
  offset?: number;
  /** origin 模式：绝对坐标 X */
  originX?: number;
  /** origin 模式：绝对坐标 Y */
  originY?: number;
  /** 视口碰撞边界，默认 `{}`（不预留空间） */
  collisionBoundary?: CollisionBoundary;
  /** 需要避开的元素 ref 列表，避免重叠 */
  avoidRefs?: React.RefObject<HTMLElement | null>[];
  /** 是否自动翻转 placement 以避免视口裁剪，仅 anchor 模式有效，默认 true */
  autoFlip?: boolean;
  /** 是否启用定位计算，默认 true */
  enabled?: boolean;
  /** 是否从 (0,0) 动画到正确位置（默认 false，直接定位到正确位置） */
  animateFromOrigin?: boolean;
}

interface UseFloatingReturn {
  /** 计算出的 X 坐标（fixed 坐标系） */
  x: number;
  /** 计算出的 Y 坐标（fixed 坐标系） */
  y: number;
  /** 实际生效的 placement（可能由于 autoFlip 而改变） */
  placement: FloatingPlacement;
  /** 手动触发重新定位 */
  updatePosition: () => void;
}

/**
 * 将 `'top-start'` 格式的 placement 解析为 `{ side, alignment }`。
 */
function parsePlacement(placement: FloatingPlacement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  alignment: 'start' | 'center' | 'end';
} {
  const parts = placement.split('-');
  const side = parts[0] as 'top' | 'bottom' | 'left' | 'right';
  const alignment = (parts[1] as 'start' | 'end') || 'center';
  return { side, alignment };
}

/**
 * 计算锚定位置。
 *
 * 根据 `placement` 和 `offset` 计算出浮动层相对于触发元素的固定坐标。
 */
function calculateAnchorPosition(
  trigger: DOMRect,
  floating: DOMRect,
  placement: FloatingPlacement,
  offset: number,
): { x: number; y: number } {
  const { side, alignment } = parsePlacement(placement);

  let x: number;
  let y: number;

  if (side === 'top' || side === 'bottom') {
    switch (alignment) {
      case 'start':
        x = trigger.left;
        break;
      case 'center':
        x = trigger.left + (trigger.width - floating.width) / 2;
        break;
      case 'end':
        x = trigger.right - floating.width;
        break;
    }
    y = side === 'bottom' ? trigger.bottom + offset : trigger.top - floating.height - offset;
  } else {
    switch (alignment) {
      case 'start':
        y = trigger.top;
        break;
      case 'center':
        y = trigger.top + (trigger.height - floating.height) / 2;
        break;
      case 'end':
        y = trigger.bottom - floating.height;
        break;
    }
    x = side === 'right' ? trigger.right + offset : trigger.left - floating.width - offset;
  }

  return { x, y };
}

/**
 * 将 placement 翻转到反方向，用于碰撞检测后的自动翻转。
 *
 * top ↔ bottom, left ↔ right，保留 alignment。
 */
function getFlippedPlacement(placement: FloatingPlacement): FloatingPlacement {
  const { side, alignment } = parsePlacement(placement);
  const flipMap: Record<string, string> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  const flipped = flipMap[side] || side;
  const suffix = alignment === 'center' ? '' : `-${alignment}`;
  return `${flipped}${suffix}` as FloatingPlacement;
}

/**
 * 检测给定位置是否超出视口边界。
 */
function detectViewportCollision(
  x: number,
  y: number,
  floatingWidth: number,
  floatingHeight: number,
  boundary: CollisionBoundary,
): boolean {
  return (
    x < (boundary.left ?? 0) ||
    x + floatingWidth > window.innerWidth - (boundary.right ?? 0) ||
    y < (boundary.top ?? 0) ||
    y + floatingHeight > window.innerHeight - (boundary.bottom ?? 0)
  );
}

/**
 * **L2 元素避开**：当浮动层与 `avoidRefs` 中的元素发生重叠时，沿最短路径推开。
 *
 * 算法：
 * 1. 计算四个方向的重叠量
 * 2. 仅当水平与垂直方向同时重叠才触发避开
 * 3. 选择位移量较小的方向移动
 * 4. 对每个 `avoidRef` 重复计算（但不做多轮收敛）
 *
 * TODO: iterate convergence until no further displacement or cap at N rounds
 * TODO: respect collisionBoundary after displacement (L2 push may cause new viewport collision)
 */
function resolveOverlap(
  x: number,
  y: number,
  floatingWidth: number,
  floatingHeight: number,
  avoidRefs: React.RefObject<HTMLElement | null>[],
): { x: number; y: number } {
  let rx = x;
  let ry = y;

  for (const ref of avoidRefs) {
    if (!ref.current) continue;
    const avoid = ref.current.getBoundingClientRect();

    const overlapLeft = Math.max(0, avoid.right - rx);
    const overlapRight = Math.max(0, rx + floatingWidth - avoid.left);
    const overlapTop = Math.max(0, avoid.bottom - ry);
    const overlapBottom = Math.max(0, ry + floatingHeight - avoid.top);

    const overlapsHorizontally = overlapLeft > 0 && overlapRight > 0;
    const overlapsVertically = overlapTop > 0 && overlapBottom > 0;

    if (!overlapsHorizontally || !overlapsVertically) continue;

    const dx = overlapLeft < overlapRight ? overlapLeft : -overlapRight;
    const dy = overlapTop < overlapBottom ? overlapTop : -overlapBottom;

    if (Math.abs(dx) <= Math.abs(dy)) {
      rx += dx;
    } else {
      ry += dy;
    }
  }

  return { x: rx, y: ry };
}

/**
 * **浮动定位引擎 hook**
 *
 * 支持两种模式（互斥）：
 * - **anchor 模式**：相对某个触发元素定位，配合 `placement` / `anchorTo` / `offset`
 * - **origin 模式**：在绝对坐标 (`originX`, `originY`) 处定位
 *
 * 定位保障（按优先级）：
 * 1. **L1 视口翻转**（仅 anchor 模式）：检测到视口碰撞时自动翻转 placement
 * 2. **L2 元素避开**：检测到与 `avoidRefs` 重叠时沿最短位移推开
 * 3. **L3 弹簧动画**：由调用方（Portal）通过 Framer Motion 驱动平滑过渡
 *
 * 自动重算：scroll（仅 anchor 模式）和 resize 事件会触发 `updatePosition`。
 *
 * @example anchor 模式
 * ```tsx
 * const { x, y } = useFloating({
 *   floatingRef,
 *   anchorTo: buttonRef,
 *   placement: 'bottom-start',
 *   offset: 4,
 * });
 * ```
 *
 * @example origin 模式
 * ```tsx
 * const { x, y } = useFloating({
 *   floatingRef,
 *   originX: 100,
 *   originY: 200,
 *   collisionBoundary: { bottom: 10, right: 10 },
 * });
 * ```
 */
export function useFloating(options: UseFloatingOptions): UseFloatingReturn {
  const {
    floatingRef,
    anchorTo,
    placement: preferredPlacement = 'bottom-start',
    offset = 4,
    originX,
    originY,
    collisionBoundary = {},
    avoidRefs = [],
    autoFlip = true,
    enabled = true,
    animateFromOrigin = false,
  } = options;

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [placement, setPlacement] = useState<FloatingPlacement>(preferredPlacement);

  const isAnchor = !!anchorTo;
  const isOrigin = originX !== undefined && originY !== undefined;
  const isActive = enabled && (isAnchor || isOrigin);

  const preferredRef = useRef(preferredPlacement);
  preferredRef.current = preferredPlacement;

  const updatePosition = useCallback(() => {
    if (!floatingRef.current) return;

    const floatingRect = floatingRef.current.getBoundingClientRect();
    let pos: { x: number; y: number };
    let currentPlacement = preferredRef.current;

    if (isAnchor && anchorTo?.current) {
      const triggerRect = anchorTo.current.getBoundingClientRect();
      pos = calculateAnchorPosition(triggerRect, floatingRect, currentPlacement, offset);

      if (autoFlip) {
        const collides = detectViewportCollision(
          pos.x, pos.y,
          floatingRect.width, floatingRect.height,
          collisionBoundary,
        );
        if (collides) {
          const flipped = getFlippedPlacement(currentPlacement);
          pos = calculateAnchorPosition(triggerRect, floatingRect, flipped, offset);
          currentPlacement = flipped;
          // TODO: re-run detectViewportCollision on the flipped position;
          //       the flipped placement might also collide in edge cases
        }
      }
    } else if (isOrigin) {
      pos = { x: originX, y: originY };

      const clamped = detectViewportCollision(
        pos.x, pos.y,
        floatingRect.width, floatingRect.height,
        collisionBoundary,
      );
      if (clamped) {
        pos.x = Math.max(
          collisionBoundary.left ?? 0,
          Math.min(pos.x, window.innerWidth - floatingRect.width - (collisionBoundary.right ?? 0)),
        );
        pos.y = Math.max(
          collisionBoundary.top ?? 0,
          Math.min(pos.y, window.innerHeight - floatingRect.height - (collisionBoundary.bottom ?? 0)),
        );
      }
    } else {
      return;
    }

    if (avoidRefs.length > 0) {
      // TODO: re-check collisionBoundary after L2 push — resolveOverlap may push
      //       element back into viewport collision
      pos = resolveOverlap(pos.x, pos.y, floatingRect.width, floatingRect.height, avoidRefs);
    }

    setX(pos.x);
    setY(pos.y);
    setPlacement(currentPlacement);
  }, [
    floatingRef, anchorTo, offset, preferredPlacement,
    originX, originY, collisionBoundary, avoidRefs, autoFlip,
    isAnchor, isOrigin,
  ]);

  useLayoutEffect(() => {
    if (!isActive) return;

    let rafId: number | undefined;

    if (animateFromOrigin) {
      rafId = requestAnimationFrame(() => updatePosition());
    } else {
      updatePosition();
    }

    window.addEventListener('resize', updatePosition);
    if (isAnchor) {
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, isAnchor, updatePosition, animateFromOrigin]);

  return { x, y, placement, updatePosition };
}
