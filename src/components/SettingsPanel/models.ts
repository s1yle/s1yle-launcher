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
    hovered: boolean;
}

export const SettingsPanelItemContext = React.createContext<SettingsPanelItemContextValue>({
    isInsideItem: false,
    hovered: false,
});