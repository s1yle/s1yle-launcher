import { useState, useEffect, useCallback } from 'react';
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

export const useDownload = () => {
  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [installedVersions, setInstalledVersions] = useState<string[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [downloadPath, setDownloadPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadQueue, setDownloadQueue] = useState<DownloadItemState[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const downloadVersion = useCallback(async (version: GameVersion) => {
    setLoading(true);
    setError(null);
    setIsDownloading(true);
    setDownloadQueue([]);
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

      let completedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];

        setDownloadQueue(prev => prev.map((d, idx) =>
          idx === i ? { ...d, status: 'downloading' } : d
        ));

        try {
          const result = await downloadFile(file.url, file.path, file.sha1 ?? undefined);

          setDownloadQueue(prev => prev.map((d, idx) =>
            idx === i ? { ...d, status: 'completed', downloaded: result.total } : d
          ));
          completedCount++;
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : '下载失败';
          setDownloadQueue(prev => prev.map((d, idx) =>
            idx === i ? { ...d, status: 'error', error: errorMsg } : d
          ));
          setError(`文件下载失败: ${file.path} - ${errorMsg}`);
          logger.error('版本下载失败', { versionId: version.id, file: file.path, error: errorMsg });
          throw e;
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
      setLoading(false);
      setIsDownloading(false);
    }
  }, [loadInstalledVersions, loadDownloadTasks]);

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
        const result = await downloadFile(item.url, item.filename, item.sha1);
        
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
    isDownloading,
    refreshAll,
    downloadVersion,
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
