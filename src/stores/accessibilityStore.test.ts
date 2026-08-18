import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccessibilityStore } from './accessibilityStore';
import { useUIModeStore, type AnimationConfig } from './uiModeStore';

describe('accessibilityStore 无障碍 class 切换', () => {
  let toggle: ReturnType<typeof vi.fn>;
  let setAnimation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    toggle = vi.fn();
    setAnimation = vi.fn();
    vi.stubGlobal('document', {
      documentElement: { classList: { toggle } },
    });
    // 替换 uiModeStore 的 setAnimation，避免真正改动动画状态
    useUIModeStore.setState({
      setAnimation: setAnimation as (animation: Partial<AnimationConfig>) => void,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAccessibilityStore.setState({ photosensitive: false, highContrast: false });
  });

  it('开启光敏模式：添加 class 并关闭全局动画', () => {
    useAccessibilityStore.getState().setPhotosensitive(true);
    expect(toggle).toHaveBeenCalledWith('a11y-photosensitive', true);
    expect(setAnimation).toHaveBeenCalledWith({ enabled: false });
  });

  it('关闭光敏模式：移除 class 并恢复动画', () => {
    useAccessibilityStore.getState().setPhotosensitive(true);
    toggle.mockClear();
    setAnimation.mockClear();
    useAccessibilityStore.getState().setPhotosensitive(false);
    expect(toggle).toHaveBeenCalledWith('a11y-photosensitive', false);
    expect(setAnimation).toHaveBeenCalledWith({ enabled: true });
  });

  it('高对比度模式切换 class', () => {
    useAccessibilityStore.getState().setHighContrast(true);
    expect(toggle).toHaveBeenCalledWith('a11y-high-contrast', true);
  });
});