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
/** 保存账户到本地 */
export const saveAccount = __.invokeSaveAccount;
/** 从本地加载账户 */
export const loadAccount = __.invokeLoadAccount;

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
/** 下载文件 */
export const downloadFile = __.invokeDownloadFile;
/** 部署版本文件 */
export const deployVersionFiles = __.invokeDeployVersionFiles;
/** 使用 HMCL 格式部署版本 */
export const deployVersionHmcl = __.invokeDeployVersionHmcl;
/** 迁移目录结构 */
export const migrateDirectoryStructure = __.invokeMigrateDirectoryStructure;
/** 获取下载任务列表 */
export const getDownloadTasks = __.invokeGetDownloadTasks;
/** 获取单个下载任务 */
export const getDownloadTask = __.invokeGetDownloadTask;
/** 取消下载任务 */
export const cancelDownload = __.invokeCancelDownload;
/** 清除已完成的下载任务 */
export const clearCompletedTasks = __.invokeClearCompletedTasks;
/** 获取游戏版本列表 */
export const getGameVersions = __.invokeGetGameVersions;
/** 下载并部署版本 */
export const downloadAndDeploy = __.invokeDownloadAndDeploy;

/** 获取 Fabric 版本列表 */
export const getFabricVersions = __.invokeGetFabricVersions;
/** 获取 Fabric 版本详情 */
export const getFabricVersionDetail = __.invokeGetFabricVersionDetail;
/** 构建 Fabric 启动配置 */
export const buildFabricLaunchConfig = __.invokeBuildFabricLaunchConfig;
/** 获取 Forge 版本列表 */
export const getForgeVersions = __.invokeGetForgeVersions;
/** 构建 Forge 启动配置 */
export const buildForgeLaunchConfig = __.invokeBuildForgeLaunchConfig;
/** 获取已安装的模组加载器列表 */
export const getInstalledModLoaders = __.invokeGetInstalledModLoaders;
/** 获取 Quilt 版本列表 */
export const getQuiltVersions = __.invokeGetQuiltVersions;
/** 获取 Fabric API 版本列表 */
export const getFabricApiVersions = __.invokeGetFabricApiVersions;
/** 获取 QSL 版本列表 */
export const getQslVersions = __.invokeGetQslVersions;
/** 获取所有加载器的兼容性信息 */
export const getAllLoaderCompatibility = __.invokeGetAllLoaderCompatibility;
/** 使用指定加载器安装版本 */
export const installWithLoaders = __.invokeInstallWithLoaders;

/** 扫描已安装的游戏实例 */
export const scanInstances = __.invokeScanInstances;
/** 获取实例设置 */
export const getInstanceSettings = __.invokeGetInstanceSettings;
/** 更新实例设置 */
export const updateInstanceSettings = __.invokeUpdateInstanceSettings;
/** 获取系统内存信息 */
export const getSystemMemory = __.invokeGetSystemMemory;
/** 弹出 Java 路径选择对话框 */
export const selectJavaPath = __.invokeSelectJavaPath;
/** 获取单个实例信息 */
export const getInstance = __.invokeGetInstance;
/** 创建新实例 */
export const createInstance = __.invokeCreateInstance;
/** 删除实例 */
export const deleteInstance = __.invokeDeleteInstance;
/** 复制实例 */
export const copyInstance = __.invokeCopyInstance;
/** 重命名实例 */
export const renameInstance = __.invokeRenameInstance;
/** 更新实例信息 */
export const updateInstance = __.invokeUpdateInstance;
/** 获取实例根目录路径 */
export const getInstancesPath = __.invokeGetInstancesPath;
/** 获取下载根目录路径 */
export const getDownloadBasePath = __.invokeGetDownloadBasePath;
/** 设置下载根目录路径 */
export const setDownloadBasePath = __.invokeSetDownloadBasePath;
/** 部署版本到指定实例 */
export const deployVersionToInstance = __.invokeDeployVersionToInstance;
/** 检查版本是否已部署 */
export const isVersionDeployed = __.invokeIsVersionDeployed;

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

/** 扫描已知的 Minecraft 路径 */
export const scanKnownMcPaths = __.invokeScanKnownMcPaths;
/** 添加已知路径 */
export const addKnownPath = __.invokeAddKnownPath;
/** 移除已知路径 */
export const removeKnownPath = __.invokeRemoveKnownPath;
/** 设置默认文件夹 */
export const setDefaultFolder = __.invokeSetDefaultFolder;
/** 验证文件夹是否为有效的游戏目录 */
export const validateFolder = __.invokeValidateFolder;
/** 添加已验证的文件夹 */
export const addValidatedFolder = __.invokeAddValidatedFolder;

/** 获取完整配置 */
export const getConfig = __.invokeGetConfig;
/** 更新完整配置 */
export const updateConfig = __.invokeUpdateConfig;
/** 获取指定配置键的值 */
export const getConfigValue = __.invokeGetConfigValue;
/** 设置指定配置键的值 */
export const setConfigValue = __.invokeSetConfigValue;
/** 获取实例配置 */
export const getInstanceConfig = __.invokeGetInstanceConfig;
/** 更新实例配置 */
export const updateInstanceConfig = __.invokeUpdateInstanceConfig;
/** 删除实例配置 */
export const removeInstanceConfig = __.invokeRemoveInstanceConfig;
/** 重置配置为默认值 */
export const resetConfig = __.invokeResetConfig;
/** 导出配置到文件 */
export const exportConfig = __.invokeExportConfig;
/** 从文件导入配置 */
export const importConfig = __.invokeImportConfig;
/** 保存登录状态 */
export const saveLoginState = __.invokeSaveLoginState;
/** 清除登录状态 */
export const clearLoginState = __.invokeClearLoginState;

/** 获取路径配置 */
export const getPathConfig = __.invokeGetPathConfig;
/** 更新路径配置 */
export const updatePathConfig = __.invokeUpdatePathConfig;
/** 获取实例目录路径 */
export const getInstancePath = __.invokeGetInstancePath;
/** 获取版本目录路径 */
export const getVersionsPath = __.invokeGetVersionsPath;
/** 获取库文件目录路径 */
export const getLibrariesPath = __.invokeGetLibrariesPath;
/** 获取资源文件目录路径 */
export const getAssetsPath = __.invokeGetAssetsPath;
/** 获取本地库文件目录路径 */
export const getNativesPath = __.invokeGetNativesPath;

/** 扫描系统中已安装的 Java */
export const scanJavaInstallations = __.invokeScanJavaInstallations;

/** 获取系统字体列表 */
export const getSystemFonts = __.invokeGetSystemFonts;
/** 获取字体 */
export const getFont = __.invokeGetFont;
