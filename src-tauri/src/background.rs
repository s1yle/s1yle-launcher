use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

/// 通过系统文件选择器选择背景图片，并复制到应用数据目录
#[tauri::command]
pub async fn select_background_image(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .add_filter("图片", &["png", "jpg", "jpeg", "webp", "bmp"])
        .pick_file(move |path| {
            let path_str = path.and_then(|p| p.as_path().map(|p| p.to_string_lossy().to_string()));
            let _ = tx.send(path_str);
        });

    let source_path = match tokio::task::block_in_place(|| rx.recv()) {
        Ok(Some(p)) => p,
        Ok(None) => return Ok(None),
        Err(_) => return Err("文件选择器通信失败".to_string()),
    };

    let source = Path::new(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    let dest_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {}", e))?
        .join("backgrounds");

    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("创建背景目录失败: {}", e))?;

    let dest = dest_dir.join(format!("bg.{}", ext));
    fs::copy(&source_path, &dest)
        .map_err(|e| format!("复制图片失败: {}", e))?;

    Ok(Some(dest.to_string_lossy().to_string()))
}
