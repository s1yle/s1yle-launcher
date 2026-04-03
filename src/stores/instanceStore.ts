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

interface InstanceState {
  instances: GameInstance[];
  knownFolders: KnownPath[];
  selectedFolderId: string | null;
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
  createNew: (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string, newName: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  toggle: (id: string, enabled: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  getFilteredInstances: () => GameInstance[];
}

export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  knownFolders: [],
  selectedFolderId: null,
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
      set({
        instances,
        instancesPath: path,
        knownFolders,
        selectedFolderId: knownFolders.find(f => f.is_default)?.id ?? knownFolders[0]?.id ?? null,
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
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to add folder' });
      throw e;
    }
  },

  setSelectedFolder: (id: string | null) => {
    set({ selectedFolderId: id });
  },

  createNew: async (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => {
    try {
      await createInstance(name, version, loaderType || ModLoaderType.Vanilla, loaderVersion, iconPath);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create instance' });
      throw e;
    }
  },

  remove: async (id: string) => {
    try {
      await deleteInstance(id, true);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete instance' });
      throw e;
    }
  },

  duplicate: async (id: string, newName: string) => {
    try {
      await copyInstance(id, newName);
      await get().refresh();
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

    // Filter by selected folder
    if (selectedFolderId) {
      const folder = knownFolders.find(f => f.id === selectedFolderId);
      if (folder) {
        filtered = instances.filter(i => i.path.startsWith(folder.path));
      }
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.version.toLowerCase().includes(q),
      );
    }

    return filtered;
  },
}));
