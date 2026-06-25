import { type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLoadingStore } from '@/stores/loadingStore';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

function useSkeleton(extra?: string): string {
  const style = useLoadingStore((s) => s.config.skeletonStyle);
  const anim = style === 'pulse' ? 'animate-pulse'
    : style === 'shimmer' ? 'skeleton-shimmer'
    : '';
  const bg = style === 'shimmer'
    ? ''
    : 'bg-[var(--color-surface-tertiary)]';
  return cn('rounded', bg, anim, extra);
}

/** 骨架屏方块 Props */
export interface SkeletonBoxProps {
  className?: string;
  style?: CSSProperties;
}

const Box = ({ className, style }: SkeletonBoxProps) => (
  <div className={useSkeleton(className)} style={style} />
);

/** 骨架屏文本 Props */
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

const Text = ({ lines = 3, className, lastLineWidth = '60%' }: SkeletonTextProps) => {
  const base = useSkeleton();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(base, 'h-3')}
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
};

/** 骨架屏圆形 Props */
export interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

const Circle = ({ size = 40, className }: SkeletonCircleProps) => (
  <div
    className={cn(useSkeleton(), 'rounded-full', className)}
    style={{ width: size, height: size }}
  />
);

/** 骨架屏列表 Props */
export interface SkeletonListProps {
  count?: number;
  className?: string;
}

const List = ({ count = 3, className }: SkeletonListProps) => {
  const base = useSkeleton();
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Circle size={36} />
          <div className="flex-1 space-y-2">
            <div className={cn(base, 'h-3', 'w-3/5')} />
            <div className={cn(base, 'h-2', 'w-4/5')} />
          </div>
        </div>
      ))}
    </div>
  );
};

/** 骨架屏卡片 Props */
export interface SkeletonCardProps {
  count?: number;
  className?: string;
}

const Card = ({ count = 3, className }: SkeletonCardProps) => {
  const base = useSkeleton();
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-border)] p-4"
        >
          <div className={cn(base, 'mb-3 h-32')} />
          <div className="space-y-2">
            <div className={cn(base, 'h-3 w-3/4')} />
            <div className={cn(base, 'h-2 w-1/2')} />
          </div>
        </div>
      ))}
    </div>
  );
};

/** 骨架屏用户资料 Props */
export interface SkeletonProfileProps {
  className?: string;
}

const Profile = ({ className }: SkeletonProfileProps) => {
  const base = useSkeleton();
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Circle size={56} />
      <div className="flex-1 space-y-2">
        <div className={cn(base, 'h-4 w-1/3')} />
        <div className={cn(base, 'h-3 w-1/2')} />
      </div>
    </div>
  );
};

/** 骨架屏表单 Props */
export interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

const Form = ({ fields = 4, className }: SkeletonFormProps) => {
  const base = useSkeleton();
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className={cn(base, 'h-3 w-1/4')} />
          <div className={cn(base, 'h-9')} />
        </div>
      ))}
    </div>
  );
};

/**
 * 骨架屏复合组件。
 * 包含 Box / Text / Circle / List / Card / Profile / Form 七种子组件。
 */
export const Skeleton = { Box, Text, Circle, List, Card, Profile, Form };
export default Skeleton;
