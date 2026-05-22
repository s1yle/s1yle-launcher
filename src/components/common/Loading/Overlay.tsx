import React from 'react';
import { ComponentStackLayer } from '../ContextStack/ContextStack';

export interface OverlayProps {
    active: boolean;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

const Overlay = ({
    active,
    children,
    className = '',
    disabled = false,
}: OverlayProps) => {

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <ComponentStackLayer type='Overlay'>
            <div className={`overlay relative ${className}`}>
                {children}

                {active && (
                    <div
                        className={`absolute inset-0 z-10
                            px-5 py-5
                             backdrop-blur-[1px] ${className}`
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
