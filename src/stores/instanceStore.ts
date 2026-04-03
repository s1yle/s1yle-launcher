import { create } from 'zustand';
import {
  scanInstances,
  createInstance,
  deleteInstance,
  copyInstance,
  renameInstance,
  updateInstance,
} from '../helper/rustInvoke';
import type { GameInstance, ModLoaderType } from '../helper/rustInvoke';

interface InstanceState {
  instances: GameInstance[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  createNew: (name: string, version: string, loaderType: ModLoaderType, loaderVersion?: string, iconPath?: string) => Promise<void>;
  remove: (id: string, deleteFiles?: boolean) => Promise<void>;
  duplicate: (id: string, newName: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  toggle: (id: string, enabled: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  getFilteredInstances: () => GameInstance[];
}

export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  loading: false,
  error: null,
  searchQuery: '',
  viewMode: 'grid',

  init: async () => {
    set({ loading: true, error: null });
    try {
      const instances = await scanInstances();
      set({ instances });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load instances' });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      const instances = await scanInstances();
      set({ instances });
    } catch {
      // keep existing
    }
  },

  createNew: async (name: string, version: string, loaderType: ModLoaderType, loaderVersion?: string, iconPath?: string) => {
    try {
      await createInstance(name, version, loaderType, loaderVersion, iconPath);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create instance' });
      throw e;
    }
  },

  remove: async (id: string, deleteFiles = false) => {
    try {
      await deleteInstance(id, deleteFiles);
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
    const { instances, searchQuery } = get();
    if (!searchQuery) return instances;
    const q = searchQuery.toLowerCase();
    return instances.filter(
      (i) => i.name.toLowerCase().includes(q) || i.version.toLowerCase().includes(q),
    );
  },
}));
