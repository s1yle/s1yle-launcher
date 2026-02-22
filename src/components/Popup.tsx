import React, { useEffect, useCallback } from 'react';

export interface PopupProps {
  // 核心控制
  isOpen: boolean;
  onClose: () => void;
  
  // 内容配置
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  
  // 行为控制
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  
  // 样式定制
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  
  // 动画配置
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  animationDuration?: number;
  
  // 无障碍
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  preventScroll = true,
  size = 'md',
  position = 'center',
  className = '',
  overlayClassName = '',
  contentClassName = '',
  animation = 'fade',
  animationDuration = 200,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
}) => {
  // ESC键关闭处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEsc && isOpen) {
      onClose();
    }
  }, [closeOnEsc, isOpen, onClose]);

  // 点击遮罩层关闭处理
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // 滚动锁定
  useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, preventScroll]);

  // ESC键监听
  useEffect(() => {
    if (isOpen && closeOnEsc) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, closeOnEsc, handleKeyDown]);

  // 如果没有打开，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  // 尺寸映射
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  // 位置映射
  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-8',
    bottom: 'items-end justify-center pb-8',
  };

  // 动画类
  const animationClasses = {
    fade: 'animate-fadeIn',
    slide: 'animate-slideInUp',
    scale: 'animate-scaleIn',
    none: '',
  };

  // ARIA属性
  const ariaProps: React.HTMLAttributes<HTMLDivElement> = {};
  if (ariaLabel) ariaProps['aria-label'] = ariaLabel;
  if (ariaLabelledby) ariaProps['aria-labelledby'] = ariaLabelledby;
  if (ariaDescribedby) ariaProps['aria-describedby'] = ariaDescribedby;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex ${positionClasses[position]} z-50 ${overlayClassName} ${animationClasses[animation]}`}
      style={{ animationDuration: `${animationDuration}ms`,
               animation: isOpen ? animationClasses[animation] : ''
              
              }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      {...ariaProps}
    >
      <div
        className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 w-full ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            {title && (
              <div className="text-2xl font-bold text-white">
                {typeof title === 'string' ? <h2>{title}</h2> : title}
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white text-2xl font-bold leading-none p-2 transition-colors"
                aria-label="关闭弹窗"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className={`p-6 ${contentClassName}`}>
          {children}
        </div>

        {/* 底部区域 */}
        {footer && (
          <div className="p-6 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;