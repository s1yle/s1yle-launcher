import { DynamicIsland, FloatingControls } from '@/components/common';
import Header from '@/components/Header';
import { RouteConfig } from '@/router/models';
import { HeaderKind } from './shell';

/** AppHeader 组件的 Props */
export interface AppHeaderProps {
  kind: HeaderKind;
  route: RouteConfig;
  handleMenuClick: (targetPath: string) => void;
}

/** 原生顶部栏 - 与经典模式顶部栏一致（返回按钮 + 标题 + 窗口控制） */
const NativeHeader = ({ route }: { route: RouteConfig }) => (
  <Header
    type={route.header.type === 'main' ? 'main' : 'sub'}
    title={route.header.title || '未知'}
  />
);

/** 灵动岛顶部栏 - 悬浮窗口控制 + 胶囊导航 + 顶部拖曳区 */
const IslandHeader = ({ handleMenuClick }: { handleMenuClick: (path: string) => void }) => (
  <>
    <FloatingControls />
    <DynamicIsland onMenuClick={handleMenuClick} />

    {/* 顶部拖曳区域 - 覆盖灵动岛两侧的空间 */}
    <div
      className="fixed top-0 left-0 right-0 h-20 z-40 
        bg-(--color-bg-surface) border-b border-(--color-border)
      "
      data-tauri-drag-region="true"
    >
      <div className="absolute inset-0" data-tauri-drag-region />
    </div>
  </>
);

/** 应用顶部导航栏 - 按壳体规格渲染对应头部 */
const AppHeader = ({ kind, route, handleMenuClick }: AppHeaderProps) => {
  switch (kind) {
    case 'island':
      return <IslandHeader handleMenuClick={handleMenuClick} />;
    case 'floating':
      return <FloatingControls />;
    case 'native':
      return <NativeHeader route={route} />;
    case 'none':
      return null;
  }
};

export default AppHeader;
