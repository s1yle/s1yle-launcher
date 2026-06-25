/** 滑块组件 Props */
export interface SliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  label?: string
  displayValue?: string
}

/** 滑块组件，支持自定义标签和显示值 */
export function Slider({ value, min, max, step, onChange, label, displayValue }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
          {displayValue !== undefined && (
            <span className="text-sm text-[var(--color-text-tertiary)]">{displayValue}</span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-progress-track) ${pct}%)`,
        }}
      />
    </div>
  )
}
