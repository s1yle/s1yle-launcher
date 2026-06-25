import React from 'react';

/** ClassicLayout 组件的 Props */
export interface ClassicLayoutProps {
    children: React.ReactNode,
    header: React.ReactNode,
    collapsedToggleButton: React.ReactNode;
}

/** 经典布局模式 - 侧边栏 + 顶部导航 + 内容区 */
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
