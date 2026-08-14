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
// 玩家身份需要使用正版/离线/第三方登录，每个玩家账户数据互相隔离(除了游戏实例)
// 根据以上实现适合的账户界面初步 ui 设计

import { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { routes, findRouteByPath } from './router/config';
import { useNavStore } from './stores/navStore';
import { useLastVisitedStore } from './stores/lastVisitedStore';
import { useThemeStore } from './stores/themeStore';
import { useAppStore } from './stores/appStore';
import { useGameStore } from './stores/gameStore';
import { useDownloadStore } from './stores/downloadStore';
import { useUIModeStore } from './stores/uiModeStore';
import { logger } from './helper/logger';
import { useWindowPosition } from './hooks/useWindowPosition';
import GlobalDownloadBar from './components/GlobalDownloadBar';
import { BackgroundLayer } from './components/common/BackgroundLayer';
import ErrorBoundary from './components/common/ErrorBoundary';
import { GlobalLoadingBar } from './components/common';
import './helper/i18n';
import { AppShell, resolveShell } from './layout';
import { useAuthStore } from './stores/authStore';
import { useAdminStore } from './stores/adminStore';
import { useFontStore } from './stores';
import { invokeRustFunction } from './api/client';
import { useSafeNavigate } from './router/navigation';

const MainLayout = () => {
  const location = useLocation();

  const setCurrentPath = useNavStore((s) => s.setCurrentPath);
  const { mode: uiMode } = useUIModeStore();

  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];
  const shell = resolveShell(uiMode, currentRoute);
  const safeNavigate = useSafeNavigate();

  const handleMenuClick = (targetPath: string) => {
    safeNavigate(targetPath);
  };

  useEffect(() => {
    const currentPath = location.pathname;
    setCurrentPath(currentPath);
    logger.info(`Navigated to ${currentPath}`);

    for (const route of routes) {
      if (!route.path || !route.children?.length || !route.autoNavigateToFirstChild) continue;
      for (const child of route.children) {
        if (!child.path) continue;
        const childSegments = child.path.split('/');
        const actualSegments = currentPath.split('/');
        if (childSegments.length !== actualSegments.length) continue;
        let matches = true;
        for (let i = 0; i < childSegments.length; i++) {
          if (childSegments[i].startsWith(':')) continue;
          if (childSegments[i] !== actualSegments[i]) { matches = false; break; }
        }
        if (matches) {
          useLastVisitedStore.getState().setLastVisited(route.path, child.path);
          break;
        }
      }
    }
  }, [location.pathname, setCurrentPath]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="renderpage h-screen flex flex-col" onContextMenu={handleContextMenu}>
      <AppShell shell={shell} route={currentRoute} handleMenuClick={handleMenuClick} />
    </div>
  );
};

/** 应用根组件 - 初始化各系统、渲染主布局 */
function App() {
  const initTheme = useThemeStore((s) => s.init);
  const initApp = useAppStore((s) => s.init);
  const initInstances = useGameStore((s) => s.init);
  const initFont = useFontStore((s) => s.init);
  const setupDownloadListeners = useDownloadStore((s) => s.setupEventListeners);
  const initDownload = useDownloadStore((s) => s.init);
  const initializeAccountStore = useAuthStore((s) => s.initialize);
  useWindowPosition();

  useEffect(() => {
    initTheme();
    initApp();
    initInstances();
    initFont();
    initializeAccountStore();
    initDownload();
    useAdminStore.getState();
    invokeRustFunction("initialize_admin_system").catch(() => { });
  }, [initTheme, initApp, initInstances, initFont, initializeAccountStore, initDownload]);

  useEffect(() => {
    const cleanup = setupDownloadListeners();
    return cleanup;
  }, [setupDownloadListeners]);

  // 监听角色切换事件（目前主要用于日志记录）
  useEffect(() => {
    const handleRoleSwitch = (_event: CustomEvent) => {
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
      <GlobalLoadingBar />
      <ErrorBoundary>
        <MainLayout />
        <GlobalDownloadBar />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
