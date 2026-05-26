import { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { routes, findRouteByPath, LayoutMode, pagesWithOwnSidebar } from './router/config';
import { useNavStore } from './stores/navStore';
import { useThemeStore } from './stores/themeStore';
import { useAppStore } from './stores/appStore';
import { useInstanceStore } from './stores/instanceStore';
import { useDownloadStore } from './stores/downloadStore';
import { UIMode, useUIModeStore } from './stores/uiModeStore';
import { logger } from './helper/logger';
import { useWindowPosition } from './hooks/useWindowPosition';
import FloatingDownloadButton from './components/FloatingDownloadButton';
import './helper/i18n';
import { PanelLeft, PanelLeftOpen } from 'lucide-react';
import ClassicLayout from './AppLayouts/ClassicLayout';
import IslandLayout from './AppLayouts/IslandLayout';
import AppHeader from './AppLayouts/AppHeader';
import AppSidebar from './AppLayouts/AppSidebar';
import AppMain from './AppLayouts/AppMain';
import useLayoutStore, {PAGE_TRANSITION_DURATION, SIDEBAR_TRANSITION_DURATION} from './stores/LayoutStore';

const LAYOUT_MODES = {
  [UIMode.CLASSIC]: ClassicLayout,
  [UIMode.ISLAND]: IslandLayout,
}

const MainLayout = () => {
  // location 和 navigate 钩子 Hook
  const location = useLocation();
  const navigate = useNavigate();

  // Nav Store 模式
  const setCurrentPath = useNavStore((s) => s.setCurrentPath);
  const setNavigating = useNavStore((s) => s.setNavigating);
  const isNavigating = useNavStore((s) => s.isNavigating);

  const { mode: uiMode } = useUIModeStore();
  const animLockRef = useRef(false);


  // 获取 sidebar 的收起/展开 状态
  const isSidebarCollapsed = useLayoutStore((s) => s.isSidebarCollapsed);
  const setIsSidebarCollapsed = useLayoutStore((s) => s.setIsSidebarCollapsed);


  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];

  const isFullscreen = currentRoute.layoutMode === LayoutMode.FULLSCREEN;

  const isInstanceManagePage = location.pathname.startsWith('/instance-manage/');
  const hasOwnSidebar = uiMode === UIMode.ISLAND && (
    pagesWithOwnSidebar.some(path => location.pathname.startsWith(path)) ||
    isInstanceManagePage
  );

  const handleMenuClick = (targetPath: string) => {
    if (animLockRef.current || targetPath === location.pathname) return;

    let finalPath = targetPath;

    // 处理带有 instanceId 的 路径
    if (finalPath.includes(':instanceId')) {
      const instance = useInstanceStore.getState().getSelectedInstance();
      if (instance) {
        finalPath = finalPath.replace(':instanceId', instance.id);
      } else {
        logger.warn('No instance selected for instance-specific route');
        return;
      }
    }

    animLockRef.current = true;
    setNavigating(true);
    setCurrentPath(finalPath);
    navigate(finalPath);
    setTimeout(() => {
      animLockRef.current = false;
      setNavigating(false);
    }, (Math.max(PAGE_TRANSITION_DURATION, SIDEBAR_TRANSITION_DURATION) * 1000) + 100);
  };

  useEffect(() => {
    setCurrentPath(location.pathname);
    logger.info(`Navigated to ${location.pathname}`);
  }, [location.pathname, setCurrentPath]);


  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(isSidebarCollapsed);
  }, []);

  const shouldShowSidebar = !isFullscreen && !isSidebarCollapsed;

  const sidebarFooter = (
    <button
      onClick={toggleSidebar}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
      title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      <PanelLeft className="w-4 h-4" />
      <span>收起侧边栏</span>
    </button>
  );

  const collapsedToggleButton = !isFullscreen && isSidebarCollapsed && (
    <button
      onClick={toggleSidebar}
      className="fixed left-3 top-1/2 -translate-y-1/2 z-20 p-2 
        rounded-md bg-[var(--color-surface)] 
        border border-[var(--color-border)] 
        text-[var(--color-text-secondary)] 
        hover:text-[var(--color-text-primary)] 
        hover:bg-[var(--color-surface-hover)] 
        transition-colors shadow-md cursor-pointer"
      title="展开侧边栏"
    >
      <PanelLeftOpen className="w-4 h-4" />
    </button>
  );

  const CurrentLayout = LAYOUT_MODES[uiMode];

  // DEBUG: 检查组件是否正确导入
  // console.warn('uiMode:', uiMode);
  // console.warn('CurrentLayout:', CurrentLayout);
  // console.warn('LAYOUT_MODES:', LAYOUT_MODES);
  // console.warn('ClassicLayout:', ClassicLayout);
  // console.warn('IslandLayout:', IslandLayout);

  const layoutProps = {
    // 布局部分
    header: <AppHeader mode={uiMode} currentRoute={currentRoute} handleMenuClick={handleMenuClick} />,
    sidebar: <AppSidebar mode={uiMode} transitionDuration={SIDEBAR_TRANSITION_DURATION} handleMenuClick={handleMenuClick} footer={sidebarFooter} />,
    collapsedToggleButton: collapsedToggleButton,
    // 参数
    sidebar_transition_duration: SIDEBAR_TRANSITION_DURATION,
    // 特殊部分
    ...(uiMode === UIMode.CLASSIC
      ? {
        // Classic
        shouldShowSidebar
      }
      : uiMode === UIMode.ISLAND ? {
        // Island
        hasOwnSidebar,
        isSidebarCollapsed,
        isNavigating,
      }
        : {
          // expecting for adding more layout...
        }
    )
  }

  // TODO: 维护该树状结构
  /**
   * ```
   * App
   * ├─ Router
   * │  └─ MainLayout
   * │     ├─ CurrentLayout (ClassicLayout | IslandLayout)
   * │     │  ├─ header → AppHeader
   * │     │  ├─ sidebar → AppSidebar
   * │     │  └─ children → AppMain
   * │     │     └─ RouterRenderer (页面内容)
   * │     └─ FloatingDownloadButton (全局悬浮下载按钮)
   * └─ (全局事件监听)
   * 
   * 布局模式:
   * ├─ Island (灵动岛)
   * │  ├─ AppHeader: FloatingControls + DynamicIsland + 拖曳区域
   * │  ├─ AppSidebar: SmartSidebar (固定定位，top: 80px)
   * │  ─ AppMain: paddingLeft = hasOwnSidebar && !isSidebarCollapsed ? sidebarWidth : 0
   * └─ Classic (经典)
   *    ├─ AppHeader: Header 组件 (主标题/副标题)
   *    ├─ AppSidebar: SmartSidebar (相对定位，top: 0)
   *    └─ AppMain: paddingLeft = 0 (侧边栏由 ClassicLayout 内部处理)
   * 
   * 特殊页面 (有独立侧边栏):
   * ├─ /instance-manage/:instanceId/*
   * ├─ /instance-list
   * └─ /download/*
   *    → hasOwnSidebar = true (AppSidebar 显示，AppMain 设置 paddingLeft)
   * ```
   */
  function renderPage() {
    return (
      <CurrentLayout
        {...layoutProps as any}
      >
        <AppMain hasOwnSidebar={hasOwnSidebar} isSidebarCollapsed={isSidebarCollapsed}></AppMain>
      </CurrentLayout>
    )
  }

  return (
    <div className="h-screen flex flex-col " onContextMenu={handleContextMenu}>
      {renderPage()}
    </div >
  );
};

function App() {
  const initTheme = useThemeStore((s) => s.init);
  const initApp = useAppStore((s) => s.init);
  const initInstances = useInstanceStore((s) => s.init);
  const setupDownloadListeners = useDownloadStore((s) => s.setupEventListeners);

  useWindowPosition();

  useEffect(() => {
    initTheme();
    initApp();
    initInstances();
  }, [initTheme, initApp, initInstances]);

  useEffect(() => {
    const cleanup = setupDownloadListeners();
    return cleanup;
  }, [setupDownloadListeners]);

  // 监听角色切换事件（目前主要用于日志记录）
  useEffect(() => {
    const handleRoleSwitch = (event: CustomEvent) => {
      // 导航已在 DynamicIsland 组件中通过 useNavigate 处理
      // 这里只需要记录日志即可
    };

    window.addEventListener('role-switch', handleRoleSwitch as EventListener);
    return () => {
      window.removeEventListener('role-switch', handleRoleSwitch as EventListener);
    };
  }, []);

  return (
    <Router>
      <MainLayout />
      <FloatingDownloadButton />
    </Router>
  );
}

export default App;
