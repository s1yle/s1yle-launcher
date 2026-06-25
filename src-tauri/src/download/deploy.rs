use crate::config::models::{InstanceConfig, JavaConfig, MemoryConfig, GraphicsConfig};
use crate::instance::manager::InstanceManager;
use crate::modloader::ModLoaderType;
use crate::download::manager::DownloadManager;
use crate::download::models::*;
use crate::download::version::{get_version_detail, parse_version_downloads};
use crate::{log_error, log_info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager, State};
use zip;

/// 部署进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct DeployProgress {
    pub total: usize,
    pub current: usize,
    pub current_file: String,
    pub status: String,
}

/// 部署版本文件到指定实例路径
#[tauri::command]
pub async fn deploy_version_files(
    version_id: String,
    instance_path: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("开始部署版本 {} 到实例", version_id);
    deploy_version_to_instance(instance_path, version_id, download_manager).await
}

/// 版本部署（全局资源共享模式）
#[tauri::command]
pub async fn deploy_version_global(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    use crate::config::{MINECRAFT_DIR, VERSIONS_DIR, LIBRARIES_DIR, ASSETS_DIR};
    
    log_info!("==================== 开始版本部署（全局资源） ====================");
    log_info!("版本 ID: {}", version_id);

    let version_json = get_version_detail(version_id.clone()).await?;
    let version_name = version_json["id"]
        .as_str()
        .unwrap_or(&version_id)
        .to_string();
    
    log_info!("版本名称：{}", version_name);

    let manifest = parse_version_downloads(&version_json).await?;
    
    log_info!("下载清单：libraries={}, assets={}, natives={}", 
        manifest.libraries.len(), manifest.assets.len(), manifest.natives.len());

    // 创建目录结构
    let version_dir = VERSIONS_DIR.join(&version_name);
    let libraries_dir = LIBRARIES_DIR.clone();
    let assets_dir = ASSETS_DIR.clone();
    let natives_dir = version_dir.join("natives");

    log_info!("目标目录：");
    log_info!("  Minecraft 根目录：{:?}", *MINECRAFT_DIR);
    log_info!("  版本目录：{:?}", version_dir);
    log_info!("  全局库目录：{:?}", libraries_dir);
    log_info!("  全局资源目录：{:?}", assets_dir);
    log_info!("  原生库目录：{:?}", natives_dir);

    // 创建必要的目录
    fs::create_dir_all(&*MINECRAFT_DIR).map_err(|e| format!("创建 Minecraft 目录失败：{}", e))?;
    fs::create_dir_all(&version_dir).map_err(|e| format!("创建版本目录失败：{}", e))?;
    fs::create_dir_all(&libraries_dir).map_err(|e| format!("创建库目录失败：{}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建资源目录失败：{}", e))?;
    fs::create_dir_all(&natives_dir).map_err(|e| format!("创建原生库目录失败：{}", e))?;

    // 从下载目录复制文件
    let dm = download_manager.inner();
    let version_download_dir = dm.get_version_download_path(&version_name);
    log_info!("版本下载目录：{:?}", version_download_dir);

    let mut deployed_count = 0;
    let mut total_count = 0;

    // 复制库文件到全局目录
    for lib in &manifest.libraries {
        total_count += 1;
        let source = version_download_dir.join(&lib.path);
        let dest = libraries_dir.join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建库目录失败：{}", e))?;
        }

        if source.exists() {
            if !dest.exists() {
                fs::copy(&source, &dest).map_err(|e| format!("复制库文件失败：{}", e))?;
                log_info!("[{}/{}] 复制库：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
            } else {
                log_info!("[{}/{}] 库已存在（共享）：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
            }
            deployed_count += 1;
        } else if dest.exists() {
            log_info!("[{}/{}] 库已存在（共享）：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
            deployed_count += 1;
        } else {
            log_error!("库文件不存在：{:?}", source);
        }
    }

    // 复制原生库
    for native in &manifest.natives {
        total_count += 1;
        let source = version_download_dir.join(&native.path);
        if source.exists() {
            extract_jar(&source, &natives_dir)?;
            log_info!("解压原生库：{}", native.path);
            deployed_count += 1;
        } else {
            log_error!("原生库不存在：{:?}", source);
        }
    }

    // 复制资源文件到全局目录
    for asset in &manifest.assets {
        total_count += 1;
        let source = version_download_dir.join(&asset.path);
        let dest = assets_dir.join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败：{}", e))?;
        }

        if source.exists() {
            if !dest.exists() {
                fs::copy(&source, &dest).map_err(|e| format!("复制资源文件失败：{}", e))?;
            }
            log_info!("复制资源：{}", asset.path);
            deployed_count += 1;
        } else if dest.exists() {
            log_info!("资源已存在（共享）：{}", asset.path);
            deployed_count += 1;
        } else {
            log_error!("资源文件不存在：{:?}", source);
        }
    }

    // 复制客户端 jar
    if let Some(ref client) = manifest.client_jar {
        total_count += 1;
        let source = version_download_dir.join(&client.path);
        let dest = version_dir.join(format!("{}.jar", &version_name));

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制客户端 jar 失败：{}", e))?;
            log_info!("✓ 复制客户端：{}", dest.display());
            deployed_count += 1;
        } else {
            log_error!("客户端 jar 不存在：{:?}", source);
            return Err(format!("客户端 jar 不存在：{}", source.display()));
        }
    }

    // 复制版本 JSON
    let json_source = version_download_dir.join(format!("{}.json", &version_name));
    let json_dest = version_dir.join(format!("{}.json", &version_name));
    if json_source.exists() {
        fs::copy(&json_source, &json_dest).map_err(|e| format!("复制版本 JSON 失败：{}", e))?;
        log_info!("✓ 复制版本 JSON：{}", json_dest.display());
    }

    log_info!("==================== 部署完成 ====================");
    log_info!("部署进度：{}/{} 文件", deployed_count, total_count);
    log_info!("版本目录：{:?}", version_dir);
    
    Ok(format!("版本 {} 已部署 ({} / {} 文件)", version_id, deployed_count, total_count))
}

