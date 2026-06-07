export * from "@/api";
export type * from "@/api"

import * as __ from "@/api";

export const getAccountList = __.invokeGetAccountList;
export const getCurrentAccount = __.invokeGetCurrentAccount;
export const deleteAccount = __.invokeDeleteAccount;
export const setCurrentAccount = __.invokeSetCurrentAccount;
export const saveAccount = __.invokeSaveAccount;
export const loadAccount = __.invokeLoadAccount;

export const launchInstance = __.invokeLaunchInstance;
export const stopInstance = __.invokeStopInstance;
export const getLaunchStatus = __.invokeGetLaunchStatus;
export const getLaunchConfig = __.invokeGetLaunchConfig;
export const updateLaunchConfig = __.invokeUpdateLaunchConfig;

export const getVersionManifest = __.invokeGetVersionManifest;
export const getVersionDetail = __.invokeGetVersionDetail;
export const getVersionDownloadManifest = __.invokeGetVersionDownloadManifest;
export const downloadFile = __.invokeDownloadFile;
export const deployVersionFiles = __.invokeDeployVersionFiles;
export const deployVersionHmcl = __.invokeDeployVersionHmcl;
export const migrateDirectoryStructure = __.invokeMigrateDirectoryStructure;
export const getDownloadTasks = __.invokeGetDownloadTasks;
export const getDownloadTask = __.invokeGetDownloadTask;
export const cancelDownload = __.invokeCancelDownload;
export const clearCompletedTasks = __.invokeClearCompletedTasks;
export const getGameVersions = __.invokeGetGameVersions;
export const downloadAndDeploy = __.invokeDownloadAndDeploy;

export const getFabricVersions = __.invokeGetFabricVersions;
export const getFabricVersionDetail = __.invokeGetFabricVersionDetail;
export const buildFabricLaunchConfig = __.invokeBuildFabricLaunchConfig;
export const getForgeVersions = __.invokeGetForgeVersions;
export const buildForgeLaunchConfig = __.invokeBuildForgeLaunchConfig;
export const getInstalledModLoaders = __.invokeGetInstalledModLoaders;
export const getQuiltVersions = __.invokeGetQuiltVersions;
export const getFabricApiVersions = __.invokeGetFabricApiVersions;
export const getQslVersions = __.invokeGetQslVersions;
export const getAllLoaderCompatibility = __.invokeGetAllLoaderCompatibility;
export const installWithLoaders = __.invokeInstallWithLoaders;

export const scanInstances = __.invokeScanInstances;
export const getInstanceSettings = __.invokeGetInstanceSettings;
export const updateInstanceSettings = __.invokeUpdateInstanceSettings;
export const getSystemMemory = __.invokeGetSystemMemory;
export const selectJavaPath = __.invokeSelectJavaPath;
export const getInstance = __.invokeGetInstance;
export const createInstance = __.invokeCreateInstance;
export const deleteInstance = __.invokeDeleteInstance;
export const copyInstance = __.invokeCopyInstance;
export const renameInstance = __.invokeRenameInstance;
export const updateInstance = __.invokeUpdateInstance;
export const getInstancesPath = __.invokeGetInstancesPath;
export const getDownloadBasePath = __.invokeGetDownloadBasePath;
export const setDownloadBasePath = __.invokeSetDownloadBasePath;
export const deployVersionToInstance = __.invokeDeployVersionToInstance;
export const isVersionDeployed = __.invokeIsVersionDeployed;

export const closeWindow = __.invokeCloseWindow;
export const saveWindowPosition = __.invokeSaveWindowPosition;
export const loadWindowPosition = __.invokeLoadWindowPosition;
export const openFolder = __.invokeOpenFolder;
export const openUrl = __.invokeOpenUrl;

export const scanKnownMcPaths = __.invokeScanKnownMcPaths;
export const addKnownPath = __.invokeAddKnownPath;
export const removeKnownPath = __.invokeRemoveKnownPath;
export const setDefaultFolder = __.invokeSetDefaultFolder;
export const validateFolder = __.invokeValidateFolder;
export const addValidatedFolder = __.invokeAddValidatedFolder;

export const getConfig = __.invokeGetConfig;
export const updateConfig = __.invokeUpdateConfig;
export const getConfigValue = __.invokeGetConfigValue;
export const setConfigValue = __.invokeSetConfigValue;
export const getInstanceConfig = __.invokeGetInstanceConfig;
export const updateInstanceConfig = __.invokeUpdateInstanceConfig;
export const removeInstanceConfig = __.invokeRemoveInstanceConfig;
export const resetConfig = __.invokeResetConfig;
export const exportConfig = __.invokeExportConfig;
export const importConfig = __.invokeImportConfig;
export const getPathConfig = __.invokeGetPathConfig;
export const updatePathConfig = __.invokeUpdatePathConfig;
export const getInstancePath = __.invokeGetInstancePath;
export const getVersionsPath = __.invokeGetVersionsPath;
export const getLibrariesPath = __.invokeGetLibrariesPath;
export const getAssetsPath = __.invokeGetAssetsPath;
export const getNativesPath = __.invokeGetNativesPath;

// java.ts
export const scanJavaInstallations = __.invokeScanJavaInstallations;

