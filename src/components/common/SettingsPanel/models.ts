import { TargetAndTransition, VariantLabels } from "framer-motion"
import React from "react";
import { DropDownProps } from "../DropDown";

/** 设置面板根组件 Props */
export interface SettingsPanelProps {
    label: string;
    children: React.ReactNode;
    className?: string;
    gap?: number;
    initial?: boolean | TargetAndTransition | VariantLabels;
    exit?: TargetAndTransition | VariantLabels;
    animate?: boolean | TargetAndTransition | VariantLabels;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    contentClassName?: string;
    overflowHidden?: boolean;
}

interface SettingsPanelItemContextValue {
    isInsideItem: boolean;
    itemElement?: HTMLDivElement | null;
    hovered: boolean;
}

/** 设置面板条目上下文（用于子组件判断是否在 Item 内） */
export const SettingsPanelItemContext = React.createContext<SettingsPanelItemContextValue>({
    isInsideItem: false,
    itemElement: null,
    hovered: false,
});


/** 设置面板条目组件 Props */
export interface SettingsPanelItemProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    hoverable?: boolean;
    shouldLoad?: boolean;
    loadingKey?: string;
}

/** 子设置条目组件 Props（用于嵌套） */
export interface SubSettingsPanelItemProps {
    children: React.ReactNode;
    label: string;
    className?: string;
    noPadding?: boolean;
    gap?: string;
}

/** 设置面板下拉组件 Props */
export interface SettingsPanelDropDownProps extends DropDownProps {
    label: string | '';
}