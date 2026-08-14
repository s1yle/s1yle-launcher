import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';
import { DURATION, EASING } from '@/utils/animations';

/** 数字滚动显示组件 Props */
export interface CountUpProps {
  /** 目标数值 */
  value: number;
  /** 动画时长（秒），默认 DURATION.SLOW */
  duration?: number;
  /** 缓动曲线，默认 OUT_FLUENT（先快后慢） */
  ease?: readonly [number, number, number, number];
  /** 延迟（秒） */
  delay?: number;
  /** 数字格式化为字符串的函数，默认按 decimals 保留小数 */
  format?: (value: number) => string;
  /** 小数位，默认 0 */
  decimals?: number;
  /** 进入视口后才开始滚动 */
  inView?: boolean;
  className?: string;
}

/**
 * ## `<CountUp>` — 数字滚动显示组件
 *
 * 数值变化时平滑插值滚动（如版本数量、下载速度等）。
 * 时长与曲线引用统一动效核心 token。
 *
 * @example
 * ```tsx
 * <CountUp value={totalPlayers} className="text-3xl font-bold" />
 * <CountUp value={speed} decimals={1} format={(v) => `${v.toFixed(1)} MB/s`} />
 * ```
 */
export function CountUp({
  value,
  duration = DURATION.SLOW,
  ease = EASING.OUT_FLUENT,
  delay = 0,
  format,
  decimals = 0,
  inView = false,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inViewState = useInView(ref, { once: true, margin: '-40px' });
  const [text, setText] = useState(() => defaultFormat(0, decimals));

  const show = !inView || inViewState;

  useEffect(() => {
    if (!show) return;

    const controls = animate(0, value, {
      duration,
      ease,
      delay,
      onUpdate: (v) => {
        setText(format ? format(v) : defaultFormat(v, decimals));
      },
    });
    return () => controls.stop();
  }, [value, duration, ease, delay, decimals, format, show]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

function defaultFormat(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}