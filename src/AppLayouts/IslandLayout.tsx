import React from 'react';

/** IslandLayout 组件的 Props */
export interface IslandLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    collapsedToggleButton: React.ReactNode;
}

/** 灵动岛布局模式 - 顶部留空 80px 给灵动岛 */
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
