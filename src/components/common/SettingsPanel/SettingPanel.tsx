import { AnimatePresence, motion, } from "framer-motion"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import Toggle from "../Toggle";
import { SettingsPanelCheckSwitchProps, SettingsPanelDisabledContext, SettingsPanelDropDownProps, SettingsPanelInputProps, SettingsPanelItemContext, SettingsPanelItemProps, SettingsPanelProps, SubSettingsPanelItemProps } from "./models";
import Spinner from "../Loading/Spinner";
import Overlay from "../Loading/Overlay";
import { useLoading } from "@/hooks/useLoading";
import DropDown from "../DropDown";
import CheckSwitch from "../CheckSwitch";

/**
 * ## SettingsPanel 字体层级规范（美观实用，改动字号请同步此表）
 *
 * | 层级 | 用途 | 字号 |
 * |------|------|------|
 * | L1 | 面板大标题（Root label） | text-base font-medium（16px） |
 * | L2 | 分区小标题（Sub label） | text-sm text-(--color-text-secondary)（14px） |
 * | L3 | 控件标签 / 按钮正文（Toggle、CheckSwitch 标签、DropDown 按钮） | text-sm font-light（14px） |
 * | L4 | 输入值 / 辅助信息（Input 输入框、PartitionBar 上下行） | text-xs（12px） |
 *
 * 控件高度约定：方形交互件（DropDown 按钮 / Input 输入框与浏览按钮）统一 28px
 * （py-1 + text-sm 行高 20px，或 py-1.5 + text-xs 行高 16px）。
 */


/**
 * ## SettingsPanel 根组件
 * 
 * @param label 大标题
 * @param className 最外层容器 - 自定义css样式
 * @param gap children 容器的 gap 样式
 * @param overflowHidden #### 控制最外层容器的溢出显示状态
 * - true -> overflow-hidden + rounded-(--radius-sm)
 * - false -> rounded-t-(--radius-sm)
 */
const SettingsPanelRoot = ({
  label,
  children,
  className,
  gap = 20,
  overflowHidden = true,
  disabled = false,
  ...rest
}: SettingsPanelProps) => {
  const parentDisabled = React.useContext(SettingsPanelDisabledContext);
  const isDisabled = parentDisabled || disabled;

  return (
    <SettingsPanelDisabledContext.Provider value={isDisabled}>
      <AnimatePresence>
        <motion.div
          className={`bg-(--color-surface)  w-full mb-10 
            ${overflowHidden ? 'overflow-hidden rounded-(--radius-sm)' : 'rounded-t-(--radius-sm)'} 
            ${isDisabled ? 'opacity-50 pointer-events-none select-none' : ''}
            ${className}`}
          {...rest}
        >
        {/* L1 面板大标题：text-base font-medium（16px） */}
        <div
          className="px-4 py-2.5 border-b q
            hover:border-(--color-border-hover) border-(--color-border)"
        >
          <span className="text-(--color-text-primary) text-base font-medium">
            {label}
          </span>
        </div>

          {/* 页面内容 */}
          <div style={{ gap: `${gap}px` }}>
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </SettingsPanelDisabledContext.Provider>
  );
};


/**
 * ## 条目包装器(负责单个条目的内边距)
 * 
 */
const SettingsPanelItem = ({
  children,
  className,
  noPadding = false,
  hoverable = false,
  shouldLoad = false,
  loadingKey,
  disabled = false,
}: SettingsPanelItemProps) => {
  const [hovered, setHovered] = React.useState(false);
  const [itemElement, setItemElement] = React.useState<HTMLDivElement | null>(null);
  const parentDisabled = React.useContext(SettingsPanelDisabledContext);
  const isDisabled = parentDisabled || disabled;

  const itemRef = useCallback((node: HTMLDivElement | null) => {
    setItemElement(node);
  }, [])

  const contextValue = React.useMemo(
    () => ({
      isInsideItem: true,
      itemElement,
      hovered,
    }),
    [hovered, itemElement]
  );

  const loadingEntry = loadingKey ? useLoading(loadingKey) : undefined;
  const isLoading = loadingKey
    ? loadingEntry?.status === 'loading'
    : shouldLoad;

  return (
    <SettingsPanelDisabledContext.Provider value={isDisabled}>
      <SettingsPanelItemContext.Provider value={contextValue}>
        <div className="item-ref" ref={itemRef}>
          <Overlay active={isLoading}>

            <Spinner active={isLoading}>
              <div
                className={`gap
                  bg-(--color-surface)
                  ${hoverable && 'hover:bg-(--color-surface-hover)'}
                  ${noPadding ? "" : "px-3 py-2"}
                  ${isDisabled ? 'opacity-50 pointer-events-none select-none' : ''}
                  ${className || ""}
                `}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                {children}
              </div>
            </Spinner>

          </Overlay>
        </div>
      </SettingsPanelItemContext.Provider>
    </SettingsPanelDisabledContext.Provider>
  );
};



/**
 * ## 子组件(用于嵌套)
 * - 推荐的做法：将其作为 SettingsPanelItem / SubSettingsPanelItemProps 的子集
 * - 不推荐的做法：独立使用 SubSettingsPanelItemProps
 */
