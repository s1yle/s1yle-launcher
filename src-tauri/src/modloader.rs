use crate::log_info;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModLoaderType {
    Vanilla,
    Fabric,
    Forge,
    NeoForge,
}

impl ModLoaderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModLoaderType::Vanilla => "vanilla",
            ModLoaderType::Fabric => "fabric",
            ModLoaderType::Forge => "forge",
            ModLoaderType::NeoForge => "neoforge",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "vanilla" => Some(ModLoaderType::Vanilla),
            "fabric" => Some(ModLoaderType::Fabric),
            "forge" => Some(ModLoaderType::Forge),
            "neoforge" => Some(ModLoaderType::NeoForge),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryInfo {
    pub name: String,
    pub url: String,
    pub sha1: Option<String>,
    pub size: u64,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModLoaderInfo {
    pub version_id: String,
    pub mod_loader_type: ModLoaderType,
    pub minecraft_version: String,
    pub loader_version: Option<String>,
    pub main_class: String,
    pub libraries: Vec<LibraryInfo>,
    pub client_jar_required: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct FabricVersion {
    pub loader: FabricLoaderVersion,
    pub installer: Option<FabricInstallerVersion>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FabricLoaderVersion {
    pub version: String,
    pub builds: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FabricInstallerVersion {
    pub version: String,
    pub builds: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FabricVersionResponse {
    pub loader: Vec<FabricLoaderVersion>,
    pub installer: Vec<FabricInstallerVersion>,
    pub launcher_manager: Option<FabricLauncherMeta>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FabricLauncherMeta {
    pub version: String,
    pub stable: bool,
    pub url: String,
    pub sha1: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FabricVersionDetail {
    pub id: String,
    pub inherits_from: Option<String>,
    pub jar: Option<String>,
    pub main_class: FabricMainClass,
    pub arguments: FabricArguments,
    pub libraries: Vec<FabricLibrary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FabricMainClass {
    pub client: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FabricArguments {
    pub game: Vec<serde_json::Value>,
    pub jvm: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FabricLibrary {
    pub name: String,
    pub url: Option<String>,
    pub sha1: Option<String>,
    pub size: Option<u64>,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForgeVersionInfo {
    pub mc_version: String,
    pub forge_version: String,
    pub universal_jar_path: String,
    pub universal_jar_url: String,
    pub installer_jar_path: Option<String>,
    pub installer_jar_url: Option<String>,
    pub main_class: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModLoaderVersionList {
    pub mod_loader_type: ModLoaderType,
    pub minecraft_version: String,
    pub versions: Vec<ModLoaderVersionItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModLoaderVersionItem {
    pub version: String,
    pub stable: bool,
    pub url: Option<String>,
    pub sha1: Option<String>,
}

const FABRIC_META_BASE: &str = "https://meta.fabricmc.net/v2";

pub struct ModLoaderManager {
    pub base_path: PathBuf,
    pub fabric_cache: Mutex<HashMap<String, FabricVersionResponse>>,
    pub forge_cache: Mutex<HashMap<String, Vec<ForgeVersionInfo>>>,
}

impl ModLoaderManager {
    pub fn new(base_path: PathBuf) -> Self {
        println!("ModLoaderManager base_path: {:?}", base_path);
        Self {
            base_path,
            fabric_cache: Mutex::new(HashMap::new()),
            forge_cache: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_installed_mod_loaders(&self, version_id: &str) -> Vec<ModLoaderType> {
        let version_dir = self.base_path.join("versions").join(version_id);
        let mut loaders = Vec::new();

        if version_dir.exists() {
            loaders.push(ModLoaderType::Vanilla);
        }

        let fabric_dir = self
            .base_path
            .join("versions")
            .join(format!("{}-fabric", version_id));
        if fabric_dir.exists() {
            loaders.push(ModLoaderType::Fabric);
        }

        let forge_dir = self
            .base_path
            .join("versions")
            .join(format!("{}-forge", version_id));
        if forge_dir.exists() {
            loaders.push(ModLoaderType::Forge);
        }

        loaders
    }
}

fn get_maven_url_for_fabric_library(name: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() != 3 {
        return None;
    }

    let group = parts[0];
    let artifact = parts[1];
    let version = parts[2];

    let path = format!(
        "{}/{}/{}/{}-{}.jar",
        group.replace('.', "/"),
        artifact,
        version,
        artifact,
        version
    );

    let url = format!("https://maven.fabricmc.net/{}", path);
    let path = format!("maven/fabric/{}", path);

    Some((url, path))
}

#[tauri::command]
pub async fn get_fabric_versions(mc_version: String) -> Result<ModLoaderVersionList, String> {
    log_info!("获取 Fabric 版本列表 for MC {}", mc_version);

    let url = format!("{}/v2/versions/loader/{}", FABRIC_META_BASE, mc_version);
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("获取 Fabric 版本失败: {}", e))?;

    let versions: Vec<FabricLoaderVersion> = response
        .json()
        .await
        .map_err(|e| format!("解析 Fabric 版本失败: {}", e))?;

    let items: Vec<ModLoaderVersionItem> = versions
        .into_iter()
        .map(|v| ModLoaderVersionItem {
            version: v.version,
            stable: v.builds.map(|b| b >= 0).unwrap_or(true),
            url: None,
            sha1: None,
        })
        .collect();

    log_info!("获取到 {} 个 Fabric 版本", items.len());

    Ok(ModLoaderVersionList {
        mod_loader_type: ModLoaderType::Fabric,
        minecraft_version: mc_version,
        versions: items,
    })
}

#[tauri::command]
pub async fn get_fabric_version_detail(
    mc_version: String,
    loader_version: String,
) -> Result<FabricVersionDetail, String> {
    log_info!(
        "获取 Fabric 版本详情: MC {} + Loader {}",
        mc_version,
        loader_version
    );

    let url = format!(
        "{}/v2/versions/loader/{}/{}",
        FABRIC_META_BASE, mc_version, loader_version
    );
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("获取 Fabric 版本详情失败: {}", e))?;

    let detail: FabricVersionDetail = response
        .json()
        .await
        .map_err(|e| format!("解析 Fabric 版本详情失败: {}", e))?;

    Ok(detail)
}

#[tauri::command]
pub async fn build_fabric_launch_config(
    mc_version: String,
    loader_version: String,
    _game_dir: String,
    _assets_dir: String,
    _username: String,
    _uuid: String,
    _access_token: Option<String>,
    _java_path: String,
    _memory_mb: u32,
) -> Result<ModLoaderInfo, String> {
    log_info!(
        "构建 Fabric 启动配置: MC {} + Loader {}",
        mc_version,
        loader_version
    );

    let fabric_meta = get_fabric_version_detail(mc_version.clone(), loader_version.clone()).await?;

    let mut libraries = Vec::new();

    for lib in &fabric_meta.libraries {
        let (url, path) = get_maven_url_for_fabric_library(&lib.name).unwrap_or_else(|| {
            let fallback_url = lib.url.clone().unwrap_or_else(|| {
                let parts: Vec<&str> = lib.name.split(':').collect();
                if parts.len() == 3 {
                    format!(
                        "https://maven.fabricmc.net/{}/{}/{}/{}-{}.jar",
                        parts[0].replace('.', "/"),
                        parts[1],
                        parts[2],
                        parts[1],
                        parts[2]
                    )
                } else {
                    String::new()
                }
            });
            let fallback_path = lib.path.clone().unwrap_or_else(|| {
                let parts: Vec<&str> = lib.name.split(':').collect();
                if parts.len() == 3 {
                    format!(
                        "maven/fabric/{}/{}/{}/{}-{}.jar",
                        parts[0].replace('.', "/"),
                        parts[1],
                        parts[2],
                        parts[1],
                        parts[2]
                    )
                } else {
                    lib.name.clone()
                }
            });
            (fallback_url, fallback_path)
        });

        libraries.push(LibraryInfo {
            name: lib.name.clone(),
            url,
            sha1: lib.sha1.clone(),
            size: lib.size.unwrap_or(0),
            path,
        });
    }

    let loader_jar_url = format!(
        "https://maven.fabricmc.net/net/fabricmc/fabric-loader/{}/fabric-loader-{}-{}.jar",
        loader_version, loader_version, mc_version
    );
    let loader_jar_path = format!(
        "maven/fabric/net/fabricmc/fabric-loader/{}/fabric-loader-{}-{}.jar",
        loader_version, loader_version, mc_version
    );

    libraries.push(LibraryInfo {
        name: format!("net.fabricmc:fabric-loader:{}", loader_version),
        url: loader_jar_url,
        sha1: None,
        size: 0,
        path: loader_jar_path,
    });

    let version_id = format!("{}-fabric-{}", mc_version, loader_version);

    log_info!("Fabric 启动配置构建完成: {}", version_id);

    Ok(ModLoaderInfo {
        version_id,
        mod_loader_type: ModLoaderType::Fabric,
        minecraft_version: mc_version,
        loader_version: Some(loader_version),
        main_class: fabric_meta.main_class.client,
        libraries,
        client_jar_required: true,
    })
}

#[tauri::command]
pub async fn get_forge_versions(mc_version: String) -> Result<ModLoaderVersionList, String> {
    log_info!("获取 Forge 版本列表 for MC {}", mc_version);

    let url = "https://maven.neoforged.net/releases/net/neoforged/forge/maven-metadata.json";
    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("获取 Forge 版本失败: {}", e))?;

    #[derive(Deserialize)]
    struct ForgeMavenMeta {
        versions: Vec<String>,
    }

    let meta: ForgeMavenMeta = response
        .json()
        .await
        .map_err(|e| format!("解析 Forge 元数据失败: {}", e))?;

    let mc_prefix = format!("{}-", mc_version);
    let forge_versions: Vec<ModLoaderVersionItem> = meta
        .versions
        .into_iter()
        .filter(|v| v.starts_with(&mc_prefix))
        .map(|v| {
            let forge_ver = v.replace(&mc_prefix, "");
            ModLoaderVersionItem {
                version: forge_ver,
                stable: true,
                url: Some(format!(
                    "https://maven.neoforged.net/releases/net/neoforged/forge/{}/{}/forge-{}-{}/forge-{}-{}-universal.jar",
                    v, v, v, mc_version, v, mc_version
                )),
                sha1: None,
            }
        })
        .collect();

    log_info!("获取到 {} 个 Forge 版本", forge_versions.len());

    Ok(ModLoaderVersionList {
        mod_loader_type: ModLoaderType::Forge,
        minecraft_version: mc_version,
        versions: forge_versions,
    })
}

#[tauri::command]
pub async fn build_forge_launch_config(
    mc_version: String,
    forge_version: String,
    _game_dir: String,
    _assets_dir: String,
    _username: String,
    _uuid: String,
    _access_token: Option<String>,
    _java_path: String,
    _memory_mb: u32,
) -> Result<ModLoaderInfo, String> {
    log_info!(
        "构建 Forge 启动配置: MC {} + Forge {}",
        mc_version,
        forge_version
    );

    let full_version = format!("{}-{}", mc_version, forge_version);

    let universal_jar_url = format!(
        "https://maven.neoforged.net/releases/net/neoforged/forge/{}/{}/forge-{}-{}-universal.jar",
        full_version, full_version, full_version, mc_version
    );
    let universal_jar_path = format!(
        "maven/neoforged/net/neoforged/forge/{}/{}/forge-{}-{}-universal.jar",
        full_version, full_version, full_version, mc_version
    );

    let libraries = vec![LibraryInfo {
        name: format!("net.neoforged:forge:{}", full_version),
        url: universal_jar_url,
        sha1: None,
        size: 0,
        path: universal_jar_path,
    }];

    let main_class = if forge_version.parse::<f64>().unwrap_or(0.0) >= 1.20f64 {
        "net.neoforged.fml.common.launcher.FMLTweaker".to_string()
    } else {
        "cpw.mods.modlauncher.Launcher".to_string()
    };

    log_info!("Forge 启动配置构建完成: {}", full_version);

    Ok(ModLoaderInfo {
        version_id: full_version,
        mod_loader_type: ModLoaderType::Forge,
        minecraft_version: mc_version,
        loader_version: Some(forge_version),
        main_class,
        libraries,
        client_jar_required: true,
    })
}

#[tauri::command]
pub fn get_installed_mod_loaders(
    version_id: String,
    mod_loader_manager: State<'_, ModLoaderManager>,
) -> Vec<ModLoaderType> {
    mod_loader_manager.get_installed_mod_loaders(&version_id)
}
