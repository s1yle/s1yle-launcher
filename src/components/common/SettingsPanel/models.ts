import { TargetAndTransition, VariantLabels } from "framer-motion"
import React from "react";

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
}

interface SettingsPanelItemContextValue {
    isInsideItem: boolean;
    itemElement?: HTMLDivElement | null;
    hovered: boolean;
}

export const SettingsPanelItemContext = React.createContext<SettingsPanelItemContextValue>({
    isInsideItem: false,
    itemElement: null,
    hovered: false,
});


export interface SettingsPanelItemProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    hoverable?: boolean;
    shouldLoad?: boolean;
}

export interface SubSettingsPanelItemProps {
    children: React.ReactNode;
    label: string;
    className?: string;
    noPadding?: boolean;
    gap?: string;
}