// OPTIMIZE: 使用 renderIcon 管理所有lucide-icon
// 并且可以构建组件缓存池，实现懒加载, 减少频繁创建 ReactElement 产生的性能开销
//
// TODO: 特殊人群适配
// - 光敏用户保护
// - 禁用自动播放闪烁动画（频率≥3Hz 且持续≥5 秒）
// - 提供 “光敏模式”：纯黑背景 + 无动画 + 高对比度文本
// - 禁止深色模式 + 反转组合：会导致亮度激增，引发头痛 / 癫痫
// - 低视力用户适配
// - 支持文本缩放（最大至 200%）
// - 提供高对比度模式（独立于系统反转）
// - 避免使用细线条（<1px）和低对比度图标
// - 系统级辅助功能适配
// - 支持inverted-colors媒体查询，检测系统反转时禁用应用深色模式
// - 支持prefers-contrast: more，提供额外高对比度样式
// - 支持forced-colors，适配 Windows 高对比度模式
// - 支持读屏模式
//
// TODO: 杂项
// 在现有架构基础实现主题选择模式，支持跟随系统 + 浅色 + 深色模式
// 系统主题感知：自动适配浅色 / 深色模式，支持prefers-color-scheme
// 实现《用户协议》
//
// TODO: The Next Phase
//
// 支持系统JAVA环境识别, java设置中提供java选项, 解析java版本
//
// 重构项目的日志模块, 移除现有的cargo 日志库，改为自行实现
// 支持识别系统字体，并且可以选择系统字体 作为app的默认字体
// 实现mc账户头像渲染(使用rust 自行实现)
//
// 实现登陆器功能，初次进入启动器、无账号或未登录时，
// 显示独立窗口登陆器，支持双身份登录选择（玩家/服主），
// 玩家身份需要使用正版/离线/第三方登录，每个玩家账户数据互相隔离(除了游戏实例)
// 服主需注册官方账号。
// 进入启动器页面后可以通过灵动岛切换服主/玩家身份，
// 玩家身份切换到服主身份时，验证是否有服主账号
// 服主切换到玩家身份时，验证是否存在玩家账户
// 根据以上实现适合的账户界面初步 ui 设计

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
import { BackgroundLayer } from './components/common/BackgroundLayer';
import './helper/i18n';
import { PanelLeft, PanelLeftOpen } from 'lucide-react';
import ClassicLayout from './AppLayouts/ClassicLayout';
import IslandLayout from './AppLayouts/IslandLayout';
import AppHeader from './AppLayouts/AppHeader';
import AppSidebar from './AppLayouts/AppSidebar';
import AppMain from './AppLayouts/AppMain';
import useLayoutStore, { LAYOUT_DEBOUNCE_DURATION, SIDEBAR_TRANSITION_DURATION } from './stores/layoutStore';
import { DURATION } from './utils/animations';

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

  const { mode: uiMode } = useUIModeStore();
  const isAnimatingRef = useRef(false);
  const pendingNavRef = useRef<string | null>(null);


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

  const executeNavigation = useCallback((path: string) => {
    isAnimatingRef.current = true;
    pendingNavRef.current = null;
    setCurrentPath(path);
    navigate(path);
    setTimeout(() => {
      isAnimatingRef.current = false;
      if (pendingNavRef.current) {
        executeNavigation(pendingNavRef.current);
      }
    }, DURATION.PAGE_TRANSITION * 1000);
  }, [setCurrentPath, navigate]);

  const handleMenuClick = (targetPath: string) => {
    if (targetPath === location.pathname) return;

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

    if (isAnimatingRef.current) {
      pendingNavRef.current = finalPath;
      return;
    }

    executeNavigation(finalPath);
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
    header: <AppHeader mode={uiMode} currentRoute={currentRoute} handleMenuClick={handleMenuClick} />,
    sidebar: <AppSidebar mode={uiMode} transitionDuration={DURATION.SIDEBAR_TRANSITION} handleMenuClick={handleMenuClick} footer={sidebarFooter} />,
    collapsedToggleButton: collapsedToggleButton,
    sidebarTransitionDuration: DURATION.SIDEBAR_TRANSITION,
    ...(uiMode === UIMode.CLASSIC
      ? {
        shouldShowSidebar
      }
      : uiMode === UIMode.ISLAND ? {
        hasOwnSidebar,
        isSidebarCollapsed,
      }
        : {}
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
      <BackgroundLayer />
      <MainLayout />
      <FloatingDownloadButton />
    </Router>
  );
}

export default App;
