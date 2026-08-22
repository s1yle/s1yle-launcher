import { useLocation } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, X } from 'lucide-react';
import { IconButton, BrandLogo, useNotification, getErrorMessage } from './common';
import { getParentPath } from '../router/config';
import { useSafeNavigate, useGoBack } from '../router/navigation';
import { EASING } from '../utils/animations';

interface HeaderProps {
  type: 'main' | 'sub';
  title: string;
  onBack?: () => void;
}

/**
 * 页面头部组件。
 * 支持 main / sub 两种模式：main 显示品牌 Logo + 标题，sub 显示返回按钮 + 标题。
 * 同时包含窗口最小化 / 关闭按钮。
 */
const Header = ({ type, title, onBack }: HeaderProps) => {
  const { t } = useTranslation();
  const { error: notifyError, success: _notifySuccess } = useNotification();

  let location: ReturnType<typeof useLocation> | null = null;
  let safeNavigate: ReturnType<typeof useSafeNavigate> | null = null;
  let goBack: ReturnType<typeof useGoBack> | null = null;

  try {
    location = useLocation();
    safeNavigate = useSafeNavigate();
    goBack = useGoBack();
  } catch {
    // Outside <Router> — skip router hooks
  }

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      notifyError('最小化窗口失败', getErrorMessage(error));
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      notifyError('关闭窗口失败', getErrorMessage(error));
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (goBack) {
      goBack();
      return;
    }
    if (location && safeNavigate) {
      safeNavigate(getParentPath(location.pathname));
    }
  };

  return (
    <header
      id='title-bar'
      className="bg-primary text-text-primary h-16 
          flex items-center justify-between px-3 z-1000
      "
      data-tauri-drag-region="true"
    >
      <div className="flex items-center gap-4" data-tauri-drag-region="true">
        {type === 'main' ? (
          <>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={EASING.SPRING_STIFF}
            >
              <BrandLogo width={40} />
            </motion.div>
            <h1 className="text-xl text-text-primary">{title}</h1>
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
          variant='default'
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
