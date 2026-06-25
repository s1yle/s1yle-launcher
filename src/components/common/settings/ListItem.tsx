// ListItem.tsx
import { createContext, } from 'react';

type ListItemContextType = {
  selected: boolean;
  disabled: boolean;
};

const ListItemContext = createContext<ListItemContextType>({
  selected: false,
  disabled: false,
});

/** 列表项组件 Props */
export interface ListItemProps {
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

/** 列表项根组件，含 Left / Right / Title / Description / Tag 子组件 */
export default function ListItem({
  children,
  selected = false,
  disabled = false,
  onClick,
  className = '',
}: ListItemProps) {
  return (
    <ListItemContext.Provider value={{ selected, disabled }}>
      <div
        onClick={disabled ? undefined : onClick}
        className={`
          flex items-center gap-2 px-4 py-2 -colors
          ${selected ? 'bg-(--color-primary)/20 hover:bg-(--color-primary-hover)/25' : 'bg-(--color-surface) hover:bg-(--color-surface-hover)'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {children}
      </div>
    </ListItemContext.Provider>
  );
}

/** 弹性布局方向枚举 */
export enum FLEX_DIR {
  COL = 'flex-col',
  ROW = 'flex-row',
}

interface ListItemSeperateProps {
  children: React.ReactNode,
  direction?: FLEX_DIR | FLEX_DIR.COL,
}

// 左栏组件：自动占据剩余空间
ListItem.Left = function ListItemLeft({
  children,
  direction,
}: ListItemSeperateProps) {
  return (
    <div
      className={
        `flex flex-1 min-w-0
        ${direction == FLEX_DIR.ROW && 'items-center gap-2'}
        ${direction == FLEX_DIR.COL && (direction)}
    `}
    >
      {children}
    </div >
  )
};

// 右栏组件：自动右对齐
ListItem.Right = function ListItemRight({
  children
}: ListItemSeperateProps) {
  return <div className="flex items-center gap-2 flex-shrink-0">{children}</div>;
};

// 预设的子组件：标题
ListItem.Title = function ListItemTitle({
  children
}: ListItemSeperateProps) {
  return <span className="text-sm text-(--color-text-primary)">{children}</span>;
};

// 预设的子组件：描述
ListItem.Description = function ListItemDescription({ children }: { children: React.ReactNode }) {
  return <span className="text-(--color-text-secondary) text-sm">{children}</span>;
};

// 预设的子组件：标签
ListItem.Tag = function ListItemTag({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'primary' | 'danger' }) {
  const variantClasses = {
    default: 'bg-(--color-bg-tertiary) text-(--color-text-tertiary)',
    primary: 'bg-(--color-primary-active)/20 text-(--color-text-primary)',
    danger: 'bg-(--color-error) text-(--color-text-disabled)',
  };

  return (
    <span className={`px-2 py-0.5 rounded-(--radius-2xl) text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};