const SubSettingsPanelItem = ({
  children,
  label = "未知",
  className,
  noPadding = false,
  gap = '12px',
  disabled = false,
}: SubSettingsPanelItemProps
) => {
  const { isInsideItem, hovered } = React.useContext(SettingsPanelItemContext);
  const parentDisabled = React.useContext(SettingsPanelDisabledContext);
  const isDisabled = parentDisabled || disabled;

  const contextValue = React.useMemo(
    () => ({ isInsideItem: true, hovered }),
    [hovered]
  );

  // 根据上下文自动调整样式
  return (
    <SettingsPanelDisabledContext.Provider value={isDisabled}>
      <div
        className={`${isDisabled ? 'opacity-50 pointer-events-none select-none' : ''} ${isInsideItem ?
          // 在容器中
          !noPadding && 'px-1 py-1' :
          //  不在容器中
          !noPadding && 'px-3 py-1.5'} 
                  ${isInsideItem ? '' : 'bg-(--color-surface)'}
          //border-b //border-b-(--color-border)`
        }
      >
        {/* L2 分区小标题：text-sm + 次要色（14px） */}
        <span className={`
            text-(--color-text-secondary) text-sm 
            ${hovered && 'text-(--color-text-primary)'}`}
        >
          {label}
        </span>

        {/* 单独使用：if !noPadding padding + 背景 / 在容器中：无padding + 无背景 */}
        <SettingsPanelItemContext.Provider value={contextValue}>
          <div
            className={`${className || ""} pt-1.5 pb-2 grid`}
            style={{ gap: `${gap}` }}
          >
            {children}
          </div>
        </SettingsPanelItemContext.Provider>
      </div>
    </SettingsPanelDisabledContext.Provider>
  );
};

/**
 * 设置面板输入+按钮组合（如"路径输入 + 浏览"）。
 * 继承设置面板样式，右侧为输入框与可选浏览按钮。
 */
const SettingsPanelInput = ({
  label = '',
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  onBrowse,
  browseLabel,
}: SettingsPanelInputProps) => {
  const { t } = useTranslation();
  const { isInsideItem } = React.useContext(SettingsPanelItemContext);

  return (
    <motion.div
      className={`
        flex justify-between items-center gap-x-4
        ${isInsideItem ?
          // 在容器中
          'px-1 py-1' :
          //  不在容器中
          'px-3 py-1.5'} 
              ${isInsideItem ? '' : 'bg-(--color-surface)'}`
      }
    >
      {/* L3 控件标签：text-sm font-light（与 Toggle/CheckSwitch 标签同级） */}
      {label && (
        <motion.span
          className={`
            font-light text-sm
            block shrink-0
          `}
        >
          {label}
        </motion.span>
      )}

      <div className="flex-1 min-w-0 flex gap-2 items-center justify-end">
        {/* L4 输入值：text-xs + py-1.5 → 28px，与 DropDown 按钮同高 */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 max-w-sm px-3 py-1.5 
            bg-(--color-input) border border-(--color-border) 
            rounded text-xs text-(--color-text-primary) placeholder:text-(--color-text-tertiary) 
            focus:outline-none focus:ring-2 focus:ring-(--color-primary) 
            disabled:opacity-50"
        />
        {/* 浏览按钮：text-xs + py-1.5 → 28px，与输入框同高 */}
        {onBrowse && (
          <button
            type="button"
            onClick={onBrowse}
            disabled={disabled}
            className="px-3 py-1.5 bg-(--color-primary) text-white rounded text-xs hover:bg-(--color-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {browseLabel || t('common.browse', '浏览')}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 设置面板勾选开关（带 ✔ 的开关按钮）。
 * 适配设置面板样式（在 Item/Sub 容器内紧凑布局）。
 */
const SettingsPanelCheckSwitch = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: SettingsPanelCheckSwitchProps) => {
  const { isInsideItem } = React.useContext(SettingsPanelItemContext);

  return (
    <motion.div
      className={`
        flex justify-between items-center
        ${isInsideItem ?
          // 在容器中
          'px-1 py-1' :
          //  不在容器中
          'px-3 py-1.5'} 
              ${isInsideItem ? '' : 'bg-(--color-surface)'}`
      }
    >
      <CheckSwitch
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
        className={className}
      />
    </motion.div>
  );
};

/**
 * 设置面板定制 DropDown。
 * 该组件继承自 DropDownProps，自动适配设置面板样式。
 */
const SettingsPanelDropDown = ({
  options,
  label = '未知',
  value,
  defaultValue,
  onSelect,
  borderRadius,
  displayNumber,
  showSearch,
  searchPlaceholder,
  disabled = false,
}: SettingsPanelDropDownProps) => {
  const { isInsideItem } = React.useContext(SettingsPanelItemContext);

  return (
    <AnimatePresence>
      <motion.div
        className={`
          flex justify-between items-center gap-x-4
          ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}
          ${isInsideItem ?
            // 在容器中
            'px-1 py-1' :
            //  不在容器中
            'px-3 py-1.5'} 
                ${isInsideItem ? '' : 'bg-(--color-surface)'}`
        }
      >
        {/* L3 控件标签：text-sm font-light（与 Input 标签同级），shrink-0 防止按钮挤压文字 */}
        <motion.span
          className={`
            font-light text-sm
            block shrink-0
          `}
        >
          {label}
        </motion.span>

        <DropDown
          options={options}
          value={value}
          defaultValue={defaultValue}
          onSelect={onSelect}
          borderRadius={borderRadius}
          displayNumber={displayNumber}
          buttonWidth="w-xs"
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
        />
      </motion.div>
    </AnimatePresence>
  )
}

// TODO: 为后续可能需要用到的组件（如Toggle）实现条目包装器
/** 设置面板复合组件（含 Root / Item / Sub / Toggle / DropDown / Input / CheckSwitch） */
export const SettingsPanel = Object.assign(SettingsPanelRoot, {
  Item: SettingsPanelItem,
  Sub: SubSettingsPanelItem,
  Toggle: Toggle,
  DropDown: SettingsPanelDropDown,
  Input: SettingsPanelInput,
  CheckSwitch: SettingsPanelCheckSwitch,
});
