import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, X } from 'lucide-react';
import { closeWindow } from '../helper/rustInvoke';
import { getParentPath } from '../router/config';

interface HeaderProps {
  type: 'main' | 'sub';
  title: string;
}

const Header = ({ type, title }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('最小化窗口失败:', error);
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await closeWindow();
      await window.close();
    } catch (error) {
      console.error('关闭窗口失败:', error);
    }
  };

  const handleBack = () => {
    const parentPath = getParentPath(location.pathname);
    navigate(parentPath);
  };

  return (
    <header
      className="bg-primary text-white h-16 flex items-center justify-between px-6"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-4" data-tauri-drag-region>
        {type === 'main' ? (
          <>
            <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">MC</span>
            </div>
            <h1 className="text-xl font-bold" data-tauri-drag-region>{title}</h1>
          </>
        ) : (
          <>
            <motion.button
              onClick={handleBack}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              title={t('header.backToParent', '返回上级')}
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <h2 className="text-xl font-bold" data-tauri-drag-region>{title}</h2>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          title={t('common.minimize', '最小化')}
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          title={t('common.close', '关闭')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
