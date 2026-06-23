import React, { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, easeIn, easeInOut, motion } from 'framer-motion';
import { IconButton, Overlay } from './common';
import { Portal } from './common/Portal';
import { Z_INDEX } from '../utils/zIndex';
import { DURATION, EASING } from '@/utils/animations';
import { X } from 'lucide-react';

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
  animation = 'slide',
  animationDuration = DURATION.NORMAL * 1000,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
}: PopupProps) => {
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
  const durationSec = animationDuration / 1000;

  const containerVariants = {
    initial: noAnimation ? {} : ({ opacity: 0, scale: 0.96 } as const),
    animate: noAnimation ? {} : ({
      opacity: 1,
      scale: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    } as const),
    exit: noAnimation ? {} : ({
      opacity: 0,
      scale: 0.97,
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
    } as const),
  };

  const sectionVariants = {
    initial: noAnimation ? {} : ({ opacity: 0, y: 10 } as const),
    animate: noAnimation ? {} : ({ opacity: 1, y: 0 } as const),
    exit: noAnimation ? {} : ({ opacity: 0, y: -5 } as const),
  };

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
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                {(title || showCloseButton) && (
                  <motion.div
                    variants={sectionVariants}
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {title && (
                      <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {typeof title === 'string' ? <h2>{title}</h2> : title}
                      </div>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary 
                          text-xl leading-none 
                          transition-colors rounded-md cursor-pointer
                        "
                        style={{ color: 'var(--color-text-secondary)' }}
                        aria-label="关闭弹窗"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-10)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <IconButton icon={X}/>
                      </button>
                    )}
                  </motion.div>
                )}

                <motion.div variants={sectionVariants} className={`px-5 py-4 ${contentClassName}`}>
                  {children}
                </motion.div>

                {footer && (
                  <motion.div variants={sectionVariants} className="px-5 py-4" >
                    {footer}
                  </motion.div>
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
