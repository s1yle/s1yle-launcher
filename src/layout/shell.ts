import { LayoutMode, RouteConfig } from '@/router/models';
import { UIMode } from '@/stores/uiModeStore';

/** 顶部区域渲染方式 */
export type HeaderKind = 'island' | 'native' | 'floating' | 'none';

/** 侧边栏策略 */
export type SidebarKind = 'own' | 'classic' | 'none';

/** 布局壳体规格（由 resolveShell 根据用户模式 + 路由推导） */
export interface ShellSpec {
  header: HeaderKind;
  sidebar: SidebarKind;
  /** 内容区顶部留白（px），灵动岛模式为 80 */
  topInset: number;
  /** 是否包布局框架（island 全屏模式不包，由页面自绘） */
  frame: boolean;
}

/**
 * 推导当前页面的布局壳体规格。
 * 规则：
 * - FULLSCREEN：统一原生头部 + 无侧边栏（页面未自绘 header 时由框架统一提供）
 * - NATIVE_HEADER：隐藏灵动岛，使用原生顶部栏；island 模式下侧边栏策略看 ownSidebar
 * - 其余：跟随用户模式（island → 灵动岛 + 80px 留白；classic → 原生头部 + 全局侧边栏）
 */
export function resolveShell(mode: UIMode, route: RouteConfig): ShellSpec {
  const fullscreen = route.layoutMode === LayoutMode.FULLSCREEN;
  const nativeHeader = route.layoutMode === LayoutMode.NATIVE_HEADER;
  const ownSidebar = route.ownSidebar === true;

  if (fullscreen) {
    return {
      header: 'native',
      sidebar: 'none',
      topInset: 0,
      frame: true,
    };
  }

  if (nativeHeader) {
    return {
      header: 'native',
      sidebar: mode === UIMode.CLASSIC ? 'classic' : ownSidebar ? 'own' : 'none',
      topInset: 0,
      frame: true,
    };
  }

  if (mode === UIMode.CLASSIC) {
    return { header: 'native', sidebar: 'classic', topInset: 0, frame: true };
  }

  return { header: 'island', sidebar: ownSidebar ? 'own' : 'none', topInset: 80, frame: true };
}
