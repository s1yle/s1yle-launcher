import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
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

const EXIT_DUR = 0.2;

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
  const navigate = useNavigate();
  
  // 1. 核心状态：我们显示给用户看的“页面钥匙”，而不是真实的 location.pathname
  const [displayKey, setDisplayKey] = useState(location.pathname);
  // 2. 锁状态：防止动画过程中用户重复点击
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMenuClick = (targetPath: string) => {
    // 如果正在动画中，或者点的是当前页，直接忽略
    if (isAnimating || targetPath === location.pathname) return;

    // 上锁，禁止重复点击
    setIsAnimating(true);
    
    // 等待退场动画时间
    setDisplayKey(targetPath);
    setTimeout(() => {
      navigate(targetPath);
      setTimeout(() => {
        setIsAnimating(false);
      }, EXIT_DUR * 1000 + 50);
    }, EXIT_DUR * 1000); // 这里的 250 要和下面 exit 的 duration 对应
  };

  // 全局右键菜单拦截函数
  const handleContextMenu = (e: React.MouseEvent) => {
    // const target = e.target as HTMLElement;
    const isAllowRightClick = true;
    
    // (兼容逻辑) 判断是否为需要保留右键的元素
    // const isAllowRightClick = 
    //   target.tagName === 'INPUT' || 
    //   target.tagName === 'TEXTAREA' || 
    //   target.isContentEditable;

    // 如果不是允许的元素，直接阻止右键菜单弹出
    if (!isAllowRightClick) {
      e.preventDefault();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden dpi-transition"
      onContextMenu={handleContextMenu}>

      <Header type={currentRoute.header.type} title={currentRoute.header.title} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onMenuClick={ handleMenuClick }/>
        
        {/* 主内容区域 - 核心修改：背景元素移到内容容器内，跟随内容高度 */}
        <main 
          className="flex-1 overflow-auto relative"
          style={{
            background: `url(${BACKGROUND_IMAGE_URL}) no-repeat center center / cover`,
            backgroundAttachment: 'fixed'
          }}
        >

        {/* AnimatePresence ：检测子组件的变化，并触发动画 */}
        <AnimatePresence mode="wait">
          {/* motion.div 是动画容器，key 必须是唯一的（这里用路径） */}
          <motion.div
            key={displayKey}
            className="absolute inset-0 p-8"
            // 初始状态（入场前）
            initial={{ opacity: 0, x: 20 }}
            // 激活状态（入场后）
            animate={{ opacity: 1, x: 0 }}
            // 离场状态
            exit={{ opacity: 0, x: -20 }}
            // 动画配置
            transition={{ duration: EXIT_DUR, ease: "easeOut" }}
          >
        
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
            <Outlet />

          </motion.div>
        </AnimatePresence>

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