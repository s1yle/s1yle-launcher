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
} from '../helper/rustInvoke';
import type { GameInstance, KnownPath } from '../helper/rustInvoke';
import { ModLoaderType } from '../helper/rustInvoke';

const STORAGE_KEY_FOLDER = 's1yle-selected-folder';
const STORAGE_KEY_INSTANCE = 's1yle-selected-instance';

function getSavedFolderId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_FOLDER) || null; }
  catch { return null; }
}

function saveFolderId(id: string | null) {
  try { localStorage.setItem(STORAGE_KEY_FOLDER, id || ''); }
  catch { /* storage not available */ }
}

function getSavedInstanceId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_INSTANCE) || null; }
  catch { return null; }
}

function saveInstanceId(id: string | null) {
  try { localStorage.setItem(STORAGE_KEY_INSTANCE, id || ''); }
  catch { /* storage not available */ }
}

interface InstanceState {
  instances: GameInstance[];
  knownFolders: KnownPath[];
  selectedFolderId: string | null;
  selectedInstanceId: string | null;
  selectedSidebarItemId: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  instancesPath: string;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshKnownFolders: () => Promise<void>;
  addKnownFolder: (path: string) => Promise<void>;
  setSelectedFolder: (id: string | null) => void;
  setSelectedInstance: (id: string | null) => void;
  setSelectedSidebarItem: (id: string | null) => void;
  createNew: (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string, newName: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  toggle: (id: string, enabled: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  getFilteredInstances: () => GameInstance[];
  getSelectedInstance: () => GameInstance | null;
}

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

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [instances, path, knownFolders] = await Promise.all([
        scanInstances(),
        getInstancesPath(),
        scanKnownMcPaths(),
      ]);

      const savedFolderId = getSavedFolderId();
      const defaultFolderId = savedFolderId && knownFolders.find(f => f.id === savedFolderId)
        ? savedFolderId
        : knownFolders.find(f => f.is_default)?.id ?? knownFolders[0]?.id ?? null;

      const savedInstanceId = getSavedInstanceId();
      const validInstanceId = savedInstanceId && instances.find(i => i.id === savedInstanceId)
        ? savedInstanceId
        : instances[0]?.id ?? null;

      set({
        instances,
        instancesPath: path,
        knownFolders,
        selectedFolderId: defaultFolderId,
        selectedInstanceId: validInstanceId,
      });
    } catch (e) {
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

  setSelectedFolder: (id: string | null) => {
    set({ selectedFolderId: id });
    saveFolderId(id);
  },

  setSelectedInstance: (id: string | null) => {
    set({ selectedInstanceId: id });
    saveInstanceId(id);
  },

  setSelectedSidebarItem: (id: string | null) => {
    set({ selectedSidebarItemId: id });
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
    let filtered = instances;

    if (selectedFolderId) {
      const folder = knownFolders.find(f => f.id === selectedFolderId);
      if (folder) {
        filtered = instances.filter(i => i.path.startsWith(folder.path));
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.version.toLowerCase().includes(q),
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
