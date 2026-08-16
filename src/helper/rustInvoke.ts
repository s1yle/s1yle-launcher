export * from "@/api";
export type * from "@/api"

import * as __ from "@/api";

/** 获取账户列表 */
export const getAccountList = __.invokeGetAccountList;
/** 获取当前选中的账户 */
export const getCurrentAccount = __.invokeGetCurrentAccount;
/** 删除指定账户 */
export const deleteAccount = __.invokeDeleteAccount;
/** 设置当前激活的账户 */
export const setCurrentAccount = __.invokeSetCurrentAccount;

/** 启动游戏 */
export const launchGame = __.invokeLaunchGame;
/** 停止游戏 */
export const stopGame = __.invokeStopGame;
/** 获取指定游戏会话的启动状态与真实进度 */
export const getLaunchStatusByKey = __.invokeGetLaunchStatusByKey;
/** 获取全部运行游戏会话快照 */
export const getLaunchGames = __.invokeGetLaunchGames;
/** 增量拉取指定游戏会话的捕获日志 */
export const getGameLog = __.invokeGetGameLog;

/** 获取版本清单 */
export const getVersionManifest = __.invokeGetVersionManifest;
/** 获取下载任务列表 */
export const getDownloadTasks = __.invokeGetDownloadTasks;
/** 取消下载任务 */
export const cancelDownload = __.invokeCancelDownload;
/** 取消版本下载（整个部署流程） */
export const cancelVersionDownload = __.invokeCancelVersionDownload;
/** 清除已完成的下载任务 */
export const clearCompletedTasks = __.invokeClearCompletedTasks;
/** 下载并部署版本 */
export const download = __.invokeDownload;

/** 获取 Fabric 版本列表 */
export const getFabricVersions = __.invokeGetFabricVersions;
/** 获取 Forge 版本列表 */
export const getForgeVersions = __.invokeGetForgeVersions;
/** 获取 NeoForge 版本列表 */
export const getNeoForgeVersions = __.invokeGetNeoForgeVersions;
/** 获取 OptiFine 版本列表 */
export const getOptifineVersions = __.invokeGetOptifineVersions;

/** 扫描已安装的游戏 */
export const scanGames = __.invokeScanGames;
/** 获取游戏设置 */
export const getGameSettings = __.invokeGetGameSettings;
/** 更新游戏设置 */
export const updateGameSettings = __.invokeUpdateGameSettings;
/** 获取全局游戏设置 */
export const getGlobalGameSettings = __.invokeGetGlobalGameSettings;
/** 更新全局游戏设置 */
export const updateGlobalGameSettings = __.invokeUpdateGlobalGameSettings;
/** 获取系统内存使用情况（[已用, 总] MB） */
export const getMemoryUsage = __.invokeGetMemoryUsage;
/** 获取显示器支持的分辨率列表 */
export const getDisplayResolutions = __.invokeGetDisplayResolutions;
/** 弹出 Java 路径选择对话框 */
export const selectJavaPath = __.invokeSelectJavaPath;
/** 获取单个游戏信息 */
export const getGame = __.invokeGetGame;
/** 创建新游戏 */
export const createGame = __.invokeCreateGame;
/** 删除游戏 */
export const deleteGame = __.invokeDeleteGame;
/** 重命名游戏 */
export const renameGame = __.invokeRenameGame;
/** 更新游戏信息 */
export const updateGame = __.invokeUpdateGame;
/** 校验游戏完整性 （基于版本 JSON，deep 时对资源做 SHA1 全量校验） */
export const validateGame = __.invokeValidateGame;

/** 切换窗口（关闭 A → 打开 B） */
export const switchWindow = __.invokeSwitchWindow;
/** 保存指定窗口的位置和大小 */
export const saveWindowPositionByLabel = __.invokeSaveWindowPositionByLabel;
/** 在文件管理器中打开文件夹 */
export const openFolder = __.invokeOpenFolder;
/** 在默认浏览器中打开 URL */
export const openUrl = __.invokeOpenUrl;

/** 测试 Rust 后端通信 */
export const greet = __.invokeGreet;
/** 获取系统信息 */
export const getSystemInfo = __.invokeGetSystemInfo;
/** 选择背景图片 */
export const selectBackgroundImage = __.invokeSelectBackgroundImage;

/** 获取当前游戏根目录 */
export const getGameRoot = __.invokeGetGameRoot;

/** 保存登录状态 */
export const saveLoginState = __.invokeSaveLoginState;
/** 清除登录状态 */
export const clearLoginState = __.invokeClearLoginState;

/** 扫描系统中已安装的 Java */
export const scanJavaInstallations = __.invokeScanJavaInstallations;

/** 获取系统字体列表 */
export const getSystemFonts = __.invokeGetSystemFonts;
/** 获取字体 */
export const getFont = __.invokeGetFont;
