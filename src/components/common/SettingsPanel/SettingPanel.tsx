import { AnimatePresence, motion, } from "framer-motion"
import React, { useCallback, useEffect, useState } from "react"
import Toggle from "../Toggle";
import { SettingsPanelItemContext, SettingsPanelItemProps, SettingsPanelProps, SubSettingsPanelItemProps } from "./models";
import Spinner from "../Loading/Spinner";
import Overlay from "../Loading/Overlay";



// 根组件
const SettingsPanelRoot = ({
    label,
    children,
    className,
    gap = 20,
    ...rest
}: SettingsPanelProps) => {
    return (
        <AnimatePresence>
            <motion.div
                className={`bg-(--color-surface) rounded-(--radius-sm) w-full overflow-hidden mb-10 ${className}`}
                {...rest}
            >
                {/* title */}
                <div
                    className="px-4 py-2.5 border-b 
                hover:border-(--color-border-hover) border-(--color-border)"
                >
                    <span className="text-(--color-text-primary) text-base font-medium">
                        {label}
                    </span>
                </div>

                {/* 页面内容 */}
                <div style={{ gap: `${gap}px` }}>
                    {children}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};


// 条目包装器(负责单个条目的内边距)
const SettingsPanelItem = ({
    children,
    className,
    noPadding = false,
    hoverable = false,
    shouldLoad = false,
}: SettingsPanelItemProps) => {
    const [hovered, setHovered] = React.useState(false);
    const [itemElement, setItemElement] = useState<HTMLDivElement | null>(null);

    const itemRef = useCallback((node: HTMLDivElement | null) => {
        setItemElement(node);
    }, [])

    const contextValue = React.useMemo(
        () => ({
            isInsideItem: true,
            itemElement,
            hovered,
        }),
        [hovered, itemElement]
    );

    // TODO: 适配实际的加载任务(如果有)
    // 初始化 loading
    const [isLoading, setIsLoading] = useState(shouldLoad);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    }, [])

    return (
        <SettingsPanelItemContext.Provider value={contextValue}>
            <div className="item-ref" ref={itemRef}>
                <Overlay active={isLoading && shouldLoad}>

                    <Spinner visible={isLoading && shouldLoad}>
                        <div
                            className={`gap
                                bg-(--color-surface)
                                ${hoverable && 'hover:bg-(--color-surface-hover)'}
                                ${noPadding ? "" : "px-5 py-1"}
                                ${className || ""}
                            `}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                        >
                            {children}
                        </div>
                    </Spinner>

                </Overlay>
            </div>
        </SettingsPanelItemContext.Provider>
    );
};



// 子组件
const SubSettingsPanelItem = ({
    children,
    label = "未知",
    className,
    noPadding = false,
    gap = '12px',
}: SubSettingsPanelItemProps
) => {
    const { isInsideItem, hovered } = React.useContext(SettingsPanelItemContext);

    const contextValue = React.useMemo(
        () => ({ isInsideItem: true, hovered }),
        [hovered]
    );

    // 根据上下文自动调整样式
    return (
        <div
            className={`${isInsideItem ?
                // 在容器中
                !noPadding && 'px-1 py-1' :
                //  不在容器中
                !noPadding && 'px-3 py-1.5'} 
                ${isInsideItem ? '' : 'bg-(--color-surface)'}`
            }
        >
            <span className={`
                text-(--color-text-secondary) text-sm font-medium
                ${hovered && 'text-(--color-text-primary)'}`}
            >
                {label}
            </span>

            {/* 单独使用：if !noPadding padding + 背景 / 在容器中：无padding + 无背景 */}
            <SettingsPanelItemContext.Provider value={contextValue}>
                <div
                    className={`${className || ""} pt-1.5 pb-2 grid`}
                    style={{ gap: `${gap}` }}
                >
                    {children}
                </div>
            </SettingsPanelItemContext.Provider>
        </div>
    );
};

// TODO: 为后续可能需要用到的组件（如Toggle）实现条目包装器
// 复合组件export
export const SettingsPanel = Object.assign(SettingsPanelRoot, {
    Item: SettingsPanelItem,
    Sub: SubSettingsPanelItem,
    Toggle: Toggle,
});