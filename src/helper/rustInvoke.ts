export * from "@/api";
export type * from "@/api"

import * as __ from "@/api";

/** 获取账户列表 */
export const getAccountList = __.invokeGetAccountList;
/** 获取当前选中的账户 */
export const getCurrentAccount = __.invokeGetCurrentAccount;
export const getCurrentAccountToken = __.invokeGetCurrentAccountToken;
/** 删除指定账户 */
export const deleteAccount = __.invokeDeleteAccount;
/** 设置当前激活的账户 */
export const setCurrentAccount = __.invokeSetCurrentAccount;

/** 启动游戏实例 */
export const launchInstance = __.invokeLaunchInstance;
/** 停止游戏实例 */
export const stopInstance = __.invokeStopInstance;
/** 获取启动状态 */
export const getLaunchStatus = __.invokeGetLaunchStatus;
/** 获取启动配置 */
export const getLaunchConfig = __.invokeGetLaunchConfig;
/** 更新启动配置 */
export const updateLaunchConfig = __.invokeUpdateLaunchConfig;

/** 获取版本清单 */
export const getVersionManifest = __.invokeGetVersionManifest;
/** 获取版本详情 */
export const getVersionDetail = __.invokeGetVersionDetail;
/** 获取版本下载清单 */
export const getVersionDownloadManifest = __.invokeGetVersionDownloadManifest;
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
/** 获取 Fabric 版本详情 */
export const getFabricVersionDetail = __.invokeGetFabricVersionDetail;
/** 构建 Fabric 启动配置 */
export const buildFabricLaunchConfig = __.invokeBuildFabricLaunchConfig;
/** 获取 Forge 版本列表 */
export const getForgeVersions = __.invokeGetForgeVersions;
/** 获取 NeoForge 版本列表 */
export const getNeoForgeVersions = __.invokeGetNeoForgeVersions;
/** 获取 OptiFine 版本列表 */
export const getOptifineVersions = __.invokeGetOptifineVersions;
/** 构建 Forge 启动配置 */
export const buildForgeLaunchConfig = __.invokeBuildForgeLaunchConfig;
/** 获取磁盘剩余空间 */
/** 获取已安装的模组加载器列表 */
export const getInstalledModLoaders = __.invokeGetInstalledModLoaders;

/** 扫描已安装的游戏实例 */
export const scanGames = __.invokeScanGames;
/** 获取实例设置 */
export const getGameSettings = __.invokeGetGameSettings;
/** 更新实例设置 */
export const updateGameSettings = __.invokeUpdateGameSettings;
/** 获取系统内存信息 */
export const getSystemMemory = __.invokeGetSystemMemory;
/** 获取系统内存使用情况（[已用, 总] MB） */
export const getMemoryUsage = __.invokeGetMemoryUsage;
/** 获取显示器支持的分辨率列表 */
export const getDisplayResolutions = __.invokeGetDisplayResolutions;
/** 弹出 Java 路径选择对话框 */
export const selectJavaPath = __.invokeSelectJavaPath;
/** 获取单个实例信息 */
export const getGame = __.invokeGetGame;
/** 创建新实例 */
export const createGame = __.invokeCreateGame;
/** 删除实例 */
export const deleteGame = __.invokeDeleteGame;
/** 重命名实例 */
export const renameGame = __.invokeRenameGame;
/** 更新实例信息 */
export const updateGame = __.invokeUpdateGame;
/** 校验实例完整性 （基于版本 JSON，deep 时对资源做 SHA1 全量校验） */
export const validateGame = __.invokeValidateGame;

/** 创建窗口 */
export const createWindow = __.invokeCreateWindow;
/** 关闭窗口 */
export const closeWindow = __.invokeCloseWindow;
/** 切换窗口（关闭 A → 打开 B） */
export const switchWindow = __.invokeSwitchWindow;
/** 保存窗口位置和大小 */
export const saveWindowPosition = __.invokeSaveWindowPosition;
/** 加载已保存的窗口位置 */
export const loadWindowPosition = __.invokeLoadWindowPosition;
/** 在文件管理器中打开文件夹 */
export const openFolder = __.invokeOpenFolder;
/** 在默认浏览器中打开 URL */
export const openUrl = __.invokeOpenUrl;

/** 获取当前游戏根目录 */
export const getGameRoot = __.invokeGetGameRoot;
/** 切换游戏根目录 */
export const setGameRoot = __.invokeSetGameRoot;

/** 获取完整配置 */
export const getConfig = __.invokeGetConfig;
/** 设置指定配置键的值 */
export const setConfigValue = __.invokeSetConfigValue;
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
