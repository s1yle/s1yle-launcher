use crate::download::manager::DownloadManager;
use crate::download::models::DownloadTask;
use crate::log_info;
use std::fs;
use std::path::PathBuf;
use tauri::State;

/// 获取所有下载任务列表
#[tauri::command]
pub fn get_download_tasks(download_manager: State<'_, DownloadManager>) -> Vec<DownloadTask> {
    download_manager.get_all_tasks()
}

/// 获取指定 ID 的下载任务
#[tauri::command]
pub fn get_download_task(
    task_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Option<DownloadTask> {
    download_manager.get_task(&task_id)
}

/// 取消指定 ID 的下载任务（删除已下载的文件）
#[tauri::command]
pub fn cancel_download(
    task_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("取消下载任务: {}", task_id);

    if let Some(task) = download_manager.get_task(&task_id) {
        if fs::remove_file(&task.path).is_ok() {
            download_manager.remove_task(&task_id);
            return Ok(format!("任务 {} 已取消", task_id));
        }
    }

    Err(format!("任务 {} 不存在", task_id))
}

/// 清理所有已完成状态的下载任务
#[tauri::command]
pub fn clear_completed_tasks(
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    log_info!("清理已完成任务");
    let tasks = download_manager.get_all_tasks();
    let mut removed = 0;

    for task in tasks {
        if task.status == "completed" {
            download_manager.remove_task(&task.id);
            removed += 1;
        }
    }

    Ok(format!("已清理 {} 个已完成任务", removed))
}

/// 获取已下载的游戏版本列表
#[tauri::command]
pub fn get_game_versions(
    download_manager: State<'_, DownloadManager>,
) -> Result<Vec<String>, String> {
    let game_dir = download_manager.base_path.lock().unwrap().clone();
    let versions_dir = game_dir.join("versions");

    if !versions_dir.exists() {
        return Ok(vec![]);
    }

    let mut versions: Vec<String> = fs::read_dir(versions_dir)
        .map_err(|e| format!("读取版本目录失败: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect();

    versions.sort();
    Ok(versions)
}

/// 获取下载基础路径
#[tauri::command]
pub fn get_download_base_path(download_manager: State<'_, DownloadManager>) -> String {
    download_manager
        .base_path
        .lock()
        .unwrap()
        .to_string_lossy()
        .to_string()
}

/// 设置下载基础路径
#[tauri::command]
pub fn set_download_base_path(
    path: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<String, String> {
    let new_path = PathBuf::from(&path);
    fs::create_dir_all(&new_path).map_err(|e| format!("创建目录失败: {}", e))?;

    let mut base_path = download_manager.base_path.lock().unwrap();
    *base_path = new_path;

    log_info!("下载目录已更改为: {}", path);
    Ok(format!("下载目录已更改为: {}", path))
}
