import React from 'react';
import { create } from 'zustand';
import InputDialog from './InputDialog';

/** 输入弹窗配置 */
export interface InputDialogOptions {
  title?: string;
  message?: React.ReactNode;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger' | 'success' | 'warning';
  /** 校验函数：返回错误文案表示不通过，返回 null 表示通过 */
  validate?: (value: string) => string | null;
}

interface InputDialogStore {
  isOpen: boolean;
  options: InputDialogOptions;
  resolve: ((value: string | null) => void) | null;
  open: (options: InputDialogOptions) => Promise<string | null>;
  close: () => void;
}

const useInputDialogStore = create<InputDialogStore>((set) => ({
  isOpen: false,
  options: {},
  resolve: null,
  open: (options) => {
    return new Promise<string | null>((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },
  close: () => set({ isOpen: false, options: {}, resolve: null }),
}));

/** 全局命令式输入：返回输入值（确认）或 null（取消/关闭） */
export function prompt(options: InputDialogOptions): Promise<string | null> {
  return useInputDialogStore.getState().open(options);
}

export const InputDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen, options, resolve } = useInputDialogStore();
  const close = useInputDialogStore((s) => s.close);

  const handleConfirm = (value: string) => {
    if (resolve) resolve(value);
    close();
  };
  const handleCancel = () => {
    if (resolve) resolve(null);
    close();
  };

  return (
    <>
      {children}
      <InputDialog
        isOpen={isOpen}
        title={options.title ?? '输入'}
        message={options.message}
        initialValue={options.initialValue}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        confirmType={options.confirmType}
        validate={options.validate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default InputDialogProvider;
