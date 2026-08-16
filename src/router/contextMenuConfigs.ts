import {
  FolderOpen,
  Puzzle,
  PackageOpen,
  Map,
  FolderSearch,
  FileText,
  Edit3,
  Copy,
  Trash2,
  FileDown,
  type LucideIcon,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { useGameStore } from '@/stores/gameStore';
import { openFolder } from '@/helper/rustInvoke';

interface NotificationApi {
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

/** 拼接路径（自动识别 Windows/Unix 分隔符） */
const joinPath = (base: string, ...parts: string[]): string => {
  const sep = base.includes('\\') ? '\\' : '/';
  return [base, ...parts.filter(Boolean)].join(sep);
};

/** 打开选中游戏的子目录（subdir 为空时打开游戏目录本身） */
const browseDirHandler = (subdir: string) => (_actionId: string, t: TFunction, notify: NotificationApi) => {
  const game = useGameStore.getState().getSelectedGame();
  if (!game) {
    notify.error(t('gameInfo.selectGame', '请先选择游戏'));
    return;
  }
  const dir = subdir ? joinPath(game.path, subdir) : game.path;
  openFolder(dir).catch((e) => {
    notify.error(
      t('games.openFolderFailed', '打开目录失败'),
      e instanceof Error ? e.message : String(e),
    );
  });
};

/** 上下文菜单动作配置 */
export interface ContextMenuActionConfig {
  id: string;
  labelI18nKey: string;
  icon: LucideIcon;
  handler?: (actionId: string, t: TFunction, notify: NotificationApi) => void;
  danger?: boolean;
}

/** 上下文菜单组配置 */
export interface ContextMenuGroupConfig {
  id: string;
  titleI18nKey: string;
  actions: ContextMenuActionConfig[];
}

const defaultHandler = (actionId: string, t: TFunction, notify: NotificationApi) => {
  const group = Object.values(contextMenuConfigs).find(g => 
    g.actions.some(a => a.id === actionId)
  );
  if (group) {
    const action = group.actions.find(a => a.id === actionId);
    if (action) {
      notify.success(t(group.titleI18nKey), t(action.labelI18nKey));
    }
  }
};

/** 浏览目录菜单配置 */
export const browseMenuConfig: ContextMenuGroupConfig = {
  id: 'gm-browse',
  titleI18nKey: 'gameManage.browse',
  actions: [
    { id: 'ctx-version', labelI18nKey: 'gameManage.browseVersionDir', icon: FolderOpen, handler: browseDirHandler('') },
    { id: 'ctx-mods', labelI18nKey: 'gameManage.browseModsDir', icon: Puzzle, handler: browseDirHandler('mods') },
    { id: 'ctx-resourcepacks', labelI18nKey: 'gameManage.browseResourcePacksDir', icon: PackageOpen, handler: browseDirHandler('resourcepacks') },
    { id: 'ctx-saves', labelI18nKey: 'gameManage.browseSavesDir', icon: Map, handler: browseDirHandler('saves') },
    { id: 'ctx-shaders', labelI18nKey: 'gameManage.browseShadersDir', icon: FolderSearch, handler: browseDirHandler('shaderpacks') },
    { id: 'ctx-screenshots', labelI18nKey: 'gameManage.browseScreenshotsDir', icon: FolderSearch, handler: browseDirHandler('screenshots') },
    { id: 'ctx-config', labelI18nKey: 'gameManage.browseConfigDir', icon: FolderSearch, handler: browseDirHandler('config') },
    { id: 'ctx-logs', labelI18nKey: 'gameManage.browseLogsDir', icon: FolderSearch, handler: browseDirHandler('logs') },
  ]
};

/** 游戏管理菜单配置 */
export const manageMenuConfig: ContextMenuGroupConfig = {
  id: 'gm-manage',
  titleI18nKey: 'gameManage.manage',
  actions: [
    { id: 'ctx-script', labelI18nKey: 'gameManage.manageGenerateScript', icon: FileText },
    { id: 'ctx-rename', labelI18nKey: 'gameManage.manageRename', icon: Edit3 },
    { id: 'ctx-copy', labelI18nKey: 'gameManage.manageCopy', icon: Copy },
    { id: 'ctx-delete', labelI18nKey: 'gameManage.manageDelete', icon: Trash2, danger: true },
    { id: 'ctx-export', labelI18nKey: 'gameManage.manageExport', icon: FileDown },
  ]
};

/** 上下文菜单配置总表 */
export const contextMenuConfigs: Record<string, ContextMenuGroupConfig> = {
  'gm-browse': browseMenuConfig,
  'gm-manage': manageMenuConfig,
};

/**
 * 根据父组 ID 和动作 ID 获取对应的菜单项配置
 * @param parentId - 父组 ID
 * @param actionId - 动作 ID
 * @returns 菜单项配置
 */
export function getContextMenuItemByActionId(parentId: string, actionId: string): ContextMenuActionConfig | undefined {
  const group = contextMenuConfigs[parentId];
  return group?.actions.find(action => action.id === actionId);
}

/**
 * 执行上下文菜单动作
 * @param parentId - 父组 ID
 * @param actionId - 动作 ID
 * @param t - i18n 翻译函数
 * @param notify - 通知 API
 */
export function useContextMenuAction(
  parentId: string, 
  actionId: string, 
  t: TFunction, 
  notify: NotificationApi
) {
  const action = getContextMenuItemByActionId(parentId, actionId);
  if (action?.handler) {
    action.handler(actionId, t, notify);
  } else {
    defaultHandler(actionId, t, notify);
  }
}
