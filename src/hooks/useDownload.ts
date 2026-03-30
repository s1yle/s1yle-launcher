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
    try {
      const progress = await downloadFile(version.url, `${version.id}.json`);
      logger.info('版本下载成功', version.id);
      await loadDownloadTasks();
      return progress;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '下载失败';
      setError(msg);
      logger.error('版本下载失败', msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadDownloadTasks]);

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