/// 解压 jar 文件中的内容到指定目录（用于原生库）
fn extract_jar(jar_path: &PathBuf, dest_dir: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(jar_path).map_err(|e| format!("打开 jar 文件失败：{}", e))?;

    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("解析 zip 失败：{}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("读取 zip 条目失败：{}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => dest_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| format!("创建目录失败：{}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| format!("创建父目录失败：{}", e))?;
                }
            }

            let mut outfile =
                fs::File::create(&outpath).map_err(|e| format!("创建文件失败：{}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("复制文件失败：{}", e))?;
        }
    }

    Ok(())
}

/// 检查版本是否已部署（检查 jar 文件是否存在）
#[tauri::command]
pub fn is_version_deployed(
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> bool {
    let base_path = download_manager.base_path.lock().unwrap();
    let version_jar = base_path
        .join("versions")
        .join(&version_id)
        .join(format!("{}.jar", version_id));
    version_jar.exists()
}

/// 将下载的版本文件部署到指定的实例路径
#[tauri::command]
pub async fn deploy_version_to_instance(
    instance_path: String,
    version_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("==================== 开始部署版本到实例 ====================");
    log_info!("版本 ID: {}", version_id);
    log_info!("实例路径：{}", instance_path);
    
    let version_json = get_version_detail(version_id.clone()).await?;
    
    let version_name = version_json["id"]
        .as_str()
        .unwrap_or(&version_id)
        .to_string();
    
    log_info!("版本名称：{}", version_name);

    let manifest = parse_version_downloads(&version_json).await?;
    
    log_info!("下载清单：libraries={}, assets={}, natives={}", 
        manifest.libraries.len(), manifest.assets.len(), manifest.natives.len());

    let instance_dir = PathBuf::from(&instance_path);
    let versions_dir = instance_dir.join("versions");
    let version_base_dir = versions_dir.join(&version_name);
    let libraries_dir = version_base_dir.join("libraries");
    let assets_dir = version_base_dir.join("assets");
    let natives_dir = version_base_dir.join("natives");
    let indexes_dir = version_base_dir.join("indexes");
    let objects_dir = version_base_dir.join("objects");

    log_info!("目标目录：");
    log_info!("  实例根目录：{:?}", instance_dir);
    log_info!("  versions 目录：{:?}", versions_dir);
    log_info!("  版本根目录：{:?}", version_base_dir);
    log_info!("  libraries: {:?}", libraries_dir);
    log_info!("  assets: {:?}", assets_dir);
    log_info!("  natives: {:?}", natives_dir);
    log_info!("  indexes: {:?}", indexes_dir);
    log_info!("  objects: {:?}", objects_dir);

    fs::create_dir_all(&versions_dir).map_err(|e| format!("创建 versions 目录失败：{}", e))?;
    fs::create_dir_all(&version_base_dir).map_err(|e| format!("创建版本目录失败：{}", e))?;
    fs::create_dir_all(&libraries_dir).map_err(|e| format!("创建 libraries 目录失败：{}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建 assets 目录失败：{}", e))?;
    fs::create_dir_all(&natives_dir).map_err(|e| format!("创建 natives 目录失败：{}", e))?;
    fs::create_dir_all(&indexes_dir).map_err(|e| format!("创建 indexes 目录失败：{}", e))?;
    fs::create_dir_all(&objects_dir).map_err(|e| format!("创建 objects 目录失败：{}", e))?;

    // 从版本下载目录复制文件（/.smcl/download/{version_name}/）
    let version_download_dir = download_manager.get_version_download_path(&version_name);
    log_info!("版本下载目录：{:?}", version_download_dir);

    let mut deployed_count = 0;
    let mut total_count = 0;

    // 复制库文件
    for lib in &manifest.libraries {
        total_count += 1;
        let source = version_download_dir.join(&lib.path);
        let dest = libraries_dir.join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建库目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制库文件失败：{}", e))?;
            log_info!("[{}/{}] 复制库：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
            deployed_count += 1;
        } else if dest.exists() {
            log_info!("[{}/{}] 库已存在：{}", deployed_count + 1, manifest.libraries.len(), lib.path);
            deployed_count += 1;
        } else {
            log_error!("库文件不存在：{:?}", source);
        }
    }

    // 复制原生库
    if manifest.natives.first().is_some() {
        for native in &manifest.natives {
            total_count += 1;
            let source = version_download_dir.join(&native.path);
            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                log_info!("解压原生库：{}", native.path);
                deployed_count += 1;
            } else {
                log_error!("原生库不存在：{:?}", source);
            }
        }
    }

    // 复制资源文件
    for asset in &manifest.assets {
        total_count += 1;
        let source = version_download_dir.join(&asset.path);
        let dest = assets_dir.join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制资源文件失败：{}", e))?;
            log_info!("复制资源：{}", asset.path);
            deployed_count += 1;
        } else if dest.exists() {
            log_info!("资源已存在：{}", asset.path);
            deployed_count += 1;
        } else {
            log_error!("资源文件不存在：{:?}", source);
        }
    }

    // 复制客户端 jar
    if let Some(ref client) = manifest.client_jar {
        total_count += 1;
        let source = version_download_dir.join(&client.path);
        let dest = version_base_dir.join(format!("{}.jar", &version_name));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建版本目录失败：{}", e))?;
        }

        log_info!("复制客户端 jar:");
        log_info!("  源文件：{:?}", source);
        log_info!("  目标：{:?}", dest);
        log_info!("  源文件存在：{}", source.exists());

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制客户端 jar 失败：{}", e))?;
            log_info!("✓ 复制客户端：{}", dest.display());
            deployed_count += 1;
        } else {
            log_error!("客户端 jar 不存在：{:?}", source);
            return Err(format!("客户端 jar 不存在：{}", source.display()));
        }
    }

    // 复制资源索引
    if let Some(ref index) = manifest.asset_index {
        total_count += 1;
        let source = version_download_dir.join(&index.path);
        let dest = indexes_dir.join(format!("{}.json", &version_name));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建索引目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制资源索引失败：{}", e))?;
            deployed_count += 1;
        }
    }

    log_info!("==================== 部署完成 ====================");
    log_info!("部署进度：{}/{} 文件", deployed_count, total_count);
    log_info!("实例路径：{}", instance_path);
    log_info!("版本目录：{:?}", version_base_dir);
    
    Ok(format!("版本 {} 已部署到实例 ({} / {} 文件)", version_id, deployed_count, total_count))
}

