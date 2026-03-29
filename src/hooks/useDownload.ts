import { useState, useEffect, useCallback } from 'react';
import {
  getVersionManifest,
  getGameVersions,
  downloadFile,
  getDownloadTasks,
  cancelDownload,
  clearCompletedTasks,
  getDownloadBasePath,
  VersionManifest,
  GameVersion,
  DownloadTask,
} from '../helper/rustInvoke';
import { logger } from '../helper/logger';

export const useDownload = () => {
  const [manifest, setManifest] = useState<VersionManifest | null>(null);
  const [installedVersions, setInstalledVersions] = useState<string[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [downloadPath, setDownloadPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    refreshAll,
    downloadVersion,
    cancelTask,
    clearCompleted,
    loadManifest,
    loadInstalledVersions,
    loadDownloadTasks,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};

export const getVersionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    release: '正式版',
    snapshot: '快照版',
    old_beta: '旧测试版',
    old_alpha: '旧Alpha版',
  };
  return labels[type] || type;
};

export const getVersionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    release: 'bg-green-500/20 text-green-400 border-green-500/30',
    snapshot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    old_beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    old_alpha: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};
