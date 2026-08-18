import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeStore, AccentColor } from './themeStore';

describe('themeStore 主题应用到 DOM', () => {
  let classAdd: ReturnType<typeof vi.fn>;
  let classRemove: ReturnType<typeof vi.fn>;
  let setProperty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    classAdd = vi.fn();
    classRemove = vi.fn();
    setProperty = vi.fn();
    // 用假 document 替代，避免 node 环境下无 DOM
    vi.stubGlobal('document', {
      documentElement: {
        classList: { add: classAdd, remove: classRemove },
        style: { setProperty },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('init 会移除旧主题类并应用当前主题类', () => {
    useThemeStore.getState().init();
    expect(classRemove).toHaveBeenCalled();
    expect(classAdd).toHaveBeenCalledWith(expect.stringMatching(/^theme-/));
  });

  it('setAccentColor 写入强调色 CSS 变量', async () => {
    await useThemeStore.getState().setAccentColor(AccentColor.BLUE);
    expect(setProperty).toHaveBeenCalledWith('--color-primary', expect.any(String));
    expect(setProperty).toHaveBeenCalledWith('--color-primary-hover', expect.any(String));
  });
});