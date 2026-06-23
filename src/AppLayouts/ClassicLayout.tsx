import React from 'react';

export interface ClassicLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    collapsedToggleButton: React.ReactNode;
}

const ClassicLayout = ({
    children,
    header,
    collapsedToggleButton,
}: ClassicLayoutProps) => {
    return (
        <>
            {header}
            <div
                className="flex-1 flex flex-col overflow-hidden"
            >
                {children}
            </div>
            {collapsedToggleButton}
        </>
    )
}

export default ClassicLayout;
