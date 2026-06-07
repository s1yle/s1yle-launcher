import { AnimatePresence, motion, } from "framer-motion"
import React, { useCallback } from "react"
import Toggle from "../Toggle";
import { SettingsPanelDropDownProps, SettingsPanelItemContext, SettingsPanelItemProps, SettingsPanelProps, SubSettingsPanelItemProps } from "./models";
import Spinner from "../Loading/Spinner";
import Overlay from "../Loading/Overlay";
import { useLoading } from "@/hooks/useLoading";
import DropDown from "../DropDown";


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
  ...rest
}: SettingsPanelProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className={`bg-(--color-surface)  w-full mb-10 
          ${overflowHidden ? 'overflow-hidden rounded-(--radius-sm)' : 'rounded-t-(--radius-sm)'} 
          ${className}`}
        {...rest}
      >
        {/* title */}
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
}: SettingsPanelItemProps) => {
  const [hovered, setHovered] = React.useState(false);
  const [itemElement, setItemElement] = React.useState<HTMLDivElement | null>(null);

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
    <SettingsPanelItemContext.Provider value={contextValue}>
      <div className="item-ref" ref={itemRef}>
        <Overlay active={isLoading}>

          <Spinner active={isLoading}>
            <div
              className={`gap
                bg-(--color-surface)
                ${hoverable && 'hover:bg-(--color-surface-hover)'}
                ${noPadding ? "" : "px-3 py-2"}
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
}: SubSettingsPanelItemProps
) => {
  const { isInsideItem, hovered } = React.useContext(SettingsPanelItemContext);

  const contextValue = React.useMemo(
    () => ({ isInsideItem: true, hovered }),
    [hovered]
  );

  // 根据上下文自动调整样式
  return (
    <div
      className={`${isInsideItem ?
        // 在容器中
        !noPadding && 'px-1 py-1' :
        //  不在容器中
        !noPadding && 'px-3 py-1.5'} 
                ${isInsideItem ? '' : 'bg-(--color-surface)'}`
      }
    >
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
  );
};

/**
 * ## 设置面板定制 Dropdown,  
 * - 该接口继承自 DropDownProps
 */
const SettingsPanelDropDown = ({
  options,
  label = '未知',
  value,
  defaultValue,
  onSelect,
  borderRadius,
  displayNumber,
}: SettingsPanelDropDownProps) => {

  return (
    <AnimatePresence>
      <motion.div
        className={`
          flex justify-between items-center
        `}
      >
        <motion.span
          className={`
            font-light text-sm
            block
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
        />
      </motion.div>
    </AnimatePresence>
  )
}

// TODO: 为后续可能需要用到的组件（如Toggle）实现条目包装器
// 复合组件export
export const SettingsPanel = Object.assign(SettingsPanelRoot, {
  Item: SettingsPanelItem,
  Sub: SubSettingsPanelItem,
  Toggle: Toggle,
  DropDown: SettingsPanelDropDown,
});
