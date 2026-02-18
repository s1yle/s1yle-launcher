import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionButton from './components/ActionButton';
import { routes } from './router/config';
import {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  Download,
  Settings,
  Multiplayer,
  Feedback
} from './pages';

// MC风格背景图URL（可访问的在线图片）
const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

// 组件映射
const componentMap: Record<string, React.FC> = {
  Home,
  AccountList,
  InstanceManage,
  InstanceList,
  Download,
  Settings,
  Multiplayer,
  Feedback
};

// 主布局组件
const MainLayout = () => {
  const location = useLocation();
  
  // 查找当前路由配置
  const currentRoute = routes.find(route => route.path === location.pathname) || routes[0];
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 动态Header */}
      <Header type={currentRoute.header.type} title={currentRoute.header.title} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto relative">
          {/* MC风格背景图 */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-gray-900/90"></div>
          </div>
          
          {/* 页面内容（在背景之上） */}
          <div className="relative z-10 h-full">
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
      
      {/* 右下角固定启动按钮 */}
      <ActionButton />
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
