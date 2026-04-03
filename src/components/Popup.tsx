import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  animationDuration?: number;
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
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, animationDuration]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  }, [closeOnEsc, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  useEffect(() => {
    if (shouldRender && preventScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldRender, preventScroll]);

  useEffect(() => {
    if (shouldRender && closeOnEsc) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [shouldRender, closeOnEsc, handleKeyDown]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-8',
    bottom: 'items-end justify-center pb-8',
  };

  const motionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  const variant = motionVariants[animation];
  const durationSec = animationDuration / 1000;

  const ariaProps: React.HTMLAttributes<HTMLDivElement> = {};
  if (ariaLabel) ariaProps['aria-label'] = ariaLabel;
  if (ariaLabelledby) ariaProps['aria-labelledby'] = ariaLabelledby;
  if (ariaDescribedby) ariaProps['aria-describedby'] = ariaDescribedby;

  const popupContent = (
    <AnimatePresence>
      {shouldRender && (
        <>
          <motion.div
            key="popup-backdrop"
            className="fixed inset-0 bg-overlay backdrop-blur-sm z-49"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSec * 0.8 }}
            onClick={handleOverlayClick}
          />

          <div
            className={`fixed inset-0 flex ${positionClasses[position]} z-50 pointer-events-none ${overlayClassName}`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            {...ariaProps}
          >
            <motion.div
              key="popup-content"
              className={`bg-surface backdrop-blur-sm rounded-xl border border-border-hover w-full ${sizeClasses[size]} pointer-events-auto ${className}`}
              style={{ paddingLeft: '10px', paddingRight: '10px' }}
              initial={variant.initial}
              animate={variant.animate}
              exit={variant.exit}
              transition={{
                duration: durationSec,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-border">
                  {title && (
                    <div className="text-2xl font-bold text-white">
                      {typeof title === 'string' ? <h2>{title}</h2> : title}
                    </div>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-text-secondary hover:text-text-primary text-2xl font-bold leading-none p-2 transition-colors"
                      aria-label="关闭弹窗"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              <div className={`p-6 ${contentClassName}`}>
                {children}
              </div>

              {footer && (
                <div className="p-6 border-t border-border">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(popupContent, document.body);
};

export default Popup;
