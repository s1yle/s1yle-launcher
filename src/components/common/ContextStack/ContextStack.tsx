import { createContext, useContext, useMemo } from "react";


interface ComponentStackContextValue {
    readonly stack: readonly string[];
}

interface ComponentStackLayerProps {
    type: string,
    children: React.ReactNode;
}

/** 组件栈上下文，用于追踪组件嵌套层级 */
const ComponentStackContext = createContext<ComponentStackContextValue> ({
    stack: [],
});

function useCreateComponentStackLayer(componentType: string): ComponentStackContextValue {
    const parentContext = useContext(ComponentStackContext);

    // 将自己添加到父栈的前面
    return useMemo(
        () => ({
            stack: [componentType, ...parentContext.stack]
        }),
        [componentType, parentContext.stack]
    );
}


/**
 * 组件栈层级 Provider。
 * 向子树注入当前组件类型，子组件可通过 use* Hook 获取祖先组件类型信息。
 */
export function ComponentStackLayer({
    type,
    children,
}: ComponentStackLayerProps) {
    const newContext = useCreateComponentStackLayer(type);

    return (
        <ComponentStackContext.Provider value={newContext}>
            {children}
        </ComponentStackContext.Provider>
    )
}