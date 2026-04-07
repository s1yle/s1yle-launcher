import { create } from 'zustand';
import {
  getFabricVersions,
  getForgeVersions,
  getQuiltVersions,
  getFabricApiVersions,
  getQslVersions,
  getAllLoaderCompatibility,
  ModLoaderType,
  type CompatibilityCheck,
} from '../helper/rustInvoke';

interface LoaderVersions {
  versions: string[];
  loading: boolean;
  error: string | null;
}

interface ModloaderState {
  mcVersion: string;
  compatibility: CompatibilityCheck[];
  fabricVersions: LoaderVersions;
  forgeVersions: LoaderVersions;
  quiltVersions: LoaderVersions;
  fabricApiVersions: LoaderVersions;
  qslVersions: LoaderVersions;
  installedLoaders: ModLoaderType[];
  loading: boolean;
  error: string | null;

  setMcVersion: (version: string) => void;
  setInstalledLoaders: (loaders: ModLoaderType[]) => void;
  loadFabricVersions: () => Promise<void>;
  loadForgeVersions: () => Promise<void>;
  loadQuiltVersions: () => Promise<void>;
  loadFabricApiVersions: (fabricVersion: string) => Promise<void>;
  loadQslVersions: (quiltVersion: string) => Promise<void>;
  loadAllCompatibility: () => Promise<void>;
  reset: () => void;
}

const initialLoaderVersions: LoaderVersions = {
  versions: [],
  loading: false,
  error: null,
};

export const useModloaderStore = create<ModloaderState>((set, get) => ({
  mcVersion: '',
  compatibility: [],
  fabricVersions: { ...initialLoaderVersions },
  forgeVersions: { ...initialLoaderVersions },
  quiltVersions: { ...initialLoaderVersions },
  fabricApiVersions: { ...initialLoaderVersions },
  qslVersions: { ...initialLoaderVersions },
  installedLoaders: [],
  loading: false,
  error: null,

  setMcVersion: (version: string) => {
    set({ mcVersion: version });
    get().loadAllCompatibility();
  },

  setInstalledLoaders: (loaders: ModLoaderType[]) => {
    set({ installedLoaders: loaders });
    get().loadAllCompatibility();
  },

  loadFabricVersions: async () => {
    const { mcVersion } = get();
    if (!mcVersion) return;

    set(state => ({
      fabricVersions: { ...state.fabricVersions, loading: true, error: null }
    }));

    try {
      const result = await getFabricVersions(mcVersion);
      const versions = result.versions.map(v => v.version);
      set({
        fabricVersions: { versions, loading: false, error: null }
      });
    } catch (e) {
      set(state => ({
        fabricVersions: {
          ...state.fabricVersions,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load Fabric versions'
        }
      }));
    }
  },

  loadForgeVersions: async () => {
    const { mcVersion } = get();
    if (!mcVersion) return;

    set(state => ({
      forgeVersions: { ...state.forgeVersions, loading: true, error: null }
    }));

    try {
      const result = await getForgeVersions(mcVersion);
      const versions = result.versions.map(v => v.version);
      set({
        forgeVersions: { versions, loading: false, error: null }
      });
    } catch (e) {
      set(state => ({
        forgeVersions: {
          ...state.forgeVersions,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load Forge versions'
        }
      }));
    }
  },

  loadQuiltVersions: async () => {
    const { mcVersion } = get();
    if (!mcVersion) return;

    set(state => ({
      quiltVersions: { ...state.quiltVersions, loading: true, error: null }
    }));

    try {
      const result = await getQuiltVersions(mcVersion);
      const versions = result.versions.map(v => v.version);
      set({
        quiltVersions: { versions, loading: false, error: null }
      });
    } catch (e) {
      set(state => ({
        quiltVersions: {
          ...state.quiltVersions,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load Quilt versions'
        }
      }));
    }
  },

  loadFabricApiVersions: async (fabricVersion: string) => {
    const { mcVersion } = get();
    if (!mcVersion || !fabricVersion) return;

    set(state => ({
      fabricApiVersions: { ...state.fabricApiVersions, loading: true, error: null }
    }));

    try {
      const result = await getFabricApiVersions(mcVersion, fabricVersion);
      const versions = result.versions.map(v => v.version);
      set({
        fabricApiVersions: { versions, loading: false, error: null }
      });
    } catch (e) {
      set(state => ({
        fabricApiVersions: {
          ...state.fabricApiVersions,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load Fabric API versions'
        }
      }));
    }
  },

  loadQslVersions: async (quiltVersion: string) => {
    const { mcVersion } = get();
    if (!mcVersion || !quiltVersion) return;

    set(state => ({
      qslVersions: { ...state.qslVersions, loading: true, error: null }
    }));

    try {
      const result = await getQslVersions(mcVersion, quiltVersion);
      const versions = result.versions.map(v => v.version);
      set({
        qslVersions: { versions, loading: false, error: null }
      });
    } catch (e) {
      set(state => ({
        qslVersions: {
          ...state.qslVersions,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load QSL versions'
        }
      }));
    }
  },

  loadAllCompatibility: async () => {
    const { mcVersion, installedLoaders } = get();
    if (!mcVersion) return;

    set({ loading: true, error: null });

    try {
      const compatibility = await getAllLoaderCompatibility(mcVersion, installedLoaders);
      set({ compatibility, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to check compatibility',
        loading: false
      });
    }
  },

  reset: () => {
    set({
      mcVersion: '',
      compatibility: [],
      fabricVersions: { ...initialLoaderVersions },
      forgeVersions: { ...initialLoaderVersions },
      quiltVersions: { ...initialLoaderVersions },
      fabricApiVersions: { ...initialLoaderVersions },
      qslVersions: { ...initialLoaderVersions },
      installedLoaders: [],
      loading: false,
      error: null,
    });
  },
}));
