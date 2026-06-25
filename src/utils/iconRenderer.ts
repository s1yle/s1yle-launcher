import React from 'react';
import { type LucideIcon } from 'lucide-react';

/**
 * 统一的图标渲染工具
 * 
 * 问题背景：
 * - Lucide 图标是函数类型的组件
 * - React.isValidElement 对函数类型返回 false
 * - 直接渲染函数类型会导致 "Objects are not valid as a React child" 错误
 * 
 * 解决方案：
 * - 优先检查是否为函数类型（Lucide 图标组件）
 * - 其次检查是否为 React element
 * - 提供统一的 className 处理
 */

/** 图标渲染组件的 Props */
export interface IconRendererProps {
  icon?: LucideIcon | React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 图标尺寸映射表
 */
export const sizeMap: Record<string, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * 渲染图标的工具函数
 * 
 * @param icon - 图标组件或元素
 * @param className - 额外的 className
 * @param size - 图标大小
 * @returns 渲染后的图标元素，如果图标无效则返回 null
 */
export function renderIcon(
  icon?: LucideIcon | React.ReactNode,
  className: string = '',
  size: 'sm' | 'md' | 'lg' = 'md'
): React.ReactNode {
  if (!icon) return null;

  const sizeClass = sizeMap[size];

  // 1. 检查是否是函数类型（Lucide 图标组件）
  // 这必须在 React.isValidElement 之前检查，因为 Lucide 图标是函数
  if (typeof icon === 'function') {
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    const combinedClassName = `${sizeClass} ${className}`.trim();
    return React.createElement(IconComponent, { className: combinedClassName });
  }

  // 2. 检查是否是 React element
  if (React.isValidElement(icon)) {
    const element = icon as React.ReactElement<{ className?: string }>;
    const existingClassName = (element.props as { className?: string }).className || '';
    const combinedClassName = `${sizeClass} ${existingClassName} ${className}`.trim();
    return React.cloneElement(element, { className: combinedClassName });
  }

  // 3. 其他类型返回 null
  console.warn('Invalid icon type:', typeof icon);
  return null;
}

/**
 * React 组件版本的图标渲染器，可以直接在 JSX 中使用
 * @param props.icon - 图标组件或元素
 * @param props.className - 额外的 className
 * @param props.size - 图标大小
 */
export const Icon: React.FC<IconRendererProps> = ({
  icon,
  className = '',
  size = 'md'
}) => {
  return React.createElement(React.Fragment, null, renderIcon(icon, className, size));
};

/**
 * 判断一个值是否是有效的图标
 * @param icon - 待判断的值
 * @returns 是否为有效的图标类型
 */
export function isValidIcon(icon: unknown): icon is LucideIcon | React.ReactElement {
  if (!icon) return false;

  // 检查是否是函数类型（Lucide 图标）
  if (typeof icon === 'function') {
    return true;
  }

  // 检查是否是 React element
  if (React.isValidElement(icon)) {
    return true;
  }

  return false;
}
