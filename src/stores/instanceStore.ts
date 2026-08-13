import { create } from 'zustand';
import {
  createGame,
  deleteGame,
  renameGame,
  updateGame,
  updateGameSettings,
  getGameRoot,
  scanGames,
} from '../helper/rustInvoke';
import type { GameInstance, GameSettings } from '../helper/rustInvoke';
import { ModLoaderType } from '../helper/rustInvoke';

const STORAGE_KEY_INSTANCE = 's1yle-selected-instance';

// 获取 localstorage 存储的 Instace ID
function getSavedInstanceId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_INSTANCE) || null; }
  catch { return null; }
}

// 使用 localstorage 存储 Instace ID
function saveInstanceId(id: string | null) {
  try { localStorage.setItem(STORAGE_KEY_INSTANCE, id || ''); }
  catch { /* storage not available */ }
}

/**
 * 实例管理 Store 的内部接口
 *
 * 管理 Minecraft 游戏实例（GameInstance）的 CRUD 和本地持久化选中状态。
 */
interface InstanceState {
  /** 所有游戏实例列表 */
  instances: GameInstance[];
  /** 当前选中的实例 ID（持久化到 localStorage） */
  selectedInstanceId: string | null;
  /** 当前选中的侧边栏项 ID */
  selectedSidebarItemId: string | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 实例搜索关键词 */
  searchQuery: string;
  /** 视图模式：网格或列表 */
  viewMode: 'grid' | 'list';
  /** 实例所在的基础路径 */
  instancesPath: string;

  /** 初始化 Store（加载实例、路径配置、恢复选中状态） */
  init: () => Promise<void>;
  /** 刷新实例列表和路径 */
  refresh: () => Promise<void>;
  /** 选中实例（同时持久化到 localStorage） */
  setSelectedInstance: (id: string | null) => void;
  /** 选中侧边栏项 */
  setSelectedSidebarItem: (id: string | null) => void;
  /** 根据 ID 获取实例 */
  getInstance: (id: string) => GameInstance | null;
  /** 创建新实例 */
  createNew: (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => Promise<void>;
  /** 删除指定实例 */
  remove: (id: string) => Promise<void>;
  /** 复制实例 */
  duplicate: (id: string, newName: string) => Promise<void>;
  /** 重命名实例 */
  rename: (id: string, newName: string) => Promise<void>;
  /** 启用/禁用实例 */
  toggle: (id: string, enabled: boolean) => Promise<void>;
  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 设置视图模式（grid / list） */
  setViewMode: (mode: 'grid' | 'list') => void;
  /** 根据当前搜索条件获取过滤后的实例列表 */
  getFilteredInstances: () => GameInstance[];
  /** 获取当前选中的实例对象 */
  getSelectedInstance: () => GameInstance | null;
}

/**
 * 实例管理 Store
 *
 * 功能:
 * - 管理 Minecraft 游戏实例的全生命周期（创建/删除/复制/重命名/启用/禁用）
 * - 维护选中实例持久化（localStorage）
 * - 支持按名称/版本 ID 搜索
 */
export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  selectedInstanceId: null,
  selectedSidebarItemId: null,
  loading: false,
  error: null,
  searchQuery: '',
  viewMode: 'grid',
  instancesPath: '',

  init: async () => {
    set({ loading: true, error: null });
    try {
      console.log('[instanceStore.init] 开始初始化...');
      
      const [instancesPath, instances] = await Promise.all([
        getGameRoot(),
        scanGames(),
      ]);

      console.log('[instanceStore.init] 加载的数据:', {
        instancesPath,
        instances: instances.length,
      });

      const savedInstanceId = getSavedInstanceId();
      const validInstanceId = savedInstanceId && instances.find(i => i.id === savedInstanceId)
        ? savedInstanceId
        : instances[0]?.id ?? null;

      console.log('[instanceStore.init] 实例选择:', { savedInstanceId, validInstanceId });

      set({
        instances,
        instancesPath,
        selectedInstanceId: validInstanceId,
      });
      
      console.log('[instanceStore.init] 初始化完成');
    } catch (e) {
      console.error('[instanceStore.init] 初始化失败:', e);
      set({ error: e instanceof Error ? e.message : 'Failed to load instances' });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      const [instances, path] = await Promise.all([
        scanGames(),
        getGameRoot(),
      ]);
      set({ instances, instancesPath: path });
      
      const selectedId = get().selectedInstanceId;
      if (selectedId && !instances.find(i => i.id === selectedId)) {
        if (instances.length > 0) {
          set({ selectedInstanceId: instances[0].id });
          saveInstanceId(instances[0].id);
        } else {
          set({ selectedInstanceId: null });
          saveInstanceId(null);
        }
      }
    } catch {
      // keep existing
    }
  },

  setSelectedInstance: (id: string | null) => {
    set({ selectedInstanceId: id });
    saveInstanceId(id);
  },

  getInstance: (id: string) => {
    const { instances } = get();
    return instances.find(i => i.id === id) || null;
  },

  setSelectedSidebarItem: (id: string | null) => {
    set({ selectedSidebarItemId: id });
  },

  createNew: async (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => {
    try {
      const instance = await createGame(name, version, loaderType || ModLoaderType.Vanilla, loaderVersion, iconPath);
      await get().refresh();
      set({ selectedInstanceId: instance.id });
      saveInstanceId(instance.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create instance' });
      throw e;
    }
  },

  remove: async (id: string) => {
    try {
      const { instances } = get();
      const game = instances.find(i => i.id === id);
      await deleteGame(game?.name ?? id, true);
      const { selectedInstanceId } = get();
      await get().refresh();
      if (id === selectedInstanceId) {
        const newList = instances.filter(i => i.id !== id);
        if (newList.length > 0) {
          set({ selectedInstanceId: newList[0].id });
          saveInstanceId(newList[0].id);
        } else {
          set({ selectedInstanceId: null });
          saveInstanceId(null);
        }
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete instance' });
      throw e;
    }
  },

  duplicate: async (id: string, newName: string) => {
    try {
      const { instances } = get();
      const source = instances.find(i => i.id === id);
      if (!source) {
        throw new Error('源实例不存在');
      }
      const instance = await createGame(
        newName,
        source.version_id,
        source.loader_type as ModLoaderType,
        source.loader_version ?? undefined,
        source.icon_path ?? undefined
      );
      const settings: GameSettings = source.game_settings ?? {};
      await updateGameSettings(instance.name, settings).catch(() => undefined);
      await get().refresh();
      set({ selectedInstanceId: instance.id });
      saveInstanceId(instance.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to duplicate instance' });
      throw e;
    }
  },

  rename: async (id: string, newName: string) => {
    try {
      const { instances } = get();
      const game = instances.find(i => i.id === id);
      await renameGame(game?.name ?? id, newName);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to rename instance' });
      throw e;
    }
  },

  toggle: async (id: string, enabled: boolean) => {
    try {
      const { instances } = get();
      const game = instances.find(i => i.id === id);
      await updateGame(game?.name ?? id, undefined, enabled);
      await get().refresh();
    } catch {
      // keep existing
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setViewMode: (mode: 'grid' | 'list') => {
    set({ viewMode: mode });
  },

  getFilteredInstances: () => {
    const { instances, searchQuery } = get();
    let filtered = instances;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.version_id.toLowerCase().includes(q),
      );
    }

    return filtered;
  },

  getSelectedInstance: () => {
    const { instances, selectedInstanceId } = get();
    if (!selectedInstanceId) return null;
    return instances.find(i => i.id === selectedInstanceId) || null;
  },
}));
