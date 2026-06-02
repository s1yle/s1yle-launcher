// src/utils/createOptions.ts
import { DropDownOption } from "@/components/common/DropDown";


/**
 * 单个选项的基础类型
 */
type BaseOptionItem = {
  value: any;
  label: string;
  [key: string]: any;
};

/**
 * 通用选项工厂函数
 * 输入一个常量数组，自动生成所有需要的类型和工具函数
 */
export function createOptions<T extends readonly BaseOptionItem[]>(
  rawOptions: T,
  defaultValue?: T[number]['value']
) {
  const options = rawOptions.map(item => ({
    ...item,
    id: String(item.value),
  })) as Array<T[number] & DropDownOption>;

  /**
   * 将下拉框返回的id转换为原始值
   */
  function fromId(id: string): T[number]['value'] {
    const found = rawOptions.find(item => String(item.value) === id);
    if (!found) {
      console.warn(`Unknown option id: ${id}, using default value`);
      return defaultValue ?? rawOptions[0].value;
    }
    return found.value;
  }

  /**
   * 将原始值转换为下拉框需要的id
   */
  function toId(value: T[number]['value']): string {
    return String(value);
  }

  return {
    /** 原始常量数组 */
    raw: rawOptions,
    /** 转换好的DropDownOption数组，可直接传给组件 */
    options,
    /** id转原始值 */
    fromId,
    /** 原始值转id */
    toId,
    /** 默认值 */
    defaultValue: defaultValue ?? rawOptions[0].value,
  } as const;
}

/**
 * 从createOptions返回值中提取值的类型
 * ✅ 修复：添加了完整的泛型约束，解决所有索引错误
 */
export type OptionValueType<T> = T extends { raw: infer R }
  ? R extends readonly BaseOptionItem[]
  ? R[number]['value']
  : never
  : never;
