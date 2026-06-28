import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { getWindowStrategy } from '@/config/windowStrategy';
import { invokeSaveWindowPositionByLabel, invokeLoadWindowPositionByLabel } from '@/api/window';
import { getErrorMessage, useNotification } from '@/components/common';

const DEBOUNCE_MS = 500;

/**
 * 窗口位置持久化 hook - 自动保存、恢复窗口位置和大小
 * - 启动时恢复上次保存的窗口位置
 * - 窗口移动/缩放时自动保存（防抖 500ms）
 * - 最小化时不保存位置
 */
export const useWindowPosition = () => {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { success: notifySuccess, error: notifyError } = useNotification();

  const saveCurrentPosition = useCallback(async () => {
    const win = getCurrentWindow();
    const strategy = getWindowStrategy(win.label);

    if (!strategy.shouldSave) return;

    if (strategy.validateBeforeSave) {
      const valid = await strategy.validateBeforeSave(win);
      if (!valid) return;
    }

    try {
      const position = await win.outerPosition();
      const size = await win.outerSize();
      const isMaximized = await win.isMaximized();

      await invokeSaveWindowPositionByLabel(
        win.label,
        position.x,
        position.y,
        size.width,
        size.height,
        isMaximized
      );
    } catch (error) {
      notifyError(`保存窗口位置失败 (${win.label}):`, getErrorMessage(error));
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveCurrentPosition, DEBOUNCE_MS);
  }, [saveCurrentPosition]);

  useEffect(() => {
    const win = getCurrentWindow();
    const strategy = getWindowStrategy(win.label);

    if (!strategy.shouldSave) return;

    const unlistenMove = win.onMoved(() => debouncedSave());
    const unlistenResize = win.onResized(() => debouncedSave());

    return () => {
      unlistenMove.then(fn => fn());
      unlistenResize.then(fn => fn());
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [debouncedSave]);
};