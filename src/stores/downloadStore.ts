import { create } from 'zustand';
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
      const selectedInstance = instanceStore.getSelectedInstance();

      if (selectedInstance) {
        try {
          console.log('[downloadStore] 部署到实例:', selectedInstance.path);
          await deployVersionToInstance(selectedInstance.path, versionId);
          await instanceStore.refresh();
          console.log('[downloadStore] 部署成功');
        } catch (deployError) {
          console.error('[downloadStore] 部署失败:', deployError);
        }
      } else {
        console.log('[downloadStore] 未选中实例，跳过部署');
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
}));