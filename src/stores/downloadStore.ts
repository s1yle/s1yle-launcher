import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';
import {
  getVersionManifest,
  getDownloadTasks,
  cancelDownload,
  cancelVersionDownload,
  clearCompletedTasks,
  getGameVersions,
  getFabricVersions,
  getFabricVersionDetail,
  buildFabricLaunchConfig,
} from '../helper/rustInvoke';
import { useInstanceStore } from './instanceStore';
import type {
  VersionManifest,
  DownloadTask,
  ModLoaderVersionList,
  FabricVersionDetail,
  ModLoaderInfo,
} from '../helper/rustInvoke';

/**
 * 单个版本的下载进度信息
 */
interface VersionDownloadProgress {
  /** 版本 ID */
  versionId: string;
  /** 下载进度（0-100，字节级） */
  progress: number;
  /** 状态：下载中 / 已完成 / 出错 */
  status: 'downloading' | 'completed' | 'error';
  /** 当前阶段（downloading_libraries 等） */
  step?: string;
  /** 当前处理中的文件相对路径 */
  file?: string;
  /** 下载速度（bytes/s） */
  speed?: number;
  /** 已完成文件数 */
  filesDone?: number;
  /** 文件总数 */
  filesTotal?: number;
  /** 错误信息（仅 status 为 error 时） */
  error?: string;
}

/**
 * 版本清单的本地缓存结构
 */
interface ManifestCache {
  /** 缓存的版本清单数据 */
  data: VersionManifest;
  /** 缓存时间戳 */
  timestamp: number;
}

const MANIFEST_CACHE_KEY = 's1yle_manifest_cache';
const MANIFEST_CACHE_DURATION = 5 * 60 * 1000; // 5分钟

const loadManifestFromCache = (): VersionManifest | null => {
  try {
    const cached = localStorage.getItem(MANIFEST_CACHE_KEY);
    if (cached) {
      const parsed: ManifestCache = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < MANIFEST_CACHE_DURATION) {
        return parsed.data;
      }
    }
  } catch {
  }
  return null;
};

