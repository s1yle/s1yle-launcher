import { describe, expect, it } from 'vitest';
import {
  fontScaleConfig,
  getFontScaleLabel,
  canIncreaseFontSize,
  canDecreaseFontSize,
} from './fontStore';

describe('fontStore 字体缩放', () => {
  it('支持无障碍 200% 最大缩放', () => {
    const scales = fontScaleConfig.options.map((o) => o.value);
    expect(scales).toContain(2);
    const max = Math.max(...scales);
    const min = Math.min(...scales);
    expect(max).toBe(2);
    expect(min).toBe(0.875);
  });

  it('默认缩放为标准 100%', () => {
    expect(fontScaleConfig.defaultValue).toBe(1);
  });

  it('缩放级别单调递增且覆盖 100%', () => {
    const scales = fontScaleConfig.options.map((o) => o.value);
    expect(scales).toEqual([...scales].sort((a, b) => a - b));
    expect(scales).toContain(1);
  });

  it('getFontScaleLabel 返回百分比文本', () => {
    expect(getFontScaleLabel(1)).toBe('100%');
    expect(getFontScaleLabel(0.875)).toBe('88%');
    expect(getFontScaleLabel(2)).toBe('200%');
  });

  it('canIncrease / canDecrease 边界判断', () => {
    expect(canIncreaseFontSize(0.875)).toBe(true);
    expect(canIncreaseFontSize(2)).toBe(false);
    expect(canDecreaseFontSize(0.875)).toBe(false);
    expect(canDecreaseFontSize(2)).toBe(true);
  });
});