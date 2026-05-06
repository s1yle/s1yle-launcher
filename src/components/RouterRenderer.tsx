import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { routes, findRouteByPath } from "../router/config";
import {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    DownloadGame,
    DownloadModpack,
    VersionDetailWithInstall,
    MicrosoftAccount,
    OfflineAccount,
    Settings,
    Multiplayer,
    Feedback,
    Hint,
    VersionInstall
} from '../pages';

const PAGE_TRANSITION_DURATION = 0.15;

const componentMap: Record<string, React.FC> = {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    DownloadGame,
    DownloadModpack,
    VersionDetailWithInstall,
    MicrosoftAccount,
    OfflineAccount,
    Settings,
    Multiplayer,
    Feedback,
    Hint,
    VersionInstall
};

const findComponentForPath = (pathname: string): React.FC | null => {
    const route = findRouteByPath(pathname, routes);
    if (!route) return null;
    return componentMap[route.componentName] || null;
};

const RouterRenderer = () => {
    const location = useLocation();
    const currentPathname = location.pathname;

    const Component = findComponentForPath(currentPathname);

    if (!Component) return null;

    return (
        <div className="h-full pl-3 pr-3 relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPathname}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{
                        duration: PAGE_TRANSITION_DURATION,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                >
                    <Component />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default RouterRenderer;
