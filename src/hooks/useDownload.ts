import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getVersionManifest,
  getGameVersions,
  downloadFile,
  getDownloadTasks,
  cancelDownload,
  clearCompletedTasks,
  getDownloadBasePath,
  getVersionDownloadManifest,
  deployVersionFiles,
  isVersionDeployed,
  getFabricVersions,
  buildFabricLaunchConfig,
  VersionManifest,
  GameVersion,
  DownloadTask,
  FileDownload,
  ModLoaderVersionList,
  ModLoaderInfo,
} from '../helper/rustInvoke';
import { logger } from '../helper/logger';

const CONCURRENT_LIMIT = 16;

export interface CategoryProgress {
  category: string;
  label: string;
  total: number;
  completed: number;
  failed: number;
  downloading: number;
  totalBytes: number;
  downloadedBytes: number;
  error?: string;
}

export interface DownloadItemState {
  id: string;
  filename: string;
  url: string;
  downloaded: number;
  total: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  sha1?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  client_jar: '客户端',
  libraries: '依赖库',
  asset_index: '资源索引',
  assets: '资源文件',
  natives: '原生库',
};

const CATEGORY_ORDER = ['client_jar', 'libraries', 'asset_index', 'assets', 'natives'];

export const useDownload = () => {
  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [installedVersions, setInstalledVersions] = useState<string[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [downloadPath, setDownloadPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadQueue, setDownloadQueue] = useState<DownloadItemState[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const abortRef = useRef(false);
  const categoryMapRef = useRef<Map<string, CategoryProgress>>(new Map());

  const loadManifest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVersionManifest();
      setManifest(data);
      logger.info('版本列表加载成功');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载版本列表失败';
      setError(msg);
      logger.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstalledVersions = useCallback(async () => {
    try {
      const versions = await getGameVersions();
      setInstalledVersions(versions);
      logger.info('已安装版本加载成功', versions);
    } catch (e) {
      logger.error('加载已安装版本失败', e);
    }
  }, []);

  const loadDownloadTasks = useCallback(async () => {
    try {
      const tasks = await getDownloadTasks();
      setDownloadTasks(tasks);
    } catch (e) {
      logger.error('加载下载任务失败', e);
    }
  }, []);

  const loadDownloadPath = useCallback(async () => {
    try {
      const path = await getDownloadBasePath();
      setDownloadPath(path);
    } catch (e) {
      logger.error('加载下载路径失败', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadManifest(),
      loadInstalledVersions(),
      loadDownloadTasks(),
      loadDownloadPath(),
    ]);
  }, [loadManifest, loadInstalledVersions, loadDownloadTasks, loadDownloadPath]);

  const initCategoryMap = useCallback((files: { file: FileDownload; category: string }[]) => {
    const map = new Map<string, CategoryProgress>();
    for (const { category, file } of files) {
      if (!map.has(category)) {
        map.set(category, {
          category,
          label: CATEGORY_LABELS[category] ?? category,
          total: 0,
          completed: 0,
          failed: 0,
          downloading: 0,
          totalBytes: 0,
          downloadedBytes: 0,
        });
      }
      const entry = map.get(category)!;
      entry.total++;
      entry.totalBytes += file.size;
    }
    categoryMapRef.current = map;
    setCategoryProgress(CATEGORY_ORDER
      .filter(c => map.has(c))
      .map(c => ({ ...map.get(c)! }))
      .concat([...map.values()].filter(e => !CATEGORY_ORDER.includes(e.category)).map(e => ({ ...e }))));
  }, []);

  const updateCategoryFromItem = useCallback((item: DownloadItemState) => {
    const cat = item.filename.split('/')[0];
    const entry = categoryMapRef.current.get(cat);
    if (!entry) return;
    if (item.status === 'completed') {
      entry.completed++;
      entry.downloadedBytes += item.downloaded;
      entry.downloading = Math.max(0, entry.downloading - 1);
    } else if (item.status === 'error') {
      entry.failed++;
      entry.downloading = Math.max(0, entry.downloading - 1);
      if (item.error && !entry.error) entry.error = item.error;
    } else if (item.status === 'downloading') {
      entry.downloading++;
    }
    setCategoryProgress(CATEGORY_ORDER
      .filter(c => categoryMapRef.current.has(c))
      .map(c => ({ ...categoryMapRef.current.get(c)! }))
      .concat([...categoryMapRef.current.values()].filter(e => !CATEGORY_ORDER.includes(e.category)).map(e => ({ ...e }))));
  }, []);

  const downloadVersion = useCallback(async (version: GameVersion) => {
    setError(null);
    setIsDownloading(true);
    abortRef.current = false;
    setDownloadQueue([]);
    setCategoryProgress([]);
    try {
      const manifest = await getVersionDownloadManifest(version.id);

      const files: { file: FileDownload; category: string }[] = [];
      if (manifest.client_jar) {
        files.push({ file: manifest.client_jar, category: 'client_jar' });
      }
      for (const lib of manifest.libraries) {
        files.push({ file: lib, category: 'libraries' });
      }
      if (manifest.asset_index) {
        files.push({ file: manifest.asset_index, category: 'asset_index' });
      }
      for (const asset of manifest.assets) {
        files.push({ file: asset, category: 'assets' });
      }
      for (const native of manifest.natives) {
        files.push({ file: native, category: 'natives' });
      }

      if (files.length === 0) {
        throw new Error('下载清单为空');
      }

      const queueItems: DownloadItemState[] = files.map(({ file }, index) => ({
        id: `${version.id}-${index}`,
        filename: file.path,
        url: file.url,
        downloaded: 0,
        total: file.size,
        status: 'pending',
        sha1: file.sha1 ?? undefined,
      }));
      setDownloadQueue(queueItems);
      initCategoryMap(files);

      const downloadOne = async (index: number): Promise<void> => {
        const { file } = files[index];
        try {
          setDownloadQueue(prev => {
            const next = [...prev];
            next[index] = { ...next[index], status: 'downloading' };
            return next;
          });

          const result = await downloadFile(file.url, file.path, file.sha1 ?? undefined, undefined, file.size);

          setDownloadQueue(prev => {
            const next = [...prev];
            next[index] = { ...next[index], status: 'completed', downloaded: result.total };
            return next;
          });
          updateCategoryFromItem({ ...queueItems[index], status: 'completed', downloaded: result.total });
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : '下载失败';
          setDownloadQueue(prev => {
            const next = [...prev];
            next[index] = { ...next[index], status: 'error', error: errorMsg };
            return next;
          });
          updateCategoryFromItem({ ...queueItems[index], status: 'error', error: errorMsg });
          throw new Error(`${file.path}: ${errorMsg}`);
        }
      };

      for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
        if (abortRef.current) break;
        const results = await Promise.allSettled(
          Array.from({ length: Math.min(CONCURRENT_LIMIT, files.length - i) }, (_, j) => downloadOne(i + j))
        );

        const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        if (firstError) {
          const errorMsg = firstError.reason instanceof Error ? firstError.reason.message : String(firstError.reason);
          setError(errorMsg);
          logger.error('版本下载失败', { versionId: version.id, error: errorMsg });
          throw new Error(errorMsg);
        }
      }

      await deployVersionFiles(version.id);
      logger.info('版本下载并部署成功', version.id);
      await loadInstalledVersions();
      await loadDownloadTasks();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '下载失败';
      if (!error) {
        setError(msg);
      }
      logger.error('版本下载失败', { versionId: version.id, error: msg });
      throw e;
    } finally {
      setIsDownloading(false);
    }
  }, [loadInstalledVersions, loadDownloadTasks, initCategoryMap, updateCategoryFromItem]);

  const cancelDownloadVersion = useCallback(() => {
    abortRef.current = true;
  }, []);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      await cancelDownload(taskId);
      logger.info('下载任务已取消', taskId);
      await loadDownloadTasks();
    } catch (e) {
      logger.error('取消下载失败', e);
      throw e;
    }
  }, [loadDownloadTasks]);

  const clearCompleted = useCallback(async () => {
    try {
      await clearCompletedTasks();
      logger.info('已完成任务已清理');
      await loadDownloadTasks();
    } catch (e) {
      logger.error('清理任务失败', e);
      throw e;
    }
  }, [loadDownloadTasks]);

  const checkVersionDeployed = useCallback(async (versionId: string): Promise<boolean> => {
    try {
      return await isVersionDeployed(versionId);
    } catch (e) {
      logger.error('检查版本部署状态失败', e);
      return false;
    }
  }, []);

  const getVersionDownloadList = useCallback(async (versionId: string): Promise<FileDownload[]> => {
    try {
      const manifest = await getVersionDownloadManifest(versionId);
      const files: FileDownload[] = [];
      
      if (manifest.client_jar) {
        files.push(manifest.client_jar);
      }
      files.push(...manifest.libraries);
      files.push(...manifest.assets);
      
      return files;
    } catch (e) {
      logger.error('获取版本下载列表失败', e);
      throw e;
    }
  }, []);

  const getFabricLoaderVersions = useCallback(async (mcVersion: string): Promise<ModLoaderVersionList> => {
    try {
      return await getFabricVersions(mcVersion);
    } catch (e) {
      logger.error('获取 Fabric 版本列表失败', e);
      throw e;
    }
  }, []);

  const buildFabricConfig = useCallback(async (
    mcVersion: string,
    loaderVersion: string,
    gameDir: string,
    assetsDir: string,
    username: string,
    uuid: string
  ): Promise<ModLoaderInfo> => {
    try {
      return await buildFabricLaunchConfig(
        mcVersion,
        loaderVersion,
        gameDir,
        assetsDir,
        username,
        uuid
      );
    } catch (e) {
      logger.error('构建 Fabric 配置失败', e);
      throw e;
    }
  }, []);

  const startDownloadQueue = useCallback(async (items: DownloadItemState[]) => {
    setDownloadQueue(items);
    setIsDownloading(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      setDownloadQueue(prev => prev.map((d, idx) => 
        idx === i ? { ...d, status: 'downloading' } : d
      ));

      try {
        const result = await downloadFile(item.url, item.filename, item.sha1, undefined, item.total);
        
        setDownloadQueue(prev => prev.map((d, idx) => 
          idx === i ? { ...d, status: 'completed', downloaded: result.total } : d
        ));
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '下载失败';
        setDownloadQueue(prev => prev.map((d, idx) => 
          idx === i ? { ...d, status: 'error', error: errorMsg } : d
        ));
      }
    }

    setIsDownloading(false);
  }, []);

  const deployVersion = useCallback(async (versionId: string) => {
    try {
      await deployVersionFiles(versionId);
      logger.info('版本部署成功', versionId);
      await loadInstalledVersions();
    } catch (e) {
      logger.error('版本部署失败', e);
      throw e;
    }
  }, [loadInstalledVersions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    manifest,
    installedVersions,
    downloadTasks,
    downloadPath,
    loading,
    error,
    downloadQueue,
    categoryProgress,
    isDownloading,
    refreshAll,
    downloadVersion,
    cancelDownloadVersion,
    cancelTask,
    clearCompleted,
    loadManifest,
    loadInstalledVersions,
    loadDownloadTasks,
    checkVersionDeployed,
    getVersionDownloadList,
    getFabricLoaderVersions,
    buildFabricConfig,
    startDownloadQueue,
    deployVersion,
  };
};

export { formatFileSize, formatDate, getVersionTypeLabel, getVersionTypeColor } from '../utils/format';
