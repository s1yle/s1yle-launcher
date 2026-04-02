import { useState, useEffect, useCallback } from 'react';
import {
  scanInstances,
  createInstance,
  deleteInstance,
  copyInstance,
  renameInstance,
  updateInstance,
  getInstancesPath,
  GameInstance,
  ModLoaderType,
} from '../helper/rustInvoke';
import { logger } from '../helper/logger';

export interface UseInstancesReturn {
  instances: GameInstance[];
  selectedInstance: GameInstance | null;
  loading: boolean;
  error: string | null;
  instancesPath: string;
  selectInstance: (id: string) => void;
  createNewInstance: (
    name: string,
    version: string,
    loaderType: ModLoaderType,
    loaderVersion?: string
  ) => Promise<GameInstance>;
  removeInstance: (id: string, deleteFiles?: boolean) => Promise<void>;
  duplicateInstance: (id: string, newName: string) => Promise<GameInstance>;
  renameInstanceById: (id: string, newName: string) => Promise<GameInstance>;
  toggleInstance: (id: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useInstances = (): UseInstancesReturn => {
  const [instances, setInstances] = useState<GameInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instancesPath, setInstancesPath] = useState('');

  const loadInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scanInstances();
      setInstances(data);
      logger.info('实例列表加载成功', data.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载实例失败';
      setError(msg);
      logger.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstancesPath = useCallback(async () => {
    try {
      const path = await getInstancesPath();
      setInstancesPath(path);
    } catch (e) {
      logger.error('获取实例目录失败', e);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadInstances(), loadInstancesPath()]);
  }, [loadInstances, loadInstancesPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedInstance = selectedId
    ? instances.find((i) => i.id === selectedId) || null
    : null;

  const selectInstance = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const createNewInstance = useCallback(
    async (
      name: string,
      version: string,
      loaderType: ModLoaderType,
      loaderVersion?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const instance = await createInstance(
          name,
          version,
          loaderType,
          loaderVersion
        );
        await loadInstances();
        logger.info('创建实例成功', instance.name);
        return instance;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '创建实例失败';
        setError(msg);
        logger.error(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances]
  );

  const removeInstance = useCallback(
    async (id: string, deleteFiles: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        await deleteInstance(id, deleteFiles);
        if (selectedId === id) {
          setSelectedId(null);
        }
        await loadInstances();
        logger.info('删除实例成功', id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '删除实例失败';
        setError(msg);
        logger.error(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances, selectedId]
  );

  const duplicateInstance = useCallback(
    async (id: string, newName: string) => {
      setLoading(true);
      setError(null);
      try {
        const instance = await copyInstance(id, newName);
        await loadInstances();
        logger.info('复制实例成功', newName);
        return instance;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '复制实例失败';
        setError(msg);
        logger.error(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances]
  );

  const renameInstanceById = useCallback(
    async (id: string, newName: string) => {
      setLoading(true);
      setError(null);
      try {
        const instance = await renameInstance(id, newName);
        await loadInstances();
        logger.info('重命名实例成功', newName);
        return instance;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '重命名实例失败';
        setError(msg);
        logger.error(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances]
  );

  const toggleInstance = useCallback(
    async (id: string, enabled: boolean) => {
      setLoading(true);
      setError(null);
      try {
        await updateInstance(id, undefined, enabled);
        await loadInstances();
        logger.info('更新实例状态成功', { id, enabled });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '更新实例失败';
        setError(msg);
        logger.error(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances]
  );

  return {
    instances,
    selectedInstance,
    loading,
    error,
    instancesPath,
    selectInstance,
    createNewInstance,
    removeInstance,
    duplicateInstance,
    renameInstanceById,
    toggleInstance,
    refresh,
  };
};