use crate::DEV;
use once_cell::sync::Lazy;
use std::{fs, sync::Mutex};

#[derive(serde::Serialize, serde::Deserialize, Default, Clone, Debug)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

static SAVED_POSITION: Lazy<Mutex<Option<WindowPosition>>> = Lazy::new(|| Mutex::new(None));

pub fn close_window() -> Result<String, String> {
    if DEV {
        match fs::remove_dir_all("./.slauncher") {
            Ok(_) => {
                let msg = "成功删除配置目录".to_string();
                println!("{}", msg);
                Ok(msg)
            }
            Err(err) => {
                let err_msg = format!("删除配置目录失败!原因： {}", err);
                println!("{}", err_msg);
                Err(err_msg)
            }
        }
    } else {
        Ok("生产环境，跳过目录清理".to_string())
    }
}

#[tauri::command]
pub fn tauri_close_window() -> Result<String, String> {
    close_window()
}

#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
) -> Result<(), String> {
    let position = WindowPosition {
        x,
        y,
        width,
        height,
        maximized,
    };
    let json = serde_json::to_string_pretty(&position).map_err(|e| e.to_string())?;

    let config_dir = std::path::Path::new(".slauncher");
    if !config_dir.exists() {
        fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    }

    let pos_file = config_dir.join("window_position.json");
    fs::write(&pos_file, json).map_err(|e| e.to_string())?;

    if let Ok(mut saved) = SAVED_POSITION.lock() {
        *saved = Some(position);
    }

    tracing::info!("窗口位置已保存: {:?}", pos_file);
    Ok(())
}

#[tauri::command]
pub fn load_window_position() -> Result<Option<WindowPosition>, String> {
    let pos_file = std::path::Path::new(".slauncher/window_position.json");

    if pos_file.exists() {
        let json = fs::read_to_string(pos_file).map_err(|e| e.to_string())?;
        let position: WindowPosition = serde_json::from_str(&json).map_err(|e| e.to_string())?;

        if let Ok(mut saved) = SAVED_POSITION.lock() {
            *saved = Some(position.clone());
        }

        tracing::info!("窗口位置已加载: {:?}", position);
        Ok(Some(position))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn get_saved_window_position() -> Result<Option<WindowPosition>, String> {
    if let Ok(saved) = SAVED_POSITION.lock() {
        Ok(saved.clone())
    } else {
        Ok(None)
    }
}
