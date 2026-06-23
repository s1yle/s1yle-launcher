import clsx from "clsx";
import { AnimatePresence, motion, MotionStyle } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useCallback, useRef, useState, useMemo, useEffect } from "react"
import { twMerge } from "tailwind-merge";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Portal } from "./Portal";
import { Z_INDEX } from "@/utils/zIndex";

const cn = (...inputs: (string | boolean | MotionStyle | undefined)[]) => twMerge(clsx(inputs));

export interface DropDownOption {
  id: string;
  label: string;
}

export interface DropDownProps {
  options: DropDownOption[];
  /** 受控模式：当前选中项（传入时组件由父组件控制选中状态） */
  value?: DropDownOption;
  /** 非受控模式：初始选中项（仅在首次渲染时生效） */
  defaultValue?: DropDownOption;
  onSelect?: (value: DropDownOption) => void;
  styleName?: MotionStyle | undefined;
  borderRadius?: string | number;
  displayNumber?: boolean;
  isButtonTransparent?: boolean;
  isDropdownTransparent?: boolean;
  buttonWidth?: 'w-xs' | 'w-md' | 'w-xl' | 'w-full' | 'w-auto';
  buttonHeight?: 'h-xs' | 'h-md' | 'h-xl' | 'h-full' | 'h-auto';
  /** 是否显示搜索框（选项较多时启用） */
  showSearch?: boolean;
  /** 搜索框占位文本 */
  searchPlaceholder?: string;
}

const DropDown = ({
  options,
  value,
  defaultValue,
  onSelect,
  styleName,
  borderRadius = '--radius-sm',
  displayNumber = false,
  isButtonTransparent = false,
  isDropdownTransparent = false,
  buttonWidth = 'w-auto',
  buttonHeight = 'h-auto',
  showSearch = false,
  searchPlaceholder = '搜索...',
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // 受控模式
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<DropDownOption>(
    defaultValue ?? options[0],
  );
  const selectedOption = isControlled ? value : internalSelected;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 问题根源在于 Portal 组件的 SSR 守卫（mounted 状态）多了一次渲染延迟。
  // 时序链路
  //
  // isOpen → true
  //   │
  //   ├─ React commit #1
  //   │   ├─ Portal 检测 mounted=false → 返回 null（listRef 未挂载）
  //   │   └─ DropDown 的 useEffect 触发 → 调度 rAF
  //   │
  //   ├─ Portal 的 useEffect → setMounted(true)
  //   │
  //   ├─ React 处理 setMounted → commit #2（Portal 终于渲染出子节点）
  //   │
  //   ├─ Paint
  //   │
  //   └─ rAF 回调执行 ← 此时 listRef 才真正存在！
  //
  // 因为每次关闭再打开，Portal 都被重新挂载（mounted 重置为 false），
  // 每开一次就有一个空渲染周期。单次 rAF 有时能赶上、有时赶不上，所以不稳定。
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
      })
    })
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const filteredOptions = useMemo(
    () => showSearch && searchQuery
      ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options,
    [options, searchQuery, showSearch]
  );

  const containerRef = useClickOutside<HTMLDivElement>(
    () => {
      setIsOpen(false);
      setSearchQuery('');
    },
    isOpen,
    [dropdownRef],
  );

  const handleOpenClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      // 等 Portal 渲染后聚焦搜索框
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  };

  const handleOptionClick = useCallback((option: DropDownOption) => {
    if (!isControlled) {
      setInternalSelected(option);
    }
    setIsOpen(false);
    setSearchQuery('');
    onSelect?.(option);
  }, [isControlled, onSelect]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleOptionClick(filteredOptions[0]);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [filteredOptions, handleOptionClick]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className={`relative cursor-pointer ${buttonWidth} ${buttonHeight}`}
        style={styleName}
      >
        <motion.button
          ref={buttonRef}
          onClick={handleOpenClick}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`
            rounded-(${borderRadius})
            flex items-center justify-between
            cursor-pointer
            hover:bg-(--color-surface-hover)
            px-2 py-1 border-(--color-border)
            gap-2 w-full h-full
            focus:outline-none focus:ring-(--color-primary-light)
            ${isButtonTransparent ? '' : 'border bg-(--color-surface-solid)'}
          `}
        >
          <span className="text-sm font-light">
            {selectedOption?.label}
          </span>

          {displayNumber && options.length > 0 && (
            <span
              className="px-1 rounded-full text-xs"
              style={{
                backgroundColor: 'var(--color-primary-bg)',
                color: 'var(--color-primary)'
              }}
            >
              {options.length}
            </span>
          )}

          <ChevronDown
            className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </motion.button>

        {isOpen && (
          <Portal
            anchorTo={buttonRef}
            floatingRef={dropdownRef}
            placement="bottom-start"
            zIndex={Z_INDEX.DROPDOWN}
          >
            <AnimatePresence>
              <motion.div
                key="dropdown"
                role="listbox"
                aria-orientation="vertical"
                className={`
                  border border-(--color-border)
                  ${isDropdownTransparent ? '' : 'bg-(--color-surface-solid)'}
                  min-w-[200px]
                `}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ ease: 'backOut', duration: 0.2 }}
              >

                {/* 搜索框 */}
                {showSearch && (
                  <div className="relative px-2 pt-1.5 pb-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--color-text-tertiary)" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={searchPlaceholder}
                      className="
                        w-full pl-7 pr-2 py-1 text-sm
                        bg-(--color-bg-secondary) text-(--color-text-primary)
                        border border-(--color-border) rounded-md
                        outline-none
                        focus:border-(--color-primary)
                        placeholder:text-(--color-text-disabled)
                      "
                    />
                  </div>
                )}

                <div ref={listRef} className="max-h-60 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                      <button
                        key={option.id}
                        role="option"
                        aria-selected={option.id === selectedOption?.id}
                        onClick={() => handleOptionClick(option)}
                        className="
                          w-full flex items-center justify-between 
                          px-3 py-1.5 text-sm transition-colors
                          hover:bg-(--color-surface-hover)
                          hover:cursor-pointer
                        "
                        style={{
                          backgroundColor: selectedOption?.id === option.id ? 'var(--color-surface-active)' : ''
                        }}
                      >
                        <span className="text-sm text-(--color-text-secondary)">{option.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-(--color-text-disabled) text-center">
                      无匹配结果
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Portal>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DropDown;
