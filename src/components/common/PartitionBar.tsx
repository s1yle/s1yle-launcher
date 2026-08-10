import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

/** 分区条单个分区配置 */
export interface PartitionBarPart {
  /** 分区上方小字标题（从分区最左侧开始） */
  label: string;
  /** 相对数值，决定分区宽度占比（按比例分配） */
  value: number;
  /** 分区下方数据源文本（支持自定义输入） */
  dataText?: string;
  /** 分级：1 深色，2/3 逐级变浅（默认 1） */
  level?: number;
  /** 显式指定颜色（优先级高于 level 色阶） */
  color?: string;
}

/** 分区条组件 Props */
export interface PartitionBarProps {
  parts: PartitionBarPart[];
  className?: string;
  barClassName?: string;
  /** 文字超宽时省略号截断（默认 false：换行完整显示，避免窄分区文字被隐藏） */
  truncate?: boolean;
}

/** 分级颜色映射：级数越大颜色越浅 */
const LEVEL_COLORS: Record<number, string> = {
  1: 'var(--color-primary)',
  2: 'var(--color-primary-hover)',
  3: 'var(--color-primary-20)',
};

/** 解析分区颜色：显式 color > level 色阶 > 默认 1 级色 */
export const getPartitionColor = (part: Pick<PartitionBarPart, 'level' | 'color'>): string => {
  if (part.color) return part.color;
  return LEVEL_COLORS[part.level ?? 1] ?? LEVEL_COLORS[1];
};

/**
 * # PartitionBar 分区条
 *
 * 横向条按比例划分为多个分区，每个分区上方显示小字 label（左对齐），
 * 下方显示自定义数据源文本；分区支持分级（level 越大颜色越浅）。
 *
 * @example
 * ```tsx
 * <PartitionBar
 *   parts={[
 *     { label: '已使用内存', value: 12, dataText: '7.4 GB / 15.8 GB', level: 1 },
 *     { label: '游戏分配', value: 2, dataText: '1.3 GB', level: 2 },
 *   ]}
 * />
 * ```
 */
const PartitionBar = ({
  parts,
  className,
  barClassName,
  truncate = false,
}: PartitionBarProps) => {
  if (parts.length === 0) return null;

  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;
  // 默认不换行不截断：文字溢出到右侧空白处完整显示；truncate 开启时限制在本分区宽度内省略号截断
  const textCls = `absolute top-0 block text-left whitespace-nowrap ${truncate ? 'truncate' : ''}`;
  // 分级：标题小字（text-xs）/ 数据文本（text-sm，更醒目）
  const labelTextCls = `${textCls} text-xs text-(--color-text-tertiary)`;
  const dataTextCls = `${textCls} text-sm text-(--color-text-secondary)`;

  // 各分区起点累计百分比（label/条体/数据三行共用同一刻度算法）
  const starts = parts.map((_, i) =>
    (parts.slice(0, i).reduce((s, p) => s + p.value, 0) / total) * 100
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 分区标题：刻度起点 = 分区左缘（与条体保持 4px 间距） */}
      <div className="relative h-3 mb-1">
        {parts.map((part, i) => (
          <span
            key={part.label}
            className={labelTextCls}
            style={{
              left: `${starts[i]}%`,
              ...(truncate ? { maxWidth: `${(part.value / total) * 100}%` } : {}),
            }}
          >
            {part.label}
          </span>
        ))}
      </div>

      {/* 分区条本体：段位 left/width 过渡，数值变化时平滑滑动 */}
      <div className={cn('relative h-1.5 rounded-full bg-(--color-input)', barClassName)}>
        {parts.map((part, i) => (
          <div
            key={part.label}
            className="absolute top-0 bottom-0"
            style={{
              left: `${starts[i]}%`,
              width: `${(part.value / total) * 100}%`,
              backgroundColor: getPartitionColor(part),
              transition: 'left 0.35s ease, width 0.35s ease',
            }}
          />
        ))}
      </div>

      {/* 分区数据源：起点与条体刻度一致，文本从左缘开始 */}
      <div className="relative h-3">
        {parts.map((part, i) => (
          <span
            key={part.label}
            className={dataTextCls}
            style={{
              left: `${starts[i]}%`,
              ...(truncate ? { maxWidth: `${(part.value / total) * 100}%` } : {}),
            }}
          >
            {part.dataText ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PartitionBar;