import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ComponentStackLayer } from '../ContextStack/ContextStack';
import { modalOverlay } from '@/utils/animations';

/** 遮罩层组件 Props */
export interface OverlayProps {
    active: boolean;
    children: React.ReactNode;
    className?: string;
    overLayClassName?: string;
    disabled?: boolean;
    zIndex?: number;
    fixed?: boolean;
    onOverlayClick?: (e: React.MouseEvent) => void;
    /** 遮罩自身是否播放进入/退出动画（默认 true；由外层 AnimatePresence 接管时置 false） */
    animateMask?: boolean;
}

/** 遮罩层组件，激活时显示半透明背景，子内容保持在顶层 */
const Overlay = ({
    active,
    children,
    className = '',
    overLayClassName = '',
    disabled = false,
    zIndex = 50,
    fixed = false,
    onOverlayClick,
    animateMask = true,
}: OverlayProps) => {

    if (disabled) {
        return <>{children}</>;
    }

    const maskZIndex = zIndex;
    const contentZIndex = zIndex + 1;

    return (
        <ComponentStackLayer type='Overlay'>
            <div className={`Overlay relative 
                    ${className}`
                }
            >
                <AnimatePresence>
                    {active && (
                        <motion.div
                            key="overlay-mask"
                            onClick={onOverlayClick}
                            className={`Overlay-Mask top-0
                                ${fixed ? 'fixed' : 'absolute'}
                                inset-0
                                px-5 py-5
                                pointer-events-auto
                                ${overLayClassName}`
                            }
                            style={{
                                backgroundColor: 'var(--color-overlay)',
                                zIndex: maskZIndex,
                            }}
                            variants={modalOverlay}
                            initial={animateMask ? 'initial' : false}
                            animate="animate"
                            exit={animateMask ? 'exit' : undefined}
                        />
                    )}
                </AnimatePresence>

                {/* TODO: 实现打字机动画文本 */}

                <div style={{ position: 'relative', zIndex: contentZIndex }}>
                    {children}
                </div>
            </div>
        </ComponentStackLayer>
    );
};

export default Overlay;
