import type { GameSettings } from './game';

/** 单窗口位置和尺寸信息 */
export interface WindowPosition {
  /** 窗口左上角 X 坐标 */
  x: number;
  /** 窗口左上角 Y 坐标 */
  y: number;
  /** 窗口宽度 */
  width: number;
  /** 窗口高度 */
  height: number;
  /** 是否最大化 */
  maximized: boolean;
}

/** 多窗口位置存储（按 label 索引） */
export interface WindowPositions {
  /** 主窗口位置 */
  main?: WindowPosition;
  /** 登录窗口位置 */
  login?: WindowPosition;
}

/** 应用全局配置（对应 Rust config/models.rs SystemConfig，snake_case 序列化） */
export interface AppConfig {
  /** 配置文件版本号 */
  version: number;
  /** 游戏根目录（game_root 持久化源，缺省回退 launcher_work_dir） */
  game_root: string;
  /** 多窗口位置 */
  window_positions: WindowPositions;
  /** 全局游戏设置（未启用游戏独立设置时的默认值，所有游戏共用） */
  game_settings: GameSettings;
}

/** 登录状态（对应 Rust account/models.rs StoreLoginState，经 get_login_state 命令读取，不随 get_config 返回） */
export interface StoreLoginState {
  /** 是否已登录 */
  is_logged_in: boolean;
  /** 登录类型：none / offline / microsoft / third-party */
  logged_in_type: string;
  /** 登录时间 */
  login_time: string;
}
