import React from 'react';
import { Route, Routes } from "react-router-dom";
import { routes, RouteConfig } from "../router/config";
import {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    Download,
    DownloadGame,
    DownloadModpack,
    MicrosoftAccount,
    OfflineAccount,
    Settings,
    Multiplayer,
    Feedback,
    Hint,
    GameSettings,
    GameSettingsJava,
    GameSettingsGeneral,
    GameSettingsAppearance,
    GameSettingsDownload,
    VersionInstall
} from '../pages';

// 组件映射
const componentMap: Record<string, React.FC> = {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    Download,
    DownloadGame,
    DownloadModpack,
    MicrosoftAccount,
    OfflineAccount,
    Settings,
    Multiplayer,
    Feedback,
    Hint,
    GameSettings,
    GameSettingsJava,
    GameSettingsGeneral,
    GameSettingsAppearance,
    GameSettingsDownload,
    VersionInstall
};

// 递归渲染所有路由（平级，不嵌套）
const renderAllRoutes = (routeList: RouteConfig[]): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const processRoutes = (routesToProcess: RouteConfig[]) => {
        routesToProcess.forEach((route) => {
            const Component = componentMap[route.componentName];
            if (!Component) {
                console.warn(`Component ${route.componentName} not found in componentMap`);
                return;
            }

            // 添加当前路由
            result.push(
                <Route 
                    key={route.path} 
                    path={route.path} 
                    element={<Component />} 
                />
            );
            
            // 递归处理子路由
            if (route.children) {
                processRoutes(route.children);
            }
        });
    };
    
    processRoutes(routeList);
    return result;
};

// 这个组件专门负责根据路由配置渲染对应的页面组件
const RouterRenderer = () => {
    return (
        <div className="h-full p-8 overflow-hidden">
            <Routes>
                {renderAllRoutes(routes)}
            </Routes>
        </div>
    );
}

export default RouterRenderer;
