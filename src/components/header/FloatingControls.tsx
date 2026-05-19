import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { Minus, X, Square } from 'lucide-react';

const FloatingControls = () => {
  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('最小化窗口失败:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      const isMaximized = await window.isMaximized();
      if (isMaximized) {
        await window.unmaximize();
      } else {
        await window.maximize();
      }
    } catch (error) {
      console.error('最大化/还原窗口失败:', error);
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('关闭窗口失败:', error);
    }
  };

  return (
    <motion.div
      className="fixed top-5 right-5 z-[60] flex items-center gap-1"
      initial={{ opacity: 0, x: 0}}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      data-tauri-drag-region="true"
    >
      <div className="flex items-center gap-0.5 p-1.5 rounded-full
        bg-[var(--color-surface)]/70 backdrop-blur-xl
        border border-[var(--color-border)]/40 shadow-lg">
        <motion.button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded-full
            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
            hover:bg-[var(--color-surface-hover)] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="最小化"
        >
          <Minus className="w-4 h-4" />
        </motion.button>

        <motion.button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded-full
            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
            hover:bg-[var(--color-surface-hover)] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="最大化"
        >
          <Square className="w-3.5 h-3.5" />
        </motion.button>

        <motion.button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full
            text-[var(--color-text-secondary)] hover:text-red-500
            hover:bg-red-500/10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="关闭"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FloatingControls;
