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

// MC风格背景图URL
const BACKGROUND_IMAGE_URL = 'assets/img/bg-1.png';

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
  const currentRoute = routes.find(route => route.path === location.pathname) || routes[0];
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header type={currentRoute.header.type} title={currentRoute.header.title} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* 主内容区域 - 核心修改：背景元素移到内容容器内，跟随内容高度 */}
        <main className="flex-1 overflow-auto relative">
          {/* 页面内容容器（背景+内容）- 关键：让容器高度适配内容 */}
          <div className="relative min-h-full">
            {/* MC风格背景图 - 改为相对于内容容器定位，高度跟随内容 */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
              style={{ 
                backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
                // 确保背景图覆盖整个内容区域，即使内容超过可视高度
                minHeight: '100%',
                // 可选：如果想让背景图不重复，且完整展示，可调整background-size
                // backgroundSize: 'contain', // 替换cover，适合想看到完整图片的场景
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-gray-900/90"></div>
            </div>
            
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
          </div>
        </main>
      </div>
      
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