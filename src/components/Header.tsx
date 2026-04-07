import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, X } from 'lucide-react';
import { IconButton } from './common';
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
            <IconButton
              onClick={handleBack}
              icon={ArrowLeft}
              iconSize={24}
              label={t('header.backToParent', '返回上级')}
            />
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          onClick={handleMinimize}
          icon={Minus}
          label={t('common.minimize', '最小化')}
        />
        <IconButton
          onClick={handleClose}
          icon={X}
          variant="danger"
          label={t('common.close', '关闭')}
        />
      </div>
    </header>
  );
};

export default Header;
