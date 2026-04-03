import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabBarProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TabBar = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'horizontal',
  size = 'md',
  className,
}: TabBarProps) => {
  const [activeKey, setActiveKey] = useState(defaultTab || tabs[0]?.key || '');

  const handleTabClick = (key: string) => {
    const tab = tabs.find((t) => t.key === key);
    if (tab?.disabled) return;
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = tabs.find((t) => t.key === activeKey);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  if (variant === 'vertical') {
    return (
      <div className={cn('flex gap-4', className)}>
        <div className="flex flex-col gap-1 min-w-48">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              disabled={tab.disabled}
              className={cn(
                'relative flex items-center gap-3 rounded-lg transition-colors duration-200 text-left',
                sizeClasses[size],
                tab.disabled && 'opacity-50 cursor-not-allowed',
                activeKey === tab.key
                  ? 'bg-surface-active text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface',
              )}
            >
              {tab.icon && <span className="w-5 h-5 flex-shrink-0">{tab.icon}</span>}
              <span className="flex-1">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-primary-bg text-primary text-xs">
                  {tab.badge}
                </span>
              )}
              {activeKey === tab.key && (
                <motion.div
                  layoutId="activeTabIndicator-v"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {activeTab?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="relative flex gap-1 p-1 rounded-lg bg-surface border border-border">
        {activeKey && (
          <motion.div
            layoutId="activeTabIndicator-h"
            className="absolute top-1 bottom-1 rounded-md bg-surface-active"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            disabled={tab.disabled}
            className={cn(
              'relative z-10 flex items-center gap-2 rounded-md transition-colors duration-200',
              sizeClasses[size],
              tab.disabled && 'opacity-50 cursor-not-allowed',
              activeKey === tab.key ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.icon && <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary-bg text-primary text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeTab?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabBar;
