/**
 * 统一的 z-index 层级常量表
 * - BACKGROUND: 自定义背景层
 * - DROPDOWN: 下拉菜单、工具提示
 * - STICKY: 粘性定位元素
 * - POPUP: 浮动面板、通知
 * - MODAL: 模态弹窗
 * - TOAST: 全局通知
 */
export const Z_INDEX = {
  /** 自定义背景层，置于所有内容下方 */
  BACKGROUND: -1,
  /** 下拉菜单、工具提示等浮层元素 */
  DROPDOWN: 100,
  /** 粘性定位元素，如置顶表头 */
  STICKY: 200,
  /** 弹出面板、通知、按钮浮层等通用浮动层 */
  POPUP: 500,
  /** 模态弹窗、全屏覆盖层 */
  MODAL: 1000,
  /** 全局 Toast 通知，始终置于最顶层 */
  TOAST: 9999,
} as const;

/** Z_INDEX 的键类型 */
export type ZIndexKey = keyof typeof Z_INDEX;
