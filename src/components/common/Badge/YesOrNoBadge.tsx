import { AnimatePresence, motion } from "framer-motion";
import { BadgePosition } from "./models";
import { Badge, Check, X } from "lucide-react";
import { useDebugComponentStack, useGetParentComponentType } from "../ContextStack/ContextStack";

/** 是/否 徽标组件 Props */
export interface YesOrNoBadgeProps {
    state?: boolean;
    position?: BadgePosition;
    zIndex?: number;
    size?: number;
}

/**
 * ## ✅ / ❎ 徽标组件
 * ### ***只做一件事***：在指定位置显示对应的徽标
 * 
 * 默认使用绝对定位在父容器的右上角显示
 * 
 * @param state 
 * ```true```(default) -> ✔   
 * ```false``` -> x  
 * @param position 参照 BadgePosition 枚举
 * @param zIndex
 * @param size 尺寸
 */
/** ✅ / ❎ 徽标组件，在父容器指定位置显示对号或叉号 */
const YesOrNoBadge = ({
    state = true,
    position = BadgePosition.TOP_RIGHT,
    zIndex = 30,
    size = 18
}: YesOrNoBadgeProps) => {

    useDebugComponentStack("TEST");
    let parent = useGetParentComponentType();

    const classes =
    `
        text-(--color-success) absolute z-${zIndex}
        ${position == BadgePosition.LEFT && 'left-0'}
        ${position == BadgePosition.RIGHT && 'right-0'}
        ${position == BadgePosition.TOP && 'top-0'}
        ${position == BadgePosition.BOTTOM && 'bottom-0'}

        ${position == BadgePosition.TOP_LEFT && 'left-0 top-0'}
        ${position == BadgePosition.TOP_RIGHT && 'top-0 right-0'}
        ${position == BadgePosition.BOTTOM_LEFT && 'bottom-0 left-0'}
        ${position == BadgePosition.BOTTOM_RIGHT && 'bottom-0 right-0'}
    `

    return (
        <AnimatePresence>
            <motion.div className="relative">
                {state ? (
                    <Check size={size}
                        className={classes}
                    />
                ) : (
                    <X size={size}
                        className={classes}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    )
}

export default YesOrNoBadge;