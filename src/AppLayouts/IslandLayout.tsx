import React from 'react';

export interface IslandLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    collapsedToggleButton: React.ReactNode;
}

const IslandLayout = ({
    children,
    header,
    collapsedToggleButton,
}: IslandLayoutProps) => {
    return (
        <>
            {header}
            <div
                className="flex-1 flex flex-col overflow-hidden"
                style={{ marginTop: '80px' }}
            >
                {children}
            </div>
            {collapsedToggleButton}
        </>
    )
}

export default IslandLayout;
