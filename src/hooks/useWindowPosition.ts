import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { saveWindowPosition, loadWindowPosition } from '../helper/rustInvoke';

const DEBOUNCE_MS = 500;

/**
 * 窗口位置持久化 hook - 自动保存、恢复窗口位置和大小
 * - 启动时恢复上次保存的窗口位置
 * - 窗口移动/缩放时自动保存（防抖 500ms）
 * - 最小化时不保存位置
 */
export const useWindowPosition = () => {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoredRef = useRef(false);

  const restoreWindowPosition = useCallback(async () => {
    if (isRestoredRef.current) return;
    
    try {
      const position = await loadWindowPosition();
      if (position) {
        const window = getCurrentWindow();
        
        if (position.maximized) {
          await window.maximize();
        } else {
          await window.setPosition(new PhysicalPosition(position.x, position.y));
          await window.setSize(new PhysicalSize(position.width, position.height));
        }
        isRestoredRef.current = true;
      }
    } catch (error) {
      console.error('恢复窗口位置失败:', error);
    }
  }, []);

  const saveCurrentPosition = useCallback(async () => {
    try {
      const window = getCurrentWindow();
      
      const isMinimized = await window.isMinimized();
      if (isMinimized) {
        return;
      }
      
      const position = await window.outerPosition();
      const size = await window.outerSize();
      const isMaximized = await window.isMaximized();

      if (position.x < -10000 || position.y < -10000) {
        return;
      }

      await saveWindowPosition(
        position.x,
        position.y,
        size.width,
        size.height,
        isMaximized
      );
    } catch (error) {
      console.error('保存窗口位置失败:', error);
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveCurrentPosition, DEBOUNCE_MS);
  }, [saveCurrentPosition]);

  useEffect(() => {
    restoreWindowPosition();

    const window = getCurrentWindow();

    const unlistenMove = window.onMoved(() => {
      debouncedSave();
    });

    const unlistenResize = window.onResized(() => {
      debouncedSave();
    });

    return () => {
      unlistenMove.then(fn => fn());
      unlistenResize.then(fn => fn());
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [restoreWindowPosition, debouncedSave]);
};
