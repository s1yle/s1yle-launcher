import { create } from 'zustand';
import {
  createGame,
  deleteGame,
  renameGame,
  updateGame,
  updateGameSettings,
  getGameRoot,
  scanGames,
  validateGame,
} from '../helper/rustInvoke';
import type { Game, GameSettings, GameValidation } from '../helper/rustInvoke';
import { ModLoaderType } from '../helper/rustInvoke';

const STORAGE_KEY_GAME = 's1yle-selected-game';
const STORAGE_KEY_FAVORITES = 's1yle-favorite-instances';

// 获取 localstorage 存储的游戏 ID
function getSavedGameId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_GAME) || null; }
  catch { return null; }
}

// 使用 localstorage 存储游戏 ID
function saveGameId(id: string | null) {
  try { localStorage.setItem(STORAGE_KEY_GAME, id || ''); }
  catch { /* storage not available */ }
}

// 读取收藏的实例 ID 列表
function getSavedFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}

// 持久化收藏的实例 ID 列表
function saveFavorites(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(ids)); }
  catch { /* storage not available */ }
}

/**
 * 游戏管理 Store 的内部接口
 *
 * 管理 Minecraft 游戏（Game）的 CRUD 和本地持久化选中状态。
 */
interface GameState {
  /** 所有游戏列表 */
  games: Game[];
  /** 收藏的实例 ID 列表（持久化到 localStorage） */
  favoriteIds: string[];
  /** 当前选中的游戏 ID（持久化到 localStorage） */
  selectedGameId: string | null;
  /** 当前选中的侧边栏项 ID */
  selectedSidebarItemId: string | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 游戏搜索关键词 */
  searchQuery: string;
  /** 视图模式：网格或列表 */
  viewMode: 'grid' | 'list';
  /** 游戏根目录（即 .minecraft 目录本身） */
  gameRoot: string;
  /** 实例完整性校验结果（key = 游戏 id；null = 校验不可用，如版本 JSON 缺失） */
  validations: Record<string, GameValidation | null>;
  /** 是否正在后台校验实例完整性 */
  validating: boolean;

  /** 初始化 Store（加载游戏、路径配置、恢复选中状态） */
  init: () => Promise<void>;
  /** 刷新游戏列表和根目录 */
  refresh: () => Promise<void>;
  /** 校验全部实例完整性（后台并发执行；结果写入 validations 并同步 broken 标记） */
  validateAll: () => Promise<void>;
  /** 校验单个实例完整性（每次调用都执行，无缓存） */
  checkGame: (id: string) => Promise<GameValidation | null>;
  /** 选中游戏（同时持久化到 localStorage） */
  setSelectedGame: (id: string | null) => void;
  /** 选中侧边栏项 */
  setSelectedSidebarItem: (id: string | null) => void;
  /** 根据 ID 获取游戏 */
  getGame: (id: string) => Game | null;
  /** 创建新游戏 */
  createNew: (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => Promise<void>;
  /** 删除指定游戏 */
  remove: (id: string) => Promise<void>;
  /** 复制游戏 */
  duplicate: (id: string, newName: string) => Promise<void>;
  /** 重命名游戏 */
  rename: (id: string, newName: string) => Promise<void>;
  /** 启用/禁游戏 */
  toggle: (id: string, enabled: boolean) => Promise<void>;
  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 设置视图模式（grid / list） */
  setViewMode: (mode: 'grid' | 'list') => void;
  /** 根据当前搜索条件获取过滤后的游戏列表 */
  getFilteredGames: () => Game[];
  /** 切换实例收藏状态（持久化到 localStorage） */
  toggleFavorite: (id: string) => void;
  /** 判断实例是否已收藏 */
  isFavorite: (id: string) => boolean;
  /** 获取当前选中的游戏对象 */
  getSelectedGame: () => Game | null;
}

/**
 * 游戏管理 Store
 *
 * 功能:
 * - 管理 Minecraft 游戏的全生命周期（创建/删除/复制/重命名/启用/禁用）
 * - 维护选中游戏持久化（localStorage）
 * - 支持按名称/版本 ID 搜索
 */
export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  favoriteIds: getSavedFavorites(),
  selectedGameId: null,
  selectedSidebarItemId: null,
  loading: false,
  error: null,
  searchQuery: '',
  viewMode: 'grid',
  gameRoot: '',
  validations: {},
  validating: false,

  init: async () => {
    set({ loading: true, error: null });
    try {
      console.log('[gameStore.init] 开始初始化...');

      const [gameRoot, games] = await Promise.all([
        getGameRoot(),
        scanGames(),
      ]);

      console.log('[gameStore.init] 加载的数据:', {
        gameRoot,
        games: games.length,
      });

      const savedGameId = getSavedGameId();
      const validGameId = savedGameId && games.find(i => i.id === savedGameId)
        ? savedGameId
        : games[0]?.id ?? null;

      console.log('[gameStore.init] 游戏选择:', { savedGameId, validGameId });

      set({
        games,
        gameRoot,
        selectedGameId: validGameId,
      });

      console.log('[gameStore.init] 初始化完成');
    } catch (e) {
      console.error('[gameStore.init] 初始化失败:', e);
      set({ error: e instanceof Error ? e.message : 'Failed to load games' });
    } finally {
      set({ loading: false });
    }

    // 主页/列表页入口：只校验当前选中的实例，避免全量 SHA1 哈希拖慢进入
    const selected = get().selectedGameId;
    if (selected) {
      void get().checkGame(selected);
    } else {
      void get().validateAll();
    }
  },

