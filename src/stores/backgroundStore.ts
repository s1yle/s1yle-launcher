import { create } from 'zustand';
import type { BackgroundConfig } from '@/config/types';
import { invokeSetConfigValue } from '@/api/config';
import { logger } from '@/helper/logger';

const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'none',
  opacity: 1,
  blur: 0,
  overlayColor: '#000000',
  overlayOpacity: 0,
};

/**
 * 背景配置 Store 的内部接口
 */
interface BackgroundState {
  /** 当前背景配置 */
  config: BackgroundConfig
  /** 启动引导阶段用配置值初始化（不落盘） */
  initBackground: (cfg: BackgroundConfig) => void
  /** 部分更新背景配置（合并到现有配置并持久化到配置层 L2） */
  setBackground: (partial: Partial<BackgroundConfig>) => void
  /** 重置为默认背景配置并持久化 */
  resetBackground: () => void
}

/**
 * 背景配置 Store
 *
 * 管理应用背景的类型、透明度、模糊度、遮罩颜色等配置。
 * 配置持久化到启动器配置文件（L2，位于 .wecraft 应用数据目录，随卸载清除），
 * 不再写入 WebView2 localStorage（卸载后残留会导致悬空路径）。
 */
export const useBackgroundStore = create<BackgroundState>((set, get) => ({
  config: { ...DEFAULT_BACKGROUND },
  initBackground: (cfg) => set({ config: { ...DEFAULT_BACKGROUND, ...cfg } }),
  setBackground: (partial) => {
    const next = { ...get().config, ...partial };
    set({ config: next });
    void invokeSetConfigValue('background', next).catch((e) =>
      logger.warn('写入 background 配置失败', e)
    );
  },
  resetBackground: () => {
    set({ config: { ...DEFAULT_BACKGROUND } });
    void invokeSetConfigValue('background', DEFAULT_BACKGROUND).catch((e) =>
      logger.warn('写入 background 配置失败', e)
    );
  },
}));
