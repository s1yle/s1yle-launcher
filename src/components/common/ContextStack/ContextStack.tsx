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

/**
 * 检查当前组件是否在指定类型的祖先组件内部。
 */
export function useIsInsideComponent(componentType: string): boolean {
    const { stack } = useContext(ComponentStackContext);
    return stack.includes(componentType);
}

/**
 * 获取最近的父组件类型。
 */
export function useGetParentComponentType(): string | null {
  const { stack } = useContext(ComponentStackContext);
  return stack[0] || null;
}

/**
 * 获取所有祖先组件类型的数组。
 */
export function useGetAllParentComponentTypes(): readonly string[] {
  const { stack } = useContext(ComponentStackContext);
  return stack;
}

/**
 * 获取第 n 层父组件的类型。
 */
export function useGetNthParentComponentType(n: number): string | null {
  const { stack } = useContext(ComponentStackContext);
  return stack[n] || null;
}

/**
 * 检查当前组件是否在任意一个指定类型的祖先组件内部。
 */
export function useHasAnyParentComponent(componentTypes: string[]): boolean {
  const { stack } = useContext(ComponentStackContext);
  return componentTypes.some(type => stack.includes(type));
}

/**
 * 打印当前组件的完整组件栈（调试用）。
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