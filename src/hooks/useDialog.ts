import { useState, useCallback } from 'react';

export interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'question';
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface UseDialogReturn {
  dialog: DialogState;
  showConfirm: (options: Omit<DialogState, 'visible'>) => Promise<boolean>;
  showAlert: (options: Omit<DialogState, 'visible' | 'cancelText'>) => Promise<void>;
  closeDialog: () => void;
}

export const useDialog = (): UseDialogReturn => {
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, visible: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const showConfirm = useCallback(
    (options: Omit<DialogState, 'visible'>): Promise<boolean> => {
      return new Promise((resolve) => {
        setResolvePromise(() => resolve);
        setDialog({
          ...options,
          visible: true,
          cancelText: options.cancelText || '取消',
          confirmText: options.confirmText || '确认',
        });
      });
    },
    [],
  );

  const showAlert = useCallback(
    (options: Omit<DialogState, 'visible' | 'cancelText'>): Promise<void> => {
      return new Promise((resolve) => {
        setResolvePromise(() => () => resolve());
        setDialog({
          ...options,
          visible: true,
          cancelText: undefined,
          confirmText: options.confirmText || '确定',
        });
      });
    },
    [],
  );

  return {
    dialog,
    showConfirm,
    showAlert,
    closeDialog,
  };
};

export default useDialog;
