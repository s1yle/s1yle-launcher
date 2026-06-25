import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLoading } from '@/hooks/useLoading';
import Spinner from './Spinner';
import ProgressBar from './ProgressBar';
import Skeleton from './Skeleton';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

/** 加载表面组件 Props */
export interface LoadingSurfaceProps {
  loadingKey: string;
  skeleton?: 'list' | 'card' | 'profile' | 'form' | 'text';
  skeletonCount?: number;
  className?: string;
  children: ReactNode;
}

const SKELETON_MAP = {
  list: Skeleton.List,
  card: Skeleton.Card,
  profile: Skeleton.Profile,
  form: Skeleton.Form,
  text: Skeleton.Text,
} as const;

/** 加载表面组件，根据 loadingEntry 的 variant 自动切换旋转器 / 进度条 / 骨架屏 */
const LoadingSurface = ({
  loadingKey,
  skeleton: skeletonType,
  skeletonCount,
  className,
  children,
}: LoadingSurfaceProps) => {
  const entry = useLoading(loadingKey);
  const isActive = entry.status === 'loading';
  const variant = isActive ? entry.variant : 'spinner';

  if (!isActive) return <>{children}</>;

  switch (variant) {
    case 'spinner':
      return (
        <Spinner loadingKey={loadingKey}>
          <div className={cn('relative', className)}>
            <div className="opacity-30 pointer-events-none select-none">
              {children}
            </div>
          </div>
        </Spinner>
      );

    case 'progress':
      return (
        <div className={cn('p-4', className)}>
          <ProgressBar loadingKey={loadingKey} showPercentage size="md" showIcon />
        </div>
      );

    case 'skeleton': {
      if (skeletonType && skeletonType in SKELETON_MAP) {
        const SkeletonComp = SKELETON_MAP[skeletonType];
        if (skeletonType === 'list' || skeletonType === 'card') {
          return <SkeletonComp count={skeletonCount} className={className} />;
        }
        return <SkeletonComp className={className} />;
      }
      return (
        <div className={cn('p-4', className)}>
          <Skeleton.Text lines={3} />
        </div>
      );
    }

    case 'topbar':
      return <>{children}</>;

    default:
      return <>{children}</>;
  }
};

export default LoadingSurface;
