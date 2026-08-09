import { TargetAndTransition, VariantLabels } from "framer-motion"
import React from "react";
import { DropDownProps } from "../DropDown";
import { CheckSwitchProps } from "../CheckSwitch";

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
    /** 禁用整个面板（非激活态：灰显 + 不可交互） */
    disabled?: boolean;
}

/** 设置面板禁用状态上下文（供子组件感知父级 disabled） */
export const SettingsPanelDisabledContext = React.createContext<boolean>(false);

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
    /** 禁用条目（非激活态：灰显 + 不可交互） */
    disabled?: boolean;
}

/** 子设置条目组件 Props（用于嵌套） */
export interface SubSettingsPanelItemProps {
    children: React.ReactNode;
    label: string;
    className?: string;
    noPadding?: boolean;
    gap?: string;
    /** 禁用子条目（非激活态：灰显 + 不可交互） */
    disabled?: boolean;
}

/** 设置面板下拉组件 Props */
export interface SettingsPanelDropDownProps extends DropDownProps {
    label: string | '';
    /** 禁用（灰显 + 不可交互） */
    disabled?: boolean;
}

/** 设置面板输入+按钮组合组件 Props */
export interface SettingsPanelInputProps {
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    /** 浏览按钮回调（存在时显示浏览按钮） */
    onBrowse?: () => void;
    /** 浏览按钮文案（默认取 i18n common.browse） */
    browseLabel?: string;
}

/** 设置面板勾选开关组件 Props（透传 CheckSwitchProps） */
export interface SettingsPanelCheckSwitchProps extends CheckSwitchProps {}