import { create } from 'zustand';
import {
  scanInstances,
  createInstance,
  deleteInstance,
  copyInstance,
  renameInstance,
  updateInstance,
  getInstancesPath,
  scanKnownMcPaths,
  addKnownPath,
  removeKnownPath,
  setDefaultFolder,
  getPathConfig,
} from '../helper/rustInvoke';
import type { GameInstance, KnownPath, PathConfig } from '../helper/rustInvoke';
import { ModLoaderType } from '../helper/rustInvoke';

const STORAGE_KEY_FOLDER = 's1yle-selected-folder';
const STORAGE_KEY_INSTANCE = 's1yle-selected-instance';

// 获取 localstorage 存储的 Game Folder ID
function getSavedFolderId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_FOLDER) || null; }
  catch { return null; }
}

// 使用 localstorage 存储 Game Folder ID
function saveFolderId(id: string | null) {
  try { localStorage.setItem(STORAGE_KEY_FOLDER, id || ''); }
  catch { /* storage not available */ }
}

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
 * 管理 Minecraft 游戏实例（GameInstance）的 CRUD，支持多 Game Folder 和本地持久化选中状态。
 */
interface InstanceState {
  /** 所有游戏实例列表 */
  instances: GameInstance[];
  /** 已扫描到的所有 Game Folder */
  knownFolders: KnownPath[];
  /** 当前选中的 Game Folder ID（持久化到 localStorage） */
  selectedFolderId: string | null;
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
  /** 路径配置信息 */
  pathConfig: PathConfig | null;

  /** 初始化 Store（加载实例、已知文件夹、路径配置、恢复选中状态） */
  init: () => Promise<void>;
  /** 刷新实例列表和路径 */
  refresh: () => Promise<void>;
  /** 刷新已知 Game Folder 列表 */
  refreshKnownFolders: () => Promise<void>;
  /** 添加新的 Game Folder */
  addKnownFolder: (path: string) => Promise<void>;
  /** 移除指定的 Game Folder */
  removeKnownFolder: (id: string) => Promise<void>;
  /** 设为默认 Game Folder */
  setDefaultFolder: (id: string) => Promise<void>;
  /** 选中 Game Folder（同时持久化到 localStorage） */
  setSelectedFolder: (id: string | null) => Promise<void>;
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
  /** 根据当前搜索和文件夹筛选条件获取过滤后的实例列表 */
  getFilteredInstances: () => GameInstance[];
  /** 获取当前选中的实例对象 */
  getSelectedInstance: () => GameInstance | null;
}

/**
 * 实例管理 Store
 *
 * 功能:
 * - 管理 Minecraft 游戏实例的全生命周期（创建/删除/复制/重命名/启用/禁用）
 * - 管理 Game Folder 扫描和选择
 * - 维护选中实例持久化（localStorage）
 * - 支持按名称/版本 ID 搜索和按文件夹过滤
 */