  validateAll: async () => {
    const { games, validating } = get();
    if (validating) return;
    // 不按 version_id 过滤：空壳目录（无版本号）也必须校验以获得 empty 标记，前端据此隐藏
    const targets = games;
    if (targets.length === 0) return;

    set({ validating: true });
    const results: Record<string, GameValidation | null> = {};

    // 受限并发（2 路），避免多实例同时 SHA1 哈希造成 IO 尖峰
    let index = 0;
    const workers = Array.from({ length: Math.min(2, targets.length) }, async () => {
      while (index < targets.length) {
        const game = targets[index++];
        try {
          results[game.id] = await validateGame(game.name);
        } catch {
          // 版本未知等：扫描阶段已标记 broken，此处留 null
          results[game.id] = null;
        }
      }
    });
    await Promise.all(workers);

    set((state) => {
      const validations = { ...state.validations, ...results };
      return {
        validating: false,
        validations,
        games: state.games.map((g) => {
          const report = validations[g.id];
          return report ? { ...g, broken: !report.valid } : g;
        }),
      };
    });
  },

  refresh: async () => {
    try {
      const [games, gameRoot] = await Promise.all([
        scanGames(),
        getGameRoot(),
      ]);
      set({ games, gameRoot });

      const selectedId = get().selectedGameId;
      if (selectedId && !games.find(i => i.id === selectedId)) {
        if (games.length > 0) {
          set({ selectedGameId: games[0].id });
          saveGameId(games[0].id);
        } else {
          set({ selectedGameId: null });
          saveGameId(null);
        }
      }
    } catch {
      // keep existing
    }

    // 刷新后始终全量校验：保证空壳（无版本号）实例也能拿到 empty 标记，
    // 不能只校验选中实例（否则空目录会继续显示并落入错误分组）
    void get().validateAll();
  },

  /** 校验单个实例完整性（每次调用都执行，无缓存）；结果写入 validations 并同步 broken */
  checkGame: async (id: string) => {
    const game = get().games.find((g) => g.id === id);
    if (!game) return null;

    let report: GameValidation | null;
    try {
      report = await validateGame(game.name);
    } catch {
      // 版本未知等：扫描阶段已标记 broken，此处留 null
      report = null;
    }
    set((state) => {
      const validations = { ...state.validations, [id]: report };
      return {
        validations,
        games: report
          ? state.games.map((g) => (g.id === id ? { ...g, broken: !report.valid } : g))
          : state.games,
      };
    });
    return report;
  },

  setSelectedGame: (id: string | null) => {
    set({ selectedGameId: id });
    saveGameId(id);
  },

  toggleFavorite: (id: string) => {
    const { favoriteIds } = get();
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((f) => f !== id)
      : [...favoriteIds, id];
    set({ favoriteIds: next });
    saveFavorites(next);
  },

  isFavorite: (id: string) => {
    return get().favoriteIds.includes(id);
  },

  getGame: (id: string) => {
    const { games } = get();
    return games.find(i => i.id === id) || null;
  },

  setSelectedSidebarItem: (id: string | null) => {
    set({ selectedSidebarItemId: id });
  },

  createNew: async (name: string, version: string, loaderType?: ModLoaderType, loaderVersion?: string, iconPath?: string) => {
    try {
      const game = await createGame(name, version, loaderType || ModLoaderType.Vanilla, loaderVersion, iconPath);
      await get().refresh();
      set({ selectedGameId: game.id });
      saveGameId(game.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create game' });
      throw e;
    }
  },

  remove: async (id: string) => {
    try {
      const { games } = get();
      const game = games.find(i => i.id === id);
      await deleteGame(game?.name ?? id, true);
      set((state) => {
        const validations = { ...state.validations };
        delete validations[id];
        return { validations };
      });
      const { selectedGameId } = get();
      await get().refresh();
      if (id === selectedGameId) {
        const newList = games.filter(i => i.id !== id);
        if (newList.length > 0) {
          set({ selectedGameId: newList[0].id });
          saveGameId(newList[0].id);
        } else {
          set({ selectedGameId: null });
          saveGameId(null);
        }
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete game' });
      throw e;
    }
  },

  duplicate: async (id: string, newName: string) => {
    try {
      const { games } = get();
      const source = games.find(i => i.id === id);
      if (!source) {
        throw new Error('源游戏不存在');
      }
      const game = await createGame(
        newName,
        source.version_id,
        source.loader_type as ModLoaderType,
        source.loader_version ?? undefined,
        source.icon_path ?? undefined
      );
      const settings: GameSettings = source.game_settings ?? {};
      await updateGameSettings(game.name, settings).catch(() => undefined);
      await get().refresh();
      set({ selectedGameId: game.id });
      saveGameId(game.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to duplicate game' });
      throw e;
    }
  },

  rename: async (id: string, newName: string) => {
    try {
      const { games } = get();
      const game = games.find(i => i.id === id);
      await renameGame(game?.name ?? id, newName);
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to rename game' });
      throw e;
    }
  },

  toggle: async (id: string, enabled: boolean) => {
    try {
      const { games } = get();
      const game = games.find(i => i.id === id);
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

  getFilteredGames: () => {
    const { games, searchQuery } = get();
    let filtered = games;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.version_id.toLowerCase().includes(q),
      );
    }

    return filtered;
  },

  getSelectedGame: () => {
    const { games, selectedGameId } = get();
    if (!selectedGameId) return null;
    return games.find(i => i.id === selectedGameId) || null;
  },
}));