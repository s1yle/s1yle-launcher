import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { routes } from './router/config';
import {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  Download,
  Settings,
  Multiplayer,
  Feedback,
  Hint
} from './pages';

// MC风格背景图URL
const BACKGROUND_IMAGE_URL = './src/assets/img/bg-1.png';
// const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

// 组件映射
const componentMap: Record<string, React.FC> = {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  Download,
  Settings,
  Multiplayer,
  Feedback,
  Hint
};

// 主布局组件
const MainLayout = () => {
  const location = useLocation();
  const currentRoute = routes.find(route => route.path === location.pathname) || routes[0];
  
  return (
    <div className="h-screen flex flex-col overflow-hidden dpi-transition">
      <Header type={currentRoute.header.type} title={currentRoute.header.title} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* 主内容区域 - 核心修改：背景元素移到内容容器内，跟随内容高度 */}
        <main 
          className="flex-1 overflow-auto relative"
          style={{
            background: `url(${BACKGROUND_IMAGE_URL}) no-repeat center center / cover`,
            backgroundAttachment: 'fixed'
          }}
        >
          {/* 页面内容容器（背景+内容）- 关键：让容器高度适配内容 */}
            
            {/* 页面内容（在背景之上）- 移除h-full，改为min-h-full适配内容 */}
            <div className="relative z-10 min-h-full">
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
        </main>
      </div>
      
    </div>
  );
};

// 应用根组件
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;