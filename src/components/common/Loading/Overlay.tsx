import React from 'react';
import { ComponentStackLayer } from '../ContextStack/ContextStack';

export interface OverlayProps {
    active: boolean;
    children: React.ReactNode;
    className?: string;
    overLayClassName?: string;
    disabled?: boolean;
    zIndex?: number;
    fixed?: boolean;
    onOverlayClick?: (e: React.MouseEvent) => void;
}

const Overlay = ({
    active,
    children,
    className = '',
    overLayClassName = '',
    disabled = false,
    zIndex = 50,
    fixed = false,
    onOverlayClick,
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
                {active && (
                    <div
                        onClick={onOverlayClick}
                        className={`Overlay-Mask top-0
                            ${fixed ? 'fixed' : 'absolute'}
                            inset-0
                            px-5 py-5
                            backdrop-blur-[1px] ${overLayClassName}`
                        }
                        style={{
                            backgroundColor: 'var(--color-overlay)',
                            zIndex: maskZIndex,
                        }}
                    >

                        {/* TODO: 实现打字机动画文本 */}

                    </div>
                )}

                <div style={{ position: 'relative', zIndex: contentZIndex }}>
                    {children}
                </div>
            </div>
        </ComponentStackLayer>
    );
};

export default Overlay;
