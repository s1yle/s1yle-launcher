// OPTIMIZE: 使用 renderIcon 管理所有lucide-icon
// 并且可以构建组件缓存池，实现懒加载, 减少频繁创建 ReactElement 产生的性能开销
//
// TODO: 特殊人群适配（部分已完成：光敏模式 / 高对比度 / prefers-contrast /
//       inverted-colors / forced-colors / 文本缩放200%）
// - 禁用自动播放闪烁动画（频率≥3Hz 且持续≥5 秒）—— 自动播放动画监控
// - 禁止深色模式 + 反转组合：会导致亮度激增，引发头痛 / 癫痫
// - 避免使用细线条（<1px）和低对比度图标
// - 支持读屏模式（全站 ARIA 审计）
//
// TODO: 杂项
// 在现有架构基础实现主题选择模式，支持跟随系统 + 浅色 + 深色模式
// 系统主题感知：自动适配浅色 / 深色模式，支持prefers-color-scheme
// 实现《用户协议》
//
// TODO: 一个综合的关于页面, 其中包括项目介绍、贡献者名单、反馈方式、联系方式等
//
// 玩家身份需要使用正版/离线/第三方登录，每个玩家账户数据互相隔离(除了游戏)

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { routes, findRouteByPath } from './router/config';
import { registerNavigator } from './router/navigationBridge';
import { useNavStore } from './stores/navStore';
import { useLastVisitedStore } from './stores/lastVisitedStore';
import { useThemeStore } from './stores/themeStore';
import { useAccessibilityStore } from './stores/accessibilityStore';
import { useAppStore } from './stores/appStore';
import { useGameStore } from './stores/gameStore';
import { useDownloadStore } from './stores/downloadStore';
import { useUIModeStore } from './stores/uiModeStore';
import { logger } from './helper/logger';
import { useWindowPosition } from './hooks/useWindowPosition';
import GlobalDownloadBar from './components/GlobalDownloadBar';
import { BackgroundLayer } from './components/common/BackgroundLayer';
import ErrorBoundary from './components/common/ErrorBoundary';
import { GlobalLoadingBar, LoadingSurface } from './components/common';
import './helper/i18n';
import { AppShell, resolveShell } from './layout';
import { useAuthStore } from './stores/authStore';
import { useFirstRunStore } from './stores/firstRunStore';
import { useBackgroundStore } from './stores/backgroundStore';
import { useFontStore } from './stores';
import { invokeGetConfig } from '@/api';
import type { BackgroundConfig } from '@/config/types';
import { useSafeNavigate } from './router/navigation';
import { FirstRunAccountDialog } from './components/common/FirstRunAccountDialog';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const setCurrentPath = useNavStore((s) => s.setCurrentPath);
  const { mode: uiMode } = useUIModeStore();
  const authInitialized = useAuthStore((s) => s.initialized);
  const accounts = useAuthStore((s) => s.accounts);
  const setupDone = useFirstRunStore((s) => s.setupDone);
  const markSetupDone = useFirstRunStore((s) => s.markDone);
  const setFirstRun = useFirstRunStore((s) => s.setFirstRun);

  const [showWelcome, setShowWelcome] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  // 启动引导：从配置层（L2）加载背景与迎新状态，避免依赖卸载残留的 localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await invokeGetConfig();
        if (cancelled) return;
        if (typeof cfg.first_run === 'boolean') {
          useFirstRunStore.getState().initFirstRun(cfg.first_run);
        }
        if (cfg.background) {
          useBackgroundStore.getState().initBackground(cfg.background as BackgroundConfig);
        }
        setShowWelcome(useFirstRunStore.getState().firstRun);
      } catch (e) {
        logger.error('加载启动器配置失败', e);
        // 配置加载失败时回退：按默认（显示迎新）继续
        setShowWelcome(useFirstRunStore.getState().firstRun);
      } finally {
        if (!cancelled) setConfigReady(true);
      }
    })();
    // 安全网：即使 get_config 因任何原因挂起，也最多 2.5s 后放行，避免卡在加载界面
    const safety = setTimeout(() => {
      if (!cancelled) setConfigReady(true);
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  const currentRoute = findRouteByPath(location.pathname, routes) || routes[0];
  const shell = resolveShell(uiMode, currentRoute);
  const safeNavigate = useSafeNavigate();

  // 首次使用引导：初次进入且不存在任何账户时，弹出添加账户引导
  // （与迎新界面错开，迎新结束后再显示）
  const showFirstRun = authInitialized && !setupDone && accounts.length === 0 && !showWelcome;

  useEffect(() => {
    registerNavigator(navigate);
  }, [navigate]);

  const handleMenuClick = (targetPath: string) => {
    safeNavigate(targetPath);
  };

  const handleEnter = () => {
    setShowWelcome(false);
    setFirstRun(false);
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

  if (!configReady) {
    return <LoadingSurface variant="loading" />;
  }

  if (showWelcome) {
    return (
      <LoadingSurface variant="welcome" onEnter={handleEnter} />
    )
  }

  return (
    <div className="renderpage h-screen flex flex-col" onContextMenu={handleContextMenu}>
      <AppShell shell={shell} route={currentRoute} handleMenuClick={handleMenuClick} />
      {showFirstRun && (
        <FirstRunAccountDialog open={showFirstRun} onClose={markSetupDone} />
      )}
    </div>
  );
};

/** 应用根组件 - 初始化各系统、渲染主布局 */
function App() {
  const initTheme = useThemeStore((s) => s.init);
  const initAccessibility = useAccessibilityStore((s) => s.init);
  const initApp = useAppStore((s) => s.init);
  const initGames = useGameStore((s) => s.init);
  const initFont = useFontStore((s) => s.init);
  const setupDownloadListeners = useDownloadStore((s) => s.setupEventListeners);
  const initDownload = useDownloadStore((s) => s.init);
  const initializeAccountStore = useAuthStore((s) => s.initialize);
  useWindowPosition();

  // 全局错误捕获：release 下无 devtools，任何未处理的 JS 错误都直接显示到界面上，
  // 避免“静默白屏 / 透明窗体看起来啥都没有”。
  const [globalError, setGlobalError] = useState<string | null>(null);
  useEffect(() => {
    const onError = (e: ErrorEvent) =>
      setGlobalError(`${e.message}\n${e.filename}:${e.lineno}\n${e.error?.stack ?? ''}`);
    const onReject = (e: PromiseRejectionEvent) =>
      setGlobalError(`UnhandledRejection: ${e.reason?.message ?? String(e.reason)}\n${e.reason?.stack ?? ''}`);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  useEffect(() => {
    initTheme();
    initAccessibility();
    initApp();
    initGames();
    initFont();
    initializeAccountStore();
    initDownload();
  }, [initTheme, initAccessibility, initApp, initGames, initFont, initializeAccountStore, initDownload]);

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
    <>
      <Router>
        <BackgroundLayer />
        <GlobalLoadingBar />
        <ErrorBoundary>
          <MainLayout />
          <GlobalDownloadBar />
        </ErrorBoundary>
      </Router>
      {globalError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#7f1d1d',
            color: '#fff',
            padding: 24,
            fontFamily: 'monospace',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>运行时错误（release 无 devtools，此处显示）</div>
          {globalError}
          <button
            style={{ marginTop: 16, padding: '6px 12px', cursor: 'pointer' }}
            onClick={() => setGlobalError(null)}
          >
            关闭
          </button>
        </div>
      )}
    </>
  );
}

export default App;