const saveManifestToCache = (manifest: VersionManifest) => {
  try {
    const cache: ManifestCache = {
      data: manifest,
      timestamp: Date.now(),
    };
    localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
};

/**
 * 下载管理 Store 的内部接口
 *
 * 管理 Minecraft 版本的下载、部署、进度追踪等全流程。
 */
interface DownloadState {
  /** 版本清单（所有可用版本列表） */
  manifest: VersionManifest | null;
  /** 已安装的版本 ID 列表 */
  installedVersions: string[];
  /** 后台下载任务列表 */
  downloadTasks: DownloadTask[];
  /** 正在下载的各版本进度映射 */
  downloadingVersions: Map<string, VersionDownloadProgress>;
  /** 已完成的版本 ID 列表 */
  completedVersions: string[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 初始化 Store（加载清单、已安装版本、任务） */
  init: () => Promise<void>;
  /** 加载版本清单（含本地缓存） */
  loadManifest: () => Promise<void>;
  /** 加载已安装版本列表 */
  loadInstalledVersions: () => Promise<void>;
  /** 加载下载任务列表 */
  loadDownloadTasks: () => Promise<void>;
  /** 取消指定下载任务 */
  cancelDownloadTask: (taskId: string) => Promise<void>;
  /** 取消指定版本的整个部署下载 */
  cancelVersionDownloadAction: (versionId: string) => Promise<void>;
  /** 清空已完成的下载任务 */
  clearCompletedDownloadTasks: () => Promise<void>;
  /** 检查指定版本是否正在下载 */
  isVersionDownloading: (versionId: string) => boolean;
  /** 获取指定版本的下载进度 */
  getVersionProgress: (versionId: string) => number;
  /** 获取指定 MC 版本的 Fabric 加载器版本列表 */
  getFabricVersions: (mcVersion: string) => Promise<ModLoaderVersionList>;
  /** 获取指定 Fabric 加载器的详细信息 */
  getFabricVersionDetail: (mcVersion: string, loaderVersion: string) => Promise<FabricVersionDetail>;
  /** 构建 Fabric 启动配置 */
  buildFabricLaunchConfig: (mcVersion: string, loaderVersion: string, gameDir: string, assetsDir: string, username: string, uuid: string, accessToken?: string, javaPath?: string, memoryMb?: number) => Promise<ModLoaderInfo>;
  /** 开始追踪版本的下载进度 */
  startDownloadProgress: (versionId: string) => void;
  /** 更新版本的下载进度（字节级 + 步骤信息） */
  updateDownloadProgress: (
    versionId: string,
    progress: number,
    extra?: Partial<Pick<VersionDownloadProgress, 'step' | 'file' | 'speed' | 'filesDone' | 'filesTotal'>>,
  ) => void;
  /** 标记版本下载完成 */
  completeDownloadProgress: (versionId: string) => void;
  /** 标记版本下载出错 */
  errorDownloadProgress: (versionId: string, error: string) => void;
  /** 设置 Tauri 事件监听（download-progress / download-complete），返回清理函数 */
  setupEventListeners: () => () => void;
}

/**
 * 下载管理 Store
 *
 * 功能:
 * - 获取并缓存版本清单
 * - 已安装版本列表
 * - 下载任务管理（取消/清理）
 * - 进度追踪（启动/更新/完成/出错）
 * - 通过 Tauri 事件监听处理部署进度
 */
export const useDownloadStore = create<DownloadState>((set, get) => ({
  manifest: null,
  installedVersions: [],
  downloadTasks: [],
  downloadingVersions: new Map(),
  completedVersions: [],
  loading: false,
  error: null,

  init: async () => {
    const cachedManifest = loadManifestFromCache();
    if (cachedManifest) {
      set({ manifest: cachedManifest });
    }
    
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().loadManifest(),
        get().loadInstalledVersions(),
        get().loadDownloadTasks(),
      ]);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to init download store' });
    } finally {
      set({ loading: false });
    }
  },

  loadManifest: async () => {
    try {
      const manifest = await getVersionManifest();
      saveManifestToCache(manifest);
      set({ manifest });
    } catch {
    }
  },

  loadInstalledVersions: async () => {
    try {
      const versions = await getGameVersions();
      set({ installedVersions: versions });
    } catch {
    }
  },

  loadDownloadTasks: async () => {
    try {
      const tasks = await getDownloadTasks();
      set({ downloadTasks: tasks });
    } catch {
    }
  },

  isVersionDownloading: (versionId: string) => {
    const progress = get().downloadingVersions.get(versionId);
    return progress?.status === 'downloading';
  },

  getVersionProgress: (versionId: string) => {
    const progress = get().downloadingVersions.get(versionId);
    return progress?.progress ?? 0;
  },

  cancelDownloadTask: async (taskId: string) => {
    try {
      await cancelDownload(taskId);
      await get().loadDownloadTasks();
    } catch {
    }
  },

  cancelVersionDownloadAction: async (versionId: string) => {
    try {
      await cancelVersionDownload(versionId);
      set((prev) => {
        const newMap = new Map(prev.downloadingVersions);
        const entry = newMap.get(versionId);
        if (entry) {
          newMap.set(versionId, { ...entry, status: 'error', error: '已取消' });
        }
        return { downloadingVersions: newMap };
      });
    } catch {
    }
  },

  clearCompletedDownloadTasks: async () => {
    try {
      await clearCompletedTasks();
      await get().loadDownloadTasks();
    } catch {
    }
  },

  getFabricVersions: async (mcVersion: string) => {
    return getFabricVersions(mcVersion);
  },

  getFabricVersionDetail: async (mcVersion: string, loaderVersion: string) => {
    return getFabricVersionDetail(mcVersion, loaderVersion);
  },

  buildFabricLaunchConfig: async (mcVersion: string, loaderVersion: string, gameDir: string, assetsDir: string, username: string, uuid: string, accessToken?: string, javaPath?: string, memoryMb?: number) => {
    return buildFabricLaunchConfig(mcVersion, loaderVersion, gameDir, assetsDir, username, uuid, accessToken, javaPath, memoryMb);
  },

  startDownloadProgress: (versionId: string) => {
    set((prev) => {
      const newMap = new Map(prev.downloadingVersions);
      newMap.set(versionId, { versionId, progress: 0, status: 'downloading' });
      return { downloadingVersions: newMap };
    });
  },

  updateDownloadProgress: (
    versionId: string,
    progress: number,
    extra?: Partial<Pick<VersionDownloadProgress, 'step' | 'file' | 'speed' | 'filesDone' | 'filesTotal'>>,
  ) => {
    set((prev) => {
      const newMap = new Map(prev.downloadingVersions);
      const existing = newMap.get(versionId);
      if (existing) {
        newMap.set(versionId, { ...existing, progress, ...extra });
      }
      return { downloadingVersions: newMap };
    });
  },

  completeDownloadProgress: (versionId: string) => {
    set((prev) => {
      const newMap = new Map(prev.downloadingVersions);
      newMap.delete(versionId);
      return {
        downloadingVersions: newMap,
        completedVersions: [...prev.completedVersions, versionId]
      };
    });
  },

  errorDownloadProgress: (versionId: string, error: string) => {
    set((prev) => {
      const newMap = new Map(prev.downloadingVersions);
      newMap.set(versionId, { versionId, progress: 0, status: 'error', error });
      return { downloadingVersions: newMap };
    });
  },

  setupEventListeners: () => {
    const unlistenProgress = listen<any>('download-progress', (event) => {
      const {
        version_id,
        downloaded,
        total,
        phase,
        file,
        speed,
        files_done,
        files_total,
      } = event.payload;

      if (total > 0 && version_id) {
        const progress = (downloaded / total) * 100;
        get().updateDownloadProgress(version_id, progress, {
          step: phase,
          file,
          speed,
          filesDone: files_done,
          filesTotal: files_total,
        });
      }
    });

    const unlistenComplete = listen<any>('download-complete', (event) => {
      if (event.payload.status === 'success') {
        const versionId = event.payload.version_id;
        if (versionId) {
          get().completeDownloadProgress(versionId);
        }
        // 部署完成：统一刷新实例与已安装版本，保证列表/徽标/进度页一致
        void useInstanceStore.getState().refresh();
        void get().loadInstalledVersions();
      }
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  },
}));