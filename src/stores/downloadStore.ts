import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';
import {
  getVersionManifest,
  getVersionDownloadManifest,
  downloadFile,
  deployVersionFiles,
  getDownloadTasks,
  cancelDownload,
  clearCompletedTasks,
  getGameVersions,
  getPathConfig,
  setDownloadBasePath,
  getFabricVersions,
  getFabricVersionDetail,
  buildFabricLaunchConfig,
  deployVersionToInstance,
  createInstance,
  ModLoaderType,
} from '../helper/rustInvoke';
import { useInstanceStore } from './instanceStore';
import type {
  VersionManifest,
  DownloadTask,
  ModLoaderVersionList,
  FabricVersionDetail,
  ModLoaderInfo,
} from '../helper/rustInvoke';

interface VersionDownloadProgress {
  versionId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}

interface ManifestCache {
  data: VersionManifest;
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

interface DownloadState {
  manifest: VersionManifest | null;
  installedVersions: string[];
  downloadTasks: DownloadTask[];
  downloadingVersions: Map<string, VersionDownloadProgress>;
  completedVersions: string[];
  basePath: string;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  loadManifest: () => Promise<void>;
  loadInstalledVersions: () => Promise<void>;
  loadDownloadTasks: () => Promise<void>;
  loadBasePath: () => Promise<void>;
  setBasePath: (path: string) => Promise<void>;
  downloadVersion: (versionId: string) => Promise<void>;
  deployVersion: (versionId: string) => Promise<void>;
  cancelDownloadTask: (taskId: string) => Promise<void>;
  clearCompletedDownloadTasks: () => Promise<void>;
  isVersionDownloading: (versionId: string) => boolean;
  getVersionProgress: (versionId: string) => number;
  getFabricVersions: (mcVersion: string) => Promise<ModLoaderVersionList>;
  getFabricVersionDetail: (mcVersion: string, loaderVersion: string) => Promise<FabricVersionDetail>;
  buildFabricLaunchConfig: (mcVersion: string, loaderVersion: string, gameDir: string, assetsDir: string, username: string, uuid: string, accessToken?: string, javaPath?: string, memoryMb?: number) => Promise<ModLoaderInfo>;
  startDownloadProgress: (versionId: string) => void;
  updateDownloadProgress: (versionId: string, progress: number) => void;
  completeDownloadProgress: (versionId: string) => void;
  errorDownloadProgress: (versionId: string, error: string) => void;
  setupEventListeners: () => () => void;
}

const CONCURRENT_LIMIT = 16;

export const useDownloadStore = create<DownloadState>((set, get) => ({
  manifest: null,
  installedVersions: [],
  downloadTasks: [],
  downloadingVersions: new Map(),
  completedVersions: [],
  basePath: '',
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
        get().loadBasePath(),
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

  loadBasePath: async () => {
    try {
      const pathConfig = await getPathConfig();
      set({ basePath: pathConfig.download_base_path });
    } catch {
    }
  },

  setBasePath: async (path: string) => {
    try {
      await setDownloadBasePath(path);
      set({ basePath: path });
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

  downloadVersion: async (versionId: string) => {
    const state = get();
    if (state.downloadingVersions.has(versionId)) {
      console.log('[downloadStore] 版本已在下载中:', versionId);
      return;
    }

    set(prev => {
      const newMap = new Map(prev.downloadingVersions);
      newMap.set(versionId, { versionId, progress: 0, status: 'downloading' });
      return { downloadingVersions: newMap };
    });

    try {
      const manifest = await getVersionDownloadManifest(versionId);
      const allFiles = [
        ...(manifest.client_jar ? [manifest.client_jar] : []),
        ...manifest.libraries,
        ...manifest.assets,
        ...manifest.natives,
        ...(manifest.asset_index ? [manifest.asset_index] : []),
      ];

      const totalFiles = allFiles.length;
      let completedFiles = 0;

      const updateProgress = () => {
        const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
        set(prev => {
          const newMap = new Map(prev.downloadingVersions);
          const existing = newMap.get(versionId);
          if (existing) {
            newMap.set(versionId, { ...existing, progress });
          }
          return { downloadingVersions: newMap };
        });
      };

      const downloadWithRetry = async (file: { url: string; sha1: string | null; size: number; path: string }, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await downloadFile(versionId, file.url, file.path, file.sha1 ?? undefined, undefined, file.size);
            completedFiles++;
            updateProgress();
            return;
          } catch {
            if (i === maxRetries - 1) throw new Error(`Failed to download ${file.url}`);
          }
        }
      };

      const chunks: typeof allFiles[] = [];
      for (let i = 0; i < allFiles.length; i += CONCURRENT_LIMIT) {
        chunks.push(allFiles.slice(i, i + CONCURRENT_LIMIT));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(file => downloadWithRetry(file)));
      }

      const instanceStore = useInstanceStore.getState();
      let selectedInstance = instanceStore.getSelectedInstance();

      if (!selectedInstance) {
        const instances = instanceStore.instances;
        if (instances.length > 0) {
          selectedInstance = instances[0];
          console.log('[downloadStore] 使用第一个实例:', selectedInstance.name, '路径:', selectedInstance.path);
        } else {
          console.log('[downloadStore] 无可用实例，尝试使用默认实例路径');
          
          const pathConfig = await getPathConfig();
          const minecraftBasePath = pathConfig.daemon_base_path;
          const defaultInstanceName = 'default';
          const defaultInstancePath = `${minecraftBasePath}/${defaultInstanceName}`;
          
          console.log('[downloadStore] 默认实例路径:', defaultInstancePath);
          
          // 确保默认实例目录存在
          try {
            await createInstance(
              defaultInstanceName,
              versionId,
              ModLoaderType.Vanilla,
              undefined,
              undefined
            );
            await instanceStore.refresh();
            
            const refreshedInstances = instanceStore.instances;
            if (refreshedInstances.length > 0) {
              selectedInstance = refreshedInstances.find(i => i.name === defaultInstanceName) || refreshedInstances[0];
              console.log('[downloadStore] 创建并获取默认实例成功:', selectedInstance?.name);
            }
          } catch (createError) {
            console.error('[downloadStore] 创建默认实例失败:', createError);
            
            selectedInstance = {
              id: 'default',
              name: defaultInstanceName,
              version_id: versionId,
              loader_type: ModLoaderType.Vanilla,
              loader_version: null,
              path: defaultInstancePath,
              icon_path: null,
              last_played: null,
              created_at: Date.now(),
              enabled: true,
            };
            console.log('[downloadStore] 使用虚拟默认实例');
          }
        }
      }

      if (selectedInstance) {
        try {
          console.log('[downloadStore] 部署到实例:', selectedInstance.path, '版本:', versionId);
          await deployVersionToInstance(selectedInstance.path, versionId);
          await instanceStore.refresh();
          console.log('[downloadStore] 部署成功');
        } catch (deployError) {
          console.error('[downloadStore] 部署失败:', deployError);
        }
      }

      await get().loadInstalledVersions();

      set(prev => {
        const newMap = new Map(prev.downloadingVersions);
        newMap.delete(versionId);
        return {
          downloadingVersions: newMap,
          completedVersions: [...prev.completedVersions, versionId],
        };
      });
    } catch (e) {
      set(prev => {
        const newMap = new Map(prev.downloadingVersions);
        newMap.set(versionId, { versionId, progress: 0, status: 'error', error: e instanceof Error ? e.message : 'Download failed' });
        return { downloadingVersions: newMap };
      });
    }
  },

  deployVersion: async (versionId: string) => {
    try {
      const instanceStore = useInstanceStore.getState();
      const selectedInstance = instanceStore.getSelectedInstance();

      if (selectedInstance) {
        await deployVersionFiles(versionId, selectedInstance.path);
        await instanceStore.refresh();
      }

      await get().loadInstalledVersions();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Deploy failed' });
    }
  },

  cancelDownloadTask: async (taskId: string) => {
    try {
      await cancelDownload(taskId);
      await get().loadDownloadTasks();
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

  updateDownloadProgress: (versionId: string, progress: number) => {
    set((prev) => {
      const newMap = new Map(prev.downloadingVersions);
      const existing = newMap.get(versionId);
      if (existing) {
        newMap.set(versionId, { ...existing, progress });
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
    const unlistenProgress = listen<any>('deploy-progress', (event) => {
      const { current, total, version_id } = event.payload;

      if (total > 0 && version_id) {
        const progress = (current / total) * 100;
        get().updateDownloadProgress(version_id, progress);
      }
    });

    const unlistenComplete = listen<any>('deploy-complete', (event) => {
      if (event.payload.status === 'success') {
        const versionId = event.payload.version_id;
        if (versionId) {
          get().completeDownloadProgress(versionId);
        }
      }
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  },
}));