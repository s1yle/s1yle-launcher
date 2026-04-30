use crate::download::manager::DownloadManager;
use crate::download::models::*;
use crate::download::version::{get_version_detail, parse_version_downloads};
use crate::{log_error, log_info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use zip;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct DeployProgress {
    pub total: usize,
    pub current: usize,
    pub current_file: String,
    pub status: String,
}

#[tauri::command]
pub async fn deploy_version_files(
    version_id: String,
    instance_path: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("开始部署版本 {} 到实例", version_id);
    deploy_version_to_instance(instance_path, version_id, download_manager).await
}

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
    // 所有文件都放在 versions/{version_name}/ 目录下
    let version_base_dir = instance_dir.join("versions").join(&version_name);
    let libraries_dir = version_base_dir.join("libraries");
    let assets_dir = version_base_dir.join("assets");
    let natives_dir = version_base_dir.join("natives");
    let indexes_dir = version_base_dir.join("indexes");
    let objects_dir = version_base_dir.join("objects");

    log_info!("目标目录：");
    log_info!("  版本根目录：{:?}", version_base_dir);
    log_info!("  libraries: {:?}", libraries_dir);
    log_info!("  assets: {:?}", assets_dir);
    log_info!("  natives: {:?}", natives_dir);
    log_info!("  indexes: {:?}", indexes_dir);
    log_info!("  objects: {:?}", objects_dir);

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
