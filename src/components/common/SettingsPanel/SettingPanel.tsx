import { AnimatePresence, motion, } from "framer-motion"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import Toggle, { type ToggleProps } from "../Toggle";
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
 *
 * ## 布局契约（改样式前必读，水平 padding 只归容器管）
 * - 容器负责水平 padding：Item（px-4 py-2）、独立使用的 Sub（px-4 py-1.5）。
 *   因此任意行/控件左缘恒为 16px（与面板标题同缘），控件区右缘距面板右缘恒为 16px。
 * - 行级控件（DropDown / Input / CheckSwitch / Row）一律零水平 padding、零背景，
 *   禁止在它们内部再写 px-*；Row 的 children 是 flex 行布局，多控件自动并排。
 * - Sub 在 Item 内为 px-0（水平继承 Item），独立使用时自带 px-4 + 卡片背景。
 * - Toggle 唯一特殊：独立使用 = 卡片（px-4 + hover 背景），容器内 = 内联（px-0）。
 * - 垂直间距：默认靠各行自身 py（行间紧贴），需要松散间距时显式传 Root 的 gap（如 gap={12}）。
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
  gap = 0,
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
            <PageSection>
              <span className="text-(--color-text-primary) text-base font-medium">
                {label}
              </span>
            </PageSection>
          </div>

          {/* 页面内容：flex-col + gap（默认 0，按需传 gap 拉开间距） */}
          <div className="flex flex-col" style={{ gap: `${gap}px` }}>
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
                  ${hoverable && 'hover:bg-(--color-surface-hover)'}
                  ${noPadding ? "" : "px-4 py-2"}
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
          // 在容器中：水平 padding 归 Item 管，仅留纵向
          !noPadding && 'px-0' :
          //  不在容器中
          !noPadding && 'px-4 py-1.5'} 
                  ${isInsideItem ? '' : 'bg-(--color-surface)'}
          /border-b border-b-(--color-border)`
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
            className={`pt-1.5 ${className || ""} grid`}
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

  return (
    <motion.div
      className={`
        flex justify-between items-center gap-x-4 py-1
      `}
    >
      {/* L3 控件标签：text-sm font-light（与 Toggle/CheckSwitch 标签同级），nowrap 防挤压成竖排 */}
      {label && (
        <motion.span
          className={`
              font-light text-sm whitespace-nowrap
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
  return (
    <motion.div
      className={`
        flex justify-between items-center py-1
      `}
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
  animateFromOrigin,
  disabled = false,
}: SettingsPanelDropDownProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className={`
          flex justify-between items-center gap-x-4 py-1
          ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}
        `}
      >
        {/* L3 控件标签：text-sm font-light（与 Input 标签同级），shrink-0+nowrap 防挤压换行 */}
        <motion.span
          className={`
            font-light text-sm whitespace-nowrap
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
          animateFromOrigin={animateFromOrigin}
        />
      </motion.div>
    </AnimatePresence>
  )
}

import { ReactNode } from 'react';
import { PageSection } from "../Page";

/** 设置项组件 Props */
export interface SettingRowProps {
  label: string;
  labelI18nKey?: string;
  description?: string;
  descriptionI18nKey?: string;
  children: ReactNode;
  className?: string;
}

/** 设置项组件，包含标签、描述和子控制区（零水平 padding，左缘由容器保证 16px） */
const SettingRow = ({
  label,
  description,
  children,
  className = '',
}: SettingRowProps) => {
  return (
    <div
      className={`
        setting-row flex flex-wrap items-center gap-x-4 gap-y-1.5 py-1.5
        ${className}
      `}
    >
      {/* 标签列：flex-1 占剩余空间推控件靠右；min-w-fit → 收缩下限是标签完整宽度（nowrap 永不换行），描述在其中自由换行 */}
      <div className="flex-1 min-w-fit">
        <div className="font-light text-sm whitespace-nowrap">
          {label}
        </div>
        {/* 描述 */}
        {description && (
          <div className="text-xs text-[var(--color-text-tertiary)]">
            {description}
          </div>
        )}
      </div>

      {/* 控件区：ml-auto 右对齐；空间不足时整块换行到下一行并保持右对齐 */}
      <div className="ml-auto shrink-0 flex flex-wrap items-center justify-end gap-3">
        {children}
      </div>
    </div>
  );
};

/** 设置面板复合组件（含 Root / Item / Sub / Toggle / DropDown / Input / CheckSwitch） */
export const SettingsPanel = Object.assign(SettingsPanelRoot, {
  Item: SettingsPanelItem,
  Sub: SubSettingsPanelItem,
  Toggle: (props: ToggleProps) => <Toggle {...props} variant="item" />,
  DropDown: SettingsPanelDropDown,
  Input: SettingsPanelInput,
  CheckSwitch: SettingsPanelCheckSwitch,
  Row: SettingRow,
});