/// 部署单个文件到目标路径（已弃用）
#[allow(dead_code)]
fn deploy_file_to_path(base_path: &PathBuf, file: &FileDownload) -> Result<String, String> {
    let dest_path = base_path.join(&file.path);

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败：{}", e))?;
    }

    let source_path = base_path.join("temp").join(&file.path);

    if source_path.exists() {
        fs::rename(&source_path, &dest_path).map_err(|e| format!("移动文件失败：{}", e))?;
        log_info!("部署文件：{} -> {}", file.path, dest_path.display());
    } else if dest_path.exists() {
        log_info!("文件已存在：{}", file.path);
    } else {
        return Err(format!("源文件不存在：{}", source_path.display()));
    }

    Ok(dest_path.to_string_lossy().to_string())
}

/// 部署选项（下载并部署请求参数）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployOptions {
    /// 实例名称
    pub instance_name: String,
    /// 版本 ID
    pub version_id: String,
    /// 加载器类型
    pub loader_type: ModLoaderType,
    /// 加载器版本
    pub loader_version: Option<String>,
    /// 目标已存在实例（可选）
    pub target_existing_instance: Option<String>,
}

/// 部署结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployResult {
    /// 是否成功
    pub success: bool,
    /// 实例 ID
    pub instance_id: String,
    /// 实例名称
    pub instance_name: String,
    /// 版本
    pub version: String,
    /// 已部署文件数
    pub deployed_files_count: usize,
    /// 总文件数
    pub total_files_count: usize,
    /// 消息
    pub message: String,
}

