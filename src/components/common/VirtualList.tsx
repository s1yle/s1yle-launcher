import React, { useState, useRef, useCallback, useMemo, memo } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function VirtualListInner<T>({
  items,
  height = '100%',
  itemHeight,
  overscan = 3,
  renderItem,
  className,
  style,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
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
      className={className}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
    >
      {items.length > 0 && (
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ item, index, style: itemStyle }) => (
            <div key={index} style={itemStyle}>
              {renderItem(item, index, itemStyle)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

export default VirtualList;