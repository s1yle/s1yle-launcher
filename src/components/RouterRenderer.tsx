import { Route, Routes } from "react-router-dom";
import { routes } from "../router/config";
import {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    Download,
    Settings,
    Multiplayer,
    Feedback,
    Hint
} from '../pages';

// 组件映射
const componentMap: Record<string, React.FC> = {
    Home,
    AccountList,
    AccountListWithSidebar,
    InstanceManage,
    InstanceList,
    Download,
    Settings,
    Multiplayer,
    Feedback,
    Hint
};


// 这个组件专门负责根据路由配置渲染对应的页面组件
const RouterRenderer = () => {


    return (
        <div>
            <Routes>
            {routes.map((route) => {
                const Component = componentMap[route.componentName];
                return (
                <Route 
                    key={route.path} 
                    path={route.path} 
                    element={<Component />} 
                />
                );
            })}
            </Routes>
        </div>
    );

}

export default RouterRenderer;