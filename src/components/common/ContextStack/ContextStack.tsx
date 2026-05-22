import { createContext, useContext, useMemo } from "react";


interface ComponentStackContextValue {
    readonly stack: readonly string[];
}

interface ComponentStackLayerProps {
    type: string,
    children: React.ReactNode;
}

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

/**
 * 检查当前组件是否在指定类型的祖先组件内部
 */
export function useIsInsideComponent(componentType: string): boolean {
    const { stack } = useContext(ComponentStackContext);
    return stack.includes(componentType);
}

/**
 * 获取最近的父组件类型
 * @returns 最近的父组件类型，如果没有则返回null
 */
export function useGetParentComponentType(): string | null {
  const { stack } = useContext(ComponentStackContext);
  return stack[0] || null;
}

/**
 * 获取所有祖先组件类型的数组
 * @returns 从最近到最远的祖先组件类型数组
 */
export function useGetAllParentComponentTypes(): readonly string[] {
  const { stack } = useContext(ComponentStackContext);
  return stack;
}

/**
 * 获取第n层父组件的类型
 * @param n 层数，0表示最近的父组件
 * @returns 第n层父组件类型，如果超出范围则返回null
 */
export function useGetNthParentComponentType(n: number): string | null {
  const { stack } = useContext(ComponentStackContext);
  return stack[n] || null;
}

/**
 * 检查当前组件是否在任意一个指定类型的祖先组件内部
 * @param componentTypes 要检查的组件类型数组
 */
export function useHasAnyParentComponent(componentTypes: string[]): boolean {
  const { stack } = useContext(ComponentStackContext);
  return componentTypes.some(type => stack.includes(type));
}

/**
 * 打印当前组件的完整组件栈
 */
export function useDebugComponentStack(label?: string) {
  const { stack } = useContext(ComponentStackContext);

    const prefix = label ? `[${label}] ` : '';
    console.log(
      `${prefix}组件栈 (深度: ${stack.length})`,
      '\n┌─────────────────────────────',
      ...stack.map((type, index) => `\n│ ${index === 0 ? '→' : '  '} ${type}`),
      '\n└─────────────────────────────'
    );
}