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
}

const Overlay = ({
    active,
    children,
    className = '',
    overLayClassName = '',
    disabled = false,
    zIndex = 50,
    fixed = false,
}: OverlayProps) => {

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <ComponentStackLayer type='Overlay'>
            <div className={`Overlay relative 
                ${className}`
            }>
                {children}

                {active && (
                    <div
                        className={`Overlay-Mask top-0
                            ${fixed ? 'fixed' : 'absolute'}
                            inset-0 z-${zIndex}
                            px-5 py-5
                            backdrop-blur-[1px] ${overLayClassName}`
                        }
                        style={{
                            backgroundColor: 'var(--color-overlay)',
                        }}
                    >

                        {/* TODO: 实现打字机动画文本 */}

                    </div>
                )}
            </div>
        </ComponentStackLayer>
    );
};

export default Overlay;
