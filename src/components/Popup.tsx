import React, { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconButton, Overlay } from './common';
import { Portal } from './common/Portal';
import { Z_INDEX } from '../utils/zIndex';
import { DURATION, modalOpen } from '@/utils/animations';
import { useAnimation } from '@/hooks/useAnimation';
import { X } from 'lucide-react';

/** 通用弹窗组件 Props */
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
  animation?: 'none';
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

/**
 * 通用弹窗组件。
 * 基于 Portal + Overlay 实现，动画统一为弹窗动效：
 * 打开 缩放 0.95→1 + 淡入（SPRING_ENTER，弹簧回弹）；关闭 缩放 1→0.95 + 淡出（IN_OUT_FLUENT，无回弹）。
 */
const Popup = ({
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
  animation = undefined,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
}: PopupProps) => {
  const { enabled } = useAnimation();
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), DURATION.MODAL_CLOSE * 1000 + 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

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
    sm: 'max-w-md min-w-[320px]',
    md: 'max-w-lg min-w-[400px]',
    lg: 'max-w-2xl min-w-[500px]',
    xl: 'max-w-4xl min-w-[640px]',
    full: 'max-w-[90vw] min-w-[90vw]',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-8',
    bottom: 'items-end justify-center pb-8',
  };

  const noAnimation = animation === 'none';

  const ariaProps: React.HTMLAttributes<HTMLDivElement> = {};
  if (ariaLabel) ariaProps['aria-label'] = ariaLabel;
  if (ariaLabelledby) ariaProps['aria-labelledby'] = ariaLabelledby;
  if (ariaDescribedby) ariaProps['aria-describedby'] = ariaDescribedby;

  return (
    <Portal preset={position} zIndex={Z_INDEX.POPUP}>
      <AnimatePresence>
        {shouldRender && (
          <Overlay active={true} zIndex={Z_INDEX.POPUP} fixed
              onOverlayClick={handleOverlayClick}
          >
            <div
              className={`w-full h-full pointer-events-auto flex ${positionClasses[position]} ${overlayClassName}`}
              role="dialog"
              aria-modal="true"
              {...ariaProps}
            >
              <motion.div
                key="popup-content"
                className={`w-full ${sizeClasses[size]} pointer-events-auto ${className}`}
                style={{
                  backgroundColor: 'var(--color-surface-solid)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                variants={noAnimation ? {} : modalOpen}
                initial={noAnimation || !enabled ? false : 'initial'}
                animate={noAnimation || !enabled ? false : 'animate'}
                exit={noAnimation || !enabled ? undefined : 'exit'}
                onClick={(e) => e.stopPropagation()}
              >
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {title && (
                      <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {typeof title === 'string' ? <h2>{title}</h2> : title}
                      </div>
                    )}
                    {showCloseButton && (
                      <IconButton
                        icon={X}
                        onClick={onClose}
                        aria-label="关闭弹窗"
                        className="text-text-secondary"
                      />
                    )}
                  </div>
                )}

                <div className={`px-5 py-4 ${contentClassName}`}>
                  {children}
                </div>

                {footer && (
                  <div className="px-5 py-4" >
                    {footer}
                  </div>
                )}
              </motion.div>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default Popup;