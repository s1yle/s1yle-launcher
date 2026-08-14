import React, { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { pageSection } from '@/utils/animations';

/** 虚拟列表组件 Props */
export interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
  style?: React.CSSProperties;
}

function VirtualListInner<T>({
  items,
  height = '100%',
  itemHeight,
  overscan = 3,
  renderItem,
  keyExtractor,
  className,
  style,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  // items 变更（筛选/搜索）时重新允许入场动画
  useEffect(() => {
    setHasScrolled(false);
  }, [items]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 0) setHasScrolled(true);
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = items.length > 0
    ? Math.min(items.length - 1, Math.ceil((scrollTop + (typeof height === 'number' ? height : 400)) / itemHeight) + overscan)
    : -1;

  const visibleItems = useMemo(() => {
    if (endIndex < startIndex) return [];
    const result: Array<{ item: T; index: number; style: React.CSSProperties }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`${className || ''} scrollbar-hide-x pt-3`}
      style={{
        height,
        position: 'relative',
        scrollbarGutter: 'stable',
        ...style,
      }}
    >
      {items.length > 0 && (
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ item, index, style: itemStyle }) => (
            <motion.div
              key={keyExtractor(item)}
              variants={pageSection}
              initial={hasScrolled ? false : 'initial'}
              animate="animate"
              style={itemStyle}
            >
              {renderItem(item, index, itemStyle)}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 虚拟列表组件，只渲染可见区域以提高长列表性能 */
const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

export default VirtualList;
