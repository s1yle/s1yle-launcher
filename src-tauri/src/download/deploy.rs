use crate::download::manager::DownloadManager;
use crate::download::models::*;
use crate::download::version::get_version_download_manifest;
use crate::log_info;
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
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("开始部署版本文件: {}", version_id);

    let manifest =
        get_version_download_manifest(version_id.clone(), download_manager.clone()).await?;
    deploy_manifest(&manifest, version_id, &download_manager).await
}

async fn deploy_manifest(
    manifest: &VersionDownloadManifest,
    version_id: String,
    download_manager: &State<'_, DownloadManager>,
) -> Result<String, String> {
    let base_path = download_manager.base_path.lock().unwrap().clone();
    let base_path = &base_path;

    let mut deployed = 0;

    for lib in &manifest.libraries {
        let source = base_path.join("temp").join(&lib.path);
        let dest = base_path.join("libraries").join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署库文件失败: {}", e))?;
            deployed += 1;
            log_info!(
                "[{} / {}] 部署库: {}",
                deployed,
                manifest.libraries.len(),
                lib.path
            );
        } else if dest.exists() {
            deployed += 1;
            log_info!(
                "[{} / {}] 库已存在: {}",
                deployed,
                manifest.libraries.len(),
                lib.path
            );
        }
    }

    let natives_dir = base_path.join("natives").join(&version_id);
    if manifest.natives.first().is_some() {
        fs::create_dir_all(&natives_dir).map_err(|e| format!("创建原生库目录失败: {}", e))?;

        for native in &manifest.natives {
            let source = base_path.join("temp").join(&native.path);

            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                fs::remove_file(&source).ok();
                log_info!("解压原生库: {}", native.path);
            }
        }
    }

    for asset in &manifest.assets {
        let source = base_path.join("temp").join(&asset.path);
        let dest = base_path.join("assets").join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署资源文件失败: {}", e))?;
            deployed += 1;
        } else if dest.exists() {
            deployed += 1;
        }
    }

    if let Some(ref client) = manifest.client_jar {
        let source = base_path.join("temp").join(&client.path);
        let dest = base_path
            .join("versions")
            .join(&version_id)
            .join(format!("{}.jar", &version_id));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建版本目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署客户端 jar 失败: {}", e))?;
        }
    }

    let temp_dir = base_path.join("temp");
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).ok();
    }

    log_info!("版本 {} 部署完成，共部署 {} 个文件", version_id, deployed);
    Ok(format!("版本 {} 部署完成", version_id))
}

fn extract_jar(jar_path: &PathBuf, dest_dir: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(jar_path).map_err(|e| format!("打开 jar 文件失败: {}", e))?;

    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("解析 zip 失败: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("读取 zip 条目失败: {}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => dest_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| format!("创建目录失败: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| format!("创建父目录失败: {}", e))?;
                }
            }

            let mut outfile =
                fs::File::create(&outpath).map_err(|e| format!("创建文件失败: {}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("复制文件失败: {}", e))?;
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
    log_info!("开始部署版本 {} 到实例 {}", version_id, instance_path);

    let manifest =
        get_version_download_manifest(version_id.clone(), download_manager.clone()).await?;

    let instance_dir = PathBuf::from(&instance_path);
    let versions_dir = instance_dir.join("versions");
    let libraries_dir = instance_dir.join("libraries");
    let assets_dir = instance_dir.join("assets");
    let natives_dir = instance_dir.join("natives").join(&version_id);

    fs::create_dir_all(&versions_dir).map_err(|e| format!("创建versions目录失败: {}", e))?;
    fs::create_dir_all(&libraries_dir).map_err(|e| format!("创建libraries目录失败: {}", e))?;
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建assets目录失败: {}", e))?;
    fs::create_dir_all(&natives_dir).map_err(|e| format!("创建natives目录失败: {}", e))?;

    let base_path = download_manager.base_path.lock().unwrap().clone();

    for lib in &manifest.libraries {
        let source = base_path.join("temp").join(&lib.path);
        let dest = libraries_dir.join(&lib.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建库目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署库文件失败: {}", e))?;
            log_info!("部署库: {}", lib.path);
        } else if dest.exists() {
            log_info!("库已存在: {}", lib.path);
        }
    }

    if manifest.natives.first().is_some() {
        for native in &manifest.natives {
            let source = base_path.join("temp").join(&native.path);
            if source.exists() {
                extract_jar(&source, &natives_dir)?;
                fs::remove_file(&source).ok();
                log_info!("解压原生库: {}", native.path);
            }
        }
    }

    for asset in &manifest.assets {
        let source = base_path.join("temp").join(&asset.path);
        let dest = assets_dir.join(&asset.path);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建资源目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署资源文件失败: {}", e))?;
            log_info!("部署资源: {}", asset.path);
        } else if dest.exists() {
            log_info!("资源已存在: {}", asset.path);
        }
    }

    if let Some(ref client) = manifest.client_jar {
        let source = base_path.join("temp").join(&client.path);
        let dest = versions_dir.join(format!("{}.jar", &version_id));

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署客户端jar失败: {}", e))?;
            log_info!("部署客户端: {}", dest.display());
        }
    }

    if let Some(ref index) = manifest.asset_index {
        let source = base_path.join("temp").join(&index.path);
        let dest = instance_dir
            .join("assets")
            .join("indexes")
            .join(format!("{}.json", &version_id));

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建索引目录失败: {}", e))?;
        }

        if source.exists() {
            fs::rename(&source, &dest).map_err(|e| format!("部署资源索引失败: {}", e))?;
        }
    }

    log_info!("版本 {} 部署到实例完成", version_id);
    Ok(format!("版本 {} 已部署到实例", version_id))
}

#[allow(dead_code)]
fn deploy_file_to_path(base_path: &PathBuf, file: &FileDownload) -> Result<String, String> {
    let dest_path = base_path.join(&file.path);

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let source_path = base_path.join("temp").join(&file.path);

    if source_path.exists() {
        fs::rename(&source_path, &dest_path).map_err(|e| format!("移动文件失败: {}", e))?;
        log_info!("部署文件: {} -> {}", file.path, dest_path.display());
    } else if dest_path.exists() {
        log_info!("文件已存在: {}", file.path);
    } else {
        return Err(format!("源文件不存在: {}", source_path.display()));
    }

    Ok(dest_path.to_string_lossy().to_string())
}
