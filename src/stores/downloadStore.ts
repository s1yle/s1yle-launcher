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
  getDownloadBasePath,
  setDownloadBasePath,
  getFabricVersions,
  getFabricVersionDetail,
  buildFabricLaunchConfig,
} from '../helper/rustInvoke';
import type {
  VersionManifest,
  DownloadTask,
  ModLoaderVersionList,
  FabricVersionDetail,
  ModLoaderInfo,
} from '../helper/rustInvoke';

interface DownloadCategoryProgress {
  category: string;
  total: number;
  completed: number;
  current: string;
  progress: number;
}

interface DownloadState {
  manifest: VersionManifest | null;
  installedVersions: string[];
  downloadTasks: DownloadTask[];
  isDownloading: boolean;
  downloadQueue: string[];
  categoryProgress: DownloadCategoryProgress[];
  overallProgress: number;
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
  setIsDownloading: (downloading: boolean) => void;
  setCategoryProgress: (progress: DownloadCategoryProgress[]) => void;
  setOverallProgress: (progress: number) => void;
  getFabricVersions: (mcVersion: string) => Promise<ModLoaderVersionList>;
  getFabricVersionDetail: (mcVersion: string, loaderVersion: string) => Promise<FabricVersionDetail>;
  buildFabricLaunchConfig: (mcVersion: string, loaderVersion: string, gameDir: string, assetsDir: string, username: string, uuid: string, accessToken?: string, javaPath?: string, memoryMb?: number) => Promise<ModLoaderInfo>;
}

const CONCURRENT_LIMIT = 16;

export const useDownloadStore = create<DownloadState>((set, get) => ({
  manifest: null,
  installedVersions: [],
  downloadTasks: [],
  isDownloading: false,
  downloadQueue: [],
  categoryProgress: [],
  overallProgress: 0,
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
      // keep existing
    }
  },

  loadInstalledVersions: async () => {
    try {
      const versions = await getGameVersions();
      set({ installedVersions: versions });
    } catch {
      // keep existing
    }
  },

  loadDownloadTasks: async () => {
    try {
      const tasks = await getDownloadTasks();
      set({ downloadTasks: tasks });
    } catch {
      // keep existing
    }
  },

  loadBasePath: async () => {
    try {
      const path = await getDownloadBasePath();
      set({ basePath: path });
    } catch {
      // keep existing
    }
  },

  setBasePath: async (path: string) => {
    try {
      await setDownloadBasePath(path);
      set({ basePath: path });
    } catch {
      // keep existing
    }
  },

  downloadVersion: async (versionId: string) => {
    const state = get();
    if (state.isDownloading) return;

    set({ isDownloading: true, error: null, categoryProgress: [], overallProgress: 0 });

    try {
      const manifest = await getVersionDownloadManifest(versionId);
      const allFiles = [
        ...(manifest.client_jar ? [manifest.client_jar] : []),
        ...manifest.libraries,
        ...manifest.assets,
        ...manifest.natives,
        ...(manifest.asset_index ? [manifest.asset_index] : []),
      ];

      const categories = [
        { name: 'client_jar', files: manifest.client_jar ? [manifest.client_jar] : [] },
        { name: 'libraries', files: manifest.libraries },
        { name: 'assets', files: manifest.assets },
        { name: 'natives', files: manifest.natives },
        { name: 'asset_index', files: manifest.asset_index ? [manifest.asset_index] : [] },
      ].filter(c => c.files.length > 0);

      const totalFiles = allFiles.length;
      let completedFiles = 0;

      const updateProgress = () => {
        const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
        set({ overallProgress: progress });
      };

      const downloadWithRetry = async (file: { url: string; sha1: string | null; size: number; path: string }, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await downloadFile(file.url, file.path, file.sha1 || undefined, false);
            completedFiles++;
            updateProgress();
            return;
          } catch {
            if (i === maxRetries - 1) throw new Error(`Failed to download ${file.url}`);
          }
        }
      };

      const processCategory = async (category: { name: string; files: typeof allFiles }) => {
        const catProgress: DownloadCategoryProgress = {
          category: category.name,
          total: category.files.length,
          completed: 0,
          current: '',
          progress: 0,
        };

        set(prev => ({
          categoryProgress: [...prev.categoryProgress.filter(c => c.category !== category.name), catProgress],
        }));

        const chunks: typeof allFiles[] = [];
        for (let i = 0; i < category.files.length; i += CONCURRENT_LIMIT) {
          chunks.push(category.files.slice(i, i + CONCURRENT_LIMIT));
        }

        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (file) => {
              set(prev => ({
                categoryProgress: prev.categoryProgress.map(c =>
                  c.category === category.name
                    ? { ...c, current: file.path.split('/').pop() || file.path }
                    : c,
                ),
              }));
              await downloadWithRetry(file);
              set(prev => ({
                categoryProgress: prev.categoryProgress.map(c =>
                  c.category === category.name
                    ? { ...c, completed: c.completed + 1, progress: ((c.completed + 1) / c.total) * 100 }
                    : c,
                ),
              }));
            }),
          );
        }
      };

      for (const category of categories) {
        if (category.files.length > 0) {
          await processCategory(category);
        }
      }

      set({ isDownloading: false, overallProgress: 100 });
    } catch (e) {
      set({
        isDownloading: false,
        error: e instanceof Error ? e.message : 'Download failed',
      });
    }
  },

  deployVersion: async (versionId: string) => {
    try {
      await deployVersionFiles(versionId);
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
      // keep existing
    }
  },

  clearCompletedDownloadTasks: async () => {
    try {
      await clearCompletedTasks();
      await get().loadDownloadTasks();
    } catch {
      // keep existing
    }
  },

  setIsDownloading: (downloading: boolean) => {
    set({ isDownloading: downloading });
  },

  setCategoryProgress: (progress: DownloadCategoryProgress[]) => {
    set({ categoryProgress: progress });
  },

  setOverallProgress: (progress: number) => {
    set({ overallProgress: progress });
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
