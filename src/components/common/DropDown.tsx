import clsx from "clsx";
import { AnimatePresence, motion, MotionStyle, Variant, VariantLabels } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge";

const cn = (...inputs: (string | boolean | MotionStyle | undefined)[]) => twMerge(clsx(inputs));

// TODO: 将这俩数据类型 迁移进 models.ts 文件中
export interface DropDownOption {
    id: string | 'unknown';
    label: string | 'unknown label';
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

/**
 * ## 通用下拉框组件
 * 
 * @param options 外部传递参数
 * @param onSelect (可选)回调函数
 * @param className (可选)外层容器 css 样式
 * @param borderRadius (可选)提供一个 string 或 number 类型即可
 * @default '--radius-sm' 
 * @param displayNumber (可选) 显示有多少个选项
 */
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
    const [count, setCount] = useState(options.length);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    const handleOpenClick = () => {
        setIsOpen(!isOpen)
    }

    const handleOptionClick = useCallback((value: DropDownOption) => {
        setSelectedOption(value);
        setIsOpen(false);

        if (onSelect) {
            onSelect(value);
        }
    }, [onSelect]);

    return (
        <AnimatePresence>
            <motion.div
                ref={containerRef}
                className={`
                    relative
                    ${buttonWidth} ${buttonHeight}
                `}
                style={styleName}
            >
                {/* 下拉框按钮 */}
                <motion.button
                    onClick={handleOpenClick}
                    className={`rounded-(${borderRadius})
                        flex items-center justify-between
                        cursor-pointer
                        hover:bg-(--color-surface-hover)
                        px-2 py-1 border-(--color-border)
                        gap-2 w-full h-full
                        ${isButtonTransparent ? '' : 'border bg-(--color-surface-solid)'}
                    `}
                >
                    <span
                        className="text-sm font-light"
                    >
                        {selectedOption?.label}
                    </span>


                    {displayNumber && count !== undefined && (
                        <span
                            className="px-1 rounded-full text-xs"
                            style={{
                                backgroundColor: 'var(--color-primary-bg)',
                                color: 'var(--color-primary)'
                            }}
                        >
                            {count}
                        </span>
                    )}

                    <ChevronDown
                        className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
                        style={{ color: 'var(--color-text-tertiary)' }}
                    />

                </motion.button>

                {/* 下拉框 */}
                {isOpen && (
                    <motion.div
                        className={
                            `absolute top-full
                            z-100 border-r border-l border-b
                            border-(--color-border)
                            ${isDropdownTransparent ? '' : 'bg-(--color-surface-solid)'}
                            w-full
                            `
                        }
                        initial={{
                            y: -10,
                            opacity: 0,
                        }}
                        exit={{
                            y: -10,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        transition={{
                            ease: 'backOut',
                            duration: 0.2,
                        }}
                    >
                        {options.map(option => (
                            <button
                                onClick={() => handleOptionClick(option)}
                                className="w-full
                                    flex items-center justify-between 
                                    px-3 py-1.5 text-sm transition-colors
                                    hover:bg-(--color-surface-hover)
                                    hover:cursor-pointer
                                    "
                                style={{
                                    backgroundColor: selectedOption == option ? 'var(--color-surface-active)' : ''
                                }}
                            >
                                <span className="text-sm text-(--color-text-secondary)">{option.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}

export default DropDown;