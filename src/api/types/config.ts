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

/** 应用全局配置（.wecraft.json 的 app 节） */
export interface AppConfig {
  /** 配置文件版本号 */
  version: number;
  /** 下载根目录（DownloadManager base_path 唯一持久化源） */
  download_path: string;
  /** 多窗口位置 */
  window_positions: WindowPositions;
  /** 游戏根目录（game_root 持久化源，缺省回退 launcher_work_dir） */
  game_dir: string | null;
  /** 登录状态（后端持久化，单一起源） */
  login_state: StoreLoginState;
}

/** 登录状态（持久化，用于启动时判断是否展示登录门禁） */
export interface StoreLoginState {
  /** 是否已登录 */
  is_logged_in: boolean;
  /** 登录类型：none / offline / microsoft / admin */
  logged_in_type: string;
  /** 当前账户 UUID（player 用） */
  current_acc_uuid: string | null;
  /** 登录时间 */
  login_time: string;
}