/// 下载并部署版本到目标实例（包含下载、部署、配置写入全流程）
#[tauri::command]
pub async fn download_and_deploy(
    options: DeployOptions,
    instance_manager: State<'_, InstanceManager>,
    download_manager: State<'_, DownloadManager>,
    app_handle: tauri::AppHandle,
) -> Result<DeployResult, String> {
    log_info!("========== 开始下载并部署 ==========");
    log_info!("目标: {} | 版本: {} | 加载器: {:?}", 
        options.instance_name, options.version_id, options.loader_type);

    let (instance_id, instance_path) = if let Some(ref existing_id) = options.target_existing_instance {
        let existing = instance_manager.get_instance(existing_id)
            .ok_or_else(|| format!("目标实例不存在: {}", existing_id))?;
        (existing.id.clone(), PathBuf::from(&existing.path))
    } else {
        let new_instance = instance_manager.create_instance(&options.instance_name, &options.version_id)
            .map_err(|e| format!("创建实例失败: {}", e))?;
        (new_instance.id.clone(), PathBuf::from(&new_instance.path))
    };

    app_handle.emit("deploy-status", serde_json::json!({
        "phase": "downloading",
        "progress": 0
    })).ok();

    let version_detail = get_version_detail(options.version_id.clone()).await?;
    let manifest = parse_version_downloads(&version_detail).await?;

    let dm = download_manager.inner();
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    let total_libraries = manifest.libraries.len();
    let total_assets = manifest.assets.len();
    let total_natives = manifest.natives.len();
    let has_client_jar = manifest.client_jar.is_some();
    let mut completed = 0usize;
    let total_files = total_libraries + total_assets + total_natives + if has_client_jar { 1 } else { 0 };

    app_handle.emit("deploy-status", serde_json::json!({
        "phase": "downloading",
        "progress": 0,
        "total": total_files
    })).ok();

    log_info!("开始下载: libraries={}, assets={}, natives={}, client_jar={}", 
        total_libraries, total_assets, total_natives, has_client_jar);

    // ====== Phase 1: 下载所有库文件 ======
    for (idx, lib) in manifest.libraries.iter().enumerate() {
        let dest_path = dm.get_version_download_path(&options.version_id).join(&lib.path);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
        
        if !dest_path.exists() {
            let response = client.get(&lib.url)
                .send()
                .await
                .map_err(|e| format!("下载请求失败 [{}]: {}", lib.url, e))?
                .error_for_status()
                .map_err(|e| format!("HTTP 错误 [{}]: {}", lib.url, e))?;

            let data = response.bytes().await.map_err(|e| format!("读取响应体失败: {}", e))?;
            std::fs::write(&dest_path, &data).map_err(|e| format!("写入文件失败: {}", e))?;
            
            log_info!("[{}/{}] 已下载: {}", idx + 1, total_libraries, lib.path);
        }
        
        completed += 1;
        app_handle.emit("deploy-progress", serde_json::json!({
            "current": completed, "total": total_files, "file": &lib.path,
            "phase": "downloading_libraries",
            "version_id": &options.version_id
        })).ok();
    }

    // ====== Phase 2: 下载资源文件 ======
    for (idx, asset) in manifest.assets.iter().enumerate() {
        let dest_path = dm.get_version_download_path(&options.version_id).join(&asset.path);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
        
        if !dest_path.exists() {
            let response = client.get(&asset.url)
                .send()
                .await
                .map_err(|e| format!("下载资源失败 [{}]: {}", asset.url, e))?
                .error_for_status()
                .map_err(|e| format!("HTTP 错误 [{}]: {}", asset.url, e))?;

            let data = response.bytes().await.map_err(|e| format!("读取响应体失败: {}", e))?;
            std::fs::write(&dest_path, &data).map_err(|e| format!("写入文件失败: {}", e))?;
            
            log_info!("[{}/{}] 已下载资源: {}", idx + 1, total_assets, asset.path);
        }
        
        completed += 1;
        app_handle.emit("deploy-progress", serde_json::json!({
            "current": completed, "total": total_files, "file": &asset.path,
            "phase": "downloading_assets",
            "version_id": &options.version_id
        })).ok();
    }

    // ====== Phase 3: 下载原生库 ======
    for (idx, native) in manifest.natives.iter().enumerate() {
        let dest_path = dm.get_version_download_path(&options.version_id).join(&native.path);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
        
        if !dest_path.exists() {
            let response = client.get(&native.url)
                .send()
                .await
                .map_err(|e| format!("下载原生库失败 [{}]: {}", native.url, e))?
                .error_for_status()
                .map_err(|e| format!("HTTP 错误 [{}]: {}", native.url, e))?;

            let data = response.bytes().await.map_err(|e| format!("读取响应体失败: {}", e))?;
            std::fs::write(&dest_path, &data).map_err(|e| format!("写入文件失败: {}", e))?;
            
            log_info!("[{}/{}] 已下载原生库: {}", idx + 1, total_natives, native.path);
        }
        
        completed += 1;
        app_handle.emit("deploy-progress", serde_json::json!({
            "current": completed, "total": total_files, "file": &native.path,
            "phase": "downloading_natives",
            "version_id": &options.version_id
        })).ok();
    }

    // ====== Phase 4: 下载客户端 jar ======
    if let Some(ref client_jar) = manifest.client_jar {
        let dest_path = dm.get_version_download_path(&options.version_id).join(&client_jar.path);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        if !dest_path.exists() {
            let response = client.get(&client_jar.url)
                .send()
                .await
                .map_err(|e| format!("下载客户端jar失败 [{}]: {}", client_jar.url, e))?
                .error_for_status()
                .map_err(|e| format!("HTTP 错误 [{}]: {}", client_jar.url, e))?;

            let data = response.bytes().await.map_err(|e| format!("读取响应体失败: {}", e))?;
            std::fs::write(&dest_path, &data).map_err(|e| format!("写入文件失败: {}", e))?;

            log_info!("已下载客户端 jar: {}", client_jar.path);
        }

        completed += 1;
        app_handle.emit("deploy-progress", serde_json::json!({
            "current": completed, "total": total_files, "file": &client_jar.path,
            "phase": "downloading_client",
            "version_id": &options.version_id
        })).ok();
    }

    app_handle.emit("deploy-status", serde_json::json!({ "phase": "deploying", "progress": 50 })).ok();

    let dm = download_manager.inner();
    let deploy_msg = deploy_version_internal(&instance_path, &options.version_id, dm).await?;

    write_instance_config_to_app_config(&app_handle, &instance_id, &options).await?;

    app_handle.emit("deploy-complete", serde_json::json!({
        "instance_id": &instance_id,
        "version_id": &options.version_id,
        "status": "success"
    })).ok();

    log_info!("========== 部署完成 ==========");

    Ok(DeployResult {
        success: true,
        instance_id,
        instance_name: options.instance_name,
        version: options.version_id,
        deployed_files_count: completed,
        total_files_count: total_files,
        message: deploy_msg,
    })
}