export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  knownFolders: [],
  selectedFolderId: null,
  selectedInstanceId: null,
  selectedSidebarItemId: null,
  loading: false,
  error: null,
  searchQuery: '',
  viewMode: 'grid',
  instancesPath: '',
  pathConfig: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      console.log('[instanceStore.init] 开始初始化...');
      
      const [pathConfig, instances, knownFolders] = await Promise.all([
        getPathConfig(),
        scanInstances(),
        scanKnownMcPaths(),
      ]);

      console.log('[instanceStore.init] 加载的数据:', {
        pathConfig,
        instances: instances.length,
        knownFolders: knownFolders.length,
      });

      const savedFolderId = getSavedFolderId();
      const defaultFolderId = savedFolderId && knownFolders.find(f => f.id === savedFolderId)
        ? savedFolderId
        : knownFolders.find(f => f.is_default)?.id ?? knownFolders[0]?.id ?? null;

      console.log('[instanceStore.init] 文件夹选择:', { savedFolderId, defaultFolderId });

      const savedInstanceId = getSavedInstanceId();
      const validInstanceId = savedInstanceId && instances.find(i => i.id === savedInstanceId)
        ? savedInstanceId
        : instances[0]?.id ?? null;

      console.log('[instanceStore.init] 实例选择:', { savedInstanceId, validInstanceId });

      set({
        instances,
        instancesPath: pathConfig.daemon_base_path,
        pathConfig,
        knownFolders,
        selectedFolderId: defaultFolderId,
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
        scanInstances(),
        getInstancesPath(),
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

  refreshKnownFolders: async () => {
    try {
      const knownFolders = await scanKnownMcPaths();
      set({ knownFolders });
    } catch {
      // keep existing
    }
  },

  // 添加 Game Folder
  addKnownFolder: async (path: string) => {
    try {
      const folder = await addKnownPath(path);
      set(prev => ({
        knownFolders: [...prev.knownFolders, folder],
        selectedFolderId: folder.id,
      }));
      saveFolderId(folder.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to add folder' });
      throw e;
    }
  },

  // 删除 Game Folder
  removeKnownFolder: async (id: string) => {
    try {
      await removeKnownPath(id);
      const { knownFolders, selectedFolderId } = get();
      const remainingFolders = knownFolders.filter(f => f.id !== id);
      
      let newSelectedId = selectedFolderId;
      if (selectedFolderId === id) {
        newSelectedId = remainingFolders[0]?.id ?? null;
        if (newSelectedId) {
          saveFolderId(newSelectedId);
        }
      }
      
      set({
        knownFolders: remainingFolders,
        selectedFolderId: newSelectedId,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to remove folder' });
      throw e;
    }
  },

  // 设为默认 Game Folder
  setDefaultFolder: async (id: string) => {
    try {
      await setDefaultFolder(id);
      set(prev => ({
        knownFolders: prev.knownFolders.map(f => ({
          ...f,
          is_default: f.id === id,
        })),
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to set default folder' });
      throw e;
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

  setSelectedFolder: async (id: string | null) => {
    set({ selectedFolderId: id });
    saveFolderId(id);
    if (id) {
      try {
        await setDefaultFolder(id);
        set(prev => ({
          knownFolders: prev.knownFolders.map(f => ({
            ...f,
            is_default: f.id === id,
          })),
        }));
      } catch { }
    }
  },

  createNew: async (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => {
    try {
      const instance = await createInstance(name, version, loaderType || ModLoaderType.Vanilla, loaderVersion, iconPath);
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
      await deleteInstance(id, true);
      const { selectedInstanceId, instances } = get();
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
      const instance = await copyInstance(id, newName);
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
      await renameInstance(id, newName);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to rename instance' });
      throw e;
    }
  },

  toggle: async (id: string, enabled: boolean) => {
    try {
      await updateInstance(id, undefined, enabled);
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
    const { instances, searchQuery, selectedFolderId, knownFolders } = get();
    
    // 调试日志
    console.log('[getFilteredInstances] 输入数据:', {
      instances: instances.length,
      selectedFolderId,
      knownFolders: knownFolders.length,
      searchQuery,
    });
    
    let filtered = instances;

    // 如果没有选中文件夹，返回所有实例
    if (!selectedFolderId) {
      console.log('[getFilteredInstances] 未选中文件夹，返回所有实例');
      return instances;
    }

    const folder = knownFolders.find(f => f.id === selectedFolderId);
    
    // 如果找不到文件夹，返回所有实例
    if (!folder) {
      console.warn('[getFilteredInstances] 找不到选中的文件夹:', selectedFolderId);
      return instances;
    }
    
    console.log('[getFilteredInstances] 选中的文件夹:', folder.name, folder.path);

    // 根据文件夹过滤
    filtered = instances.filter(i => {
      const match = i.path.startsWith(folder.path);
      console.log('[getFilteredInstances] 实例过滤:', { 
        name: i.name, 
        path: i.path, 
        folderPath: folder.path, 
        match 
      });
      return match;
    });

    console.log('[getFilteredInstances] 文件夹过滤后:', filtered.length);

    // 根据搜索查询过滤
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.version_id.toLowerCase().includes(q),
      );
      console.log('[getFilteredInstances] 搜索过滤后:', filtered.length);
    }

    console.log('[getFilteredInstances] 最终结果:', filtered.length);
    return filtered;
  },

  getSelectedInstance: () => {
    const { instances, selectedInstanceId } = get();
    if (!selectedInstanceId) return null;
    return instances.find(i => i.id === selectedInstanceId) || null;
  },
}));
