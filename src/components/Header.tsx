import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, X } from 'lucide-react';
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
      id='title-bar' 
      className="bg-primary text-text-primary h-16 flex items-center justify-between px-6"
      data-tauri-drag-region="true"
    >
      <div className="flex items-center gap-4" data-tauri-drag-region="true">
        {type === 'main' ? (
          <>
            <motion.div 
              className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <span className="font-bold text-text-primary text-lg">MC</span>
            </motion.div>
            <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          </>
        ) : (
          <>
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-surface-hover group flex items-center justify-center"
              title={t('header.backToParent', '返回上级')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
            </motion.button>
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          onClick={handleMinimize}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-surface-hover group flex items-center justify-center"
          title={t('common.minimize', '最小化')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Minus className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
        </motion.button>
        <motion.button
          onClick={handleClose}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/20 group flex items-center justify-center"
          title={t('common.close', '关闭')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 text-text-secondary group-hover:text-red-400 transition-colors" />
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
