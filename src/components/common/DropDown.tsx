import clsx from "clsx";
import { AnimatePresence, motion, MotionStyle } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react"
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
  onSelect?: (value: DropDownOption) => void;
  styleName?: MotionStyle | undefined;
  borderRadius?: string | number;
  displayNumber?: boolean;
  isButtonTransparent?: boolean;
  isDropdownTransparent?: boolean;
  buttonWidth?: 'w-xs' | 'w-md' | 'w-xl' | 'w-full' | 'w-auto';
  buttonHeight?: 'h-xs' | 'h-md' | 'h-xl' | 'h-full' | 'h-auto';
}

const DropDown = ({
  options,
  onSelect,
  styleName,
  borderRadius = '--radius-sm',
  displayNumber = false,
  isButtonTransparent = false,
  isDropdownTransparent = false,
  buttonWidth = 'w-auto',
  buttonHeight = 'h-auto',
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const containerRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
    [dropdownRef],
  );

  const handleOpenClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = useCallback((value: DropDownOption) => {
    setSelectedOption(value);
    setIsOpen(false);
    onSelect?.(value);
  }, [onSelect]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className={`relative ${buttonWidth} ${buttonHeight}`}
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
                  overflow-hidden
                                `}
                style={{
                  borderRadius: `var(${borderRadius})`,
                }}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ ease: 'backOut', duration: 0.2 }}
              >
                {options.map(option => (
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
                ))}
              </motion.div>
            </AnimatePresence>
          </Portal>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DropDown;