/// 将实例配置写入应用全局配置
async fn write_instance_config_to_app_config(
    app_handle: &tauri::AppHandle,
    instance_id: &str,
    options: &DeployOptions,
) -> Result<(), String> {
    let config_manager = app_handle.state::<crate::config::ConfigManager>();
    
    let instance_config = InstanceConfig {
        id: instance_id.to_string(),
        name: options.instance_name.clone(),
        version: options.version_id.clone(),
        loader_type: options.loader_type.clone(),
        loader_version: options.loader_version.clone(),
        java: JavaConfig {
            java_path: None,
            java_args: vec![],
            use_bundled: true,
        },
        memory: MemoryConfig {
            min_memory: 512,
            max_memory: 2048,
        },
        graphics: GraphicsConfig {
            width: 854,
            height: 480,
            fullscreen: false,
        },
        custom_args: vec![],
        icon_path: None,
        last_played: None,
        created_at: chrono::Utc::now().timestamp(),
        enabled: true,
    };

    config_manager.update_value(
        format!("instance_configs.{}", instance_id).as_str(),
        serde_json::to_value(&instance_config)
            .map_err(|e| format!("序列化失败: {}", e))?
    )?;

    log_info!("已写入实例配置到 app_config.json: {}", instance_id);
    Ok(())
}

