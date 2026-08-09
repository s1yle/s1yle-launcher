import { useState } from 'react';

/** 滑块组件 Props */
export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** 标签：displayValue 形态下渲染在头部左侧，unit 形态下行内渲染 */
  label?: string;
  /** 头部右侧展示值（只读）；传值后采用「头部 + 满宽滑块」布局 */
  displayValue?: string;
  /** 数值输入框右侧单位（如「MB」）；传值后采用「行内 label + 可编辑输入框」布局 */
  unit?: string;
  /** 已填充段颜色（默认主题主色） */
  fillColor?: string;
  /** 轨道底色（默认 --color-input） */
  trackColor?: string;
  /** 数值输入框提交钳制范围（默认 [min, max]） */
  clampMin?: number;
  clampMax?: number;
  disabled?: boolean;
  /** 外层容器额外类名（如间距 mb-2） */
  className?: string;
}

/**
 * 滑块组件：受控 range，两种形态——
 * - 展示形态：传 displayValue（头部 label + 只读值，滑块满宽）
 * - 编辑形态：传 unit（行内 label + 滑块 + 可编辑数值输入框）
 * 输入框过滤非数字，失焦/回车提交并钳制到 [clampMin ?? min, clampMax ?? max]。
 * 填充渐变默认主题主色，可经 fillColor / trackColor 与外部（如分区条）配色同步。
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  displayValue,
  unit,
  fillColor = 'var(--color-primary)',
  trackColor = 'var(--color-input)',
  clampMin = min,
  clampMax = max,
  disabled,
  className = '',
}: SliderProps) {
  // 输入框未提交文本（空串时回退显示当前值）
  const [editorText, setEditorText] = useState('');

  // 填充进度：max <= min（数据未就绪）时按 0% 显示，其余钳制到 0~1
  const pct = max > min
    ? Math.max(0, Math.min(1, (value - min) / (max - min))) * 100
    : 0;

  // 提交输入框数值：非法/越界时钳制回合法范围
  const submitEditor = () => {
    const parsed = Number(editorText);
    const clamped = Number.isFinite(parsed)
      ? Math.max(clampMin, Math.min(parsed, clampMax))
      : value;
    onChange(clamped);
    setEditorText('');
  };

  const hasHeader = displayValue !== undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 展示形态头部：label 左侧 + 只读值右侧 */}
      {hasHeader && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
          )}
          <span className="text-sm text-[var(--color-text-tertiary)]">{displayValue}</span>
        </div>
      )}

      <div className="flex items-center gap-x-4">
        {/* 编辑形态行内标签：L3 text-sm font-light */}
        {label && !hasHeader && (
          <span className="font-light text-sm shrink-0">{label}</span>
        )}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            setEditorText('');
            onChange(parseFloat(e.target.value));
          }}
          disabled={disabled}
          className="flex-1 min-w-0 h-1 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`
          }}
        />

        {/* 编辑形态：数值输入框 + 单位（失焦/回车提交，钳制到 [clampMin, clampMax]） */}
        {unit !== undefined && (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              inputMode="numeric"
              value={editorText || String(value)}
              onChange={(e) => setEditorText(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={submitEditor}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              disabled={disabled}
              className="w-14 px-1.5 py-1.5 text-center text-xs
                bg-(--color-input) border border-(--color-border) rounded
                text-(--color-text-primary) placeholder:text-(--color-text-tertiary)
                focus:outline-none focus:ring-2 focus:ring-(--color-primary)
                disabled:opacity-50"
            />
            <span className="text-xs text-(--color-text-tertiary)">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}