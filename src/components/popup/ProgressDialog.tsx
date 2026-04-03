import { useState, useEffect } from 'react';
import Popup from '../Popup';
import ProgressBar from '../common/ProgressBar';
import { Loader2, CheckCircle, CircleX } from 'lucide-react';

export interface ProgressDialogProps {
  isOpen: boolean;
  title: string;
  progress: number;
  status: 'idle' | 'active' | 'completed' | 'error';
  message?: string;
  detail?: string;
  showProgressBar?: boolean;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  autoCloseOnComplete?: boolean;
  autoCloseDelay?: number;
}

const ProgressDialog = ({
  isOpen,
  title,
  progress,
  status,
  message,
  detail,
  showProgressBar = true,
  cancelText = '取消',
  confirmText = '完成',
  onCancel,
  onConfirm,
  autoCloseOnComplete = false,
  autoCloseDelay = 2000,
}: ProgressDialogProps) => {
  const [autoClosing, setAutoClosing] = useState(false);

  useEffect(() => {
    if (autoCloseOnComplete && status === 'completed' && isOpen) {
      setAutoClosing(true);
      const timer = setTimeout(() => {
        onConfirm?.();
        setAutoClosing(false);
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [status, isOpen, autoCloseOnComplete, autoCloseDelay, onConfirm]);

  const isFinished = status === 'completed' || status === 'error';

  const statusIcon = {
    idle: <Loader2 className="w-8 h-8 text-white/40 animate-spin" />,
    active: <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />,
    completed: <CheckCircle className="w-8 h-8 text-green-400" />,
    error: <CircleX className="w-8 h-8 text-red-400" />,
  };

  return (
    <Popup
      isOpen={isOpen && !autoClosing}
      onClose={isFinished ? (onConfirm || (() => {})) : (() => {})}
      title={title}
      size="md"
      position="center"
      animation="scale"
      showCloseButton={isFinished}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex-shrink-0">
          {statusIcon[status]}
        </div>

        {message && (
          <p className="text-sm text-white/80 text-center">{message}</p>
        )}

        {showProgressBar && (
          <div className="w-full">
            <ProgressBar
              progress={progress}
              status={status}
              size="md"
              showIcon={false}
            />
          </div>
        )}

        {detail && (
          <p className="text-xs text-white/40 text-center break-all">{detail}</p>
        )}

        {!isFinished && onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 px-6 py-2 rounded-lg text-sm text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
        )}

        {isFinished && onConfirm && (
          <button
            onClick={onConfirm}
            className="mt-2 px-6 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            {status === 'completed' ? confirmText : '关闭'}
          </button>
        )}
      </div>
    </Popup>
  );
};

export default ProgressDialog;
