import { invokeRust } from './client';
import type { AccountInfo } from './types/account';
import type { SystemInfo } from './system';
import type { GameFolder } from './game';
import type { BackgroundConfig } from '@/config/types';

/**
 * 前端初始化一次性聚合数据（由后端 `get_bootstrap_data` 命令返回）
 */
export interface BootstrapData {
  /** 是否首次运行（迎新界面） */
  first_run: boolean;
  /** 背景配置 */
  background: BackgroundConfig;
  /** 当前游戏根目录 */
  game_root: string;
  /** 已添加的游戏文件夹列表 */
  game_folders: GameFolder[];
  /** 账户列表 */
  accounts: AccountInfo[];
  /** 当前活动账户 */
  current_account: AccountInfo | null;
  /** 系统信息 */
  system_info: SystemInfo;
  /** 配置版本 */
  version: number;
}

/**
 * 获取启动引导所需的全部数据（替代分散的 get_config / get_system_info 等多路调用）
 */
export const invokeGetBootstrapData = async (): Promise<BootstrapData> => {
  return (await invokeRust('get_bootstrap_data', {})) as BootstrapData;
};