/// 内部部署函数：将版本文件从下载目录复制到实例目录
async fn deploy_version_internal(
    instance_path: &PathBuf,
    version_id: &str,
    download_manager: &DownloadManager,
) -> Result<String, String> {
    log_info!("==================== 开始部署版本到实例 ====================");
    log_info!("版本 ID: {}", version_id);
    log_info!("实例路径：{:?}", instance_path);

    let version_json = get_version_detail(version_id.to_string()).await?;

    let version_name = version_json["id"]
        .as_str()
        .unwrap_or(version_id)
        .to_string();

    log_info!("版本名称：{}", version_name);

    let manifest = parse_version_downloads(&version_json).await?;

    log_info!("下载清单：libraries={}, assets={}, natives={}",
        manifest.libraries.len(), manifest.assets.len(), manifest.natives.len());

    let libraries_dir = instance_path.join("libraries");
    let assets_dir = instance_path.join("assets");
    let natives_dir = instance_path.join("natives");
    let indexes_dir = instance_path.join("indexes");
    let objects_dir = instance_path.join("objects");

    log_info!("目标目录：");
    log_info!("  实例根目录：{:?}", instance_path);
    log_info!("  libraries: {:?}", libraries_dir);
    log_info!("  assets: {:?}", assets_dir);
    log_info!("  natives: {:?}", natives_dir);
    log_info!("  indexes: {:?}", indexes_dir);
    log_info!("  objects: {:?}", objects_dir);

    fs::create_dir_all(&libraries_dir).map_err(|e| format!("创建 libraries 目录失败：{}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建 assets 目录失败：{}", e))?;
    fs::create_dir_all(&natives_dir).map_err(|e| format!("创建 natives 目录失败：{}", e))?;
    fs::create_dir_all(&indexes_dir).map_err(|e| format!("创建 indexes 目录失败：{}", e))?;
    fs::create_dir_all(&objects_dir).map_err(|e| format!("创建 objects 目录失败：{}", e))?;

    let version_download_dir = download_manager.get_version_download_path(&version_name);
    log_info!("版本下载目录：{:?}", version_download_dir);

    let mut deployed_count = 0;

    for lib in &manifest.libraries {
        let source = version_download_dir.join(&lib.path);
        let dest = libraries_dir.join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建库目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制库文件失败：{}", e))?;
            deployed_count += 1;
        } else if dest.exists() {
            deployed_count += 1;
        }
    }

    if manifest.natives.first().is_some() {
        for native in &manifest.natives {
            let source = version_download_dir.join(&native.path);
            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                deployed_count += 1;
            }
        }
    }

    for asset in &manifest.assets {
        let source = version_download_dir.join(&asset.path);
        let dest = assets_dir.join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制资源文件失败：{}", e))?;
            deployed_count += 1;
        } else if dest.exists() {
            deployed_count += 1;
        }
    }

    if let Some(ref client) = manifest.client_jar {
        let source = version_download_dir.join(&client.path);
        let dest = instance_path.join(format!("{}.jar", &version_name));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建版本目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制客户端 jar 失败：{}", e))?;
            deployed_count += 1;
        } else {
            return Err(format!("客户端 jar 不存在：{}", source.display()));
        }
    }

    if let Some(ref index) = manifest.asset_index {
        let source = version_download_dir.join(&index.path);
        let dest = indexes_dir.join(format!("{}.json", &version_name));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建索引目录失败：{}", e))?;
        }

        if source.exists() {
            fs::copy(&source, &dest).map_err(|e| format!("复制资源索引失败：{}", e))?;
            deployed_count += 1;
        }
    }

    log_info!("==================== 部署完成 ====================");

    Ok(format!("版本 {} 已部署到实例 ({} 文件)", version_id, deployed_count))
}
