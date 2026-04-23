use crate::{config};
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

fn window_check(pos: &mut WindowPosition) {
    if pos.x <= 0 {
        pos.x = 1;
    }

    if pos.y <= 0 {
        pos.y = 1;
    }
    
    if pos.height < *config::MIN_HEIGHT {
        pos.height = *config::MIN_HEIGHT;
    }

    if pos.width < *config::MIN_WIDTH {
        pos.width = *config::MIN_WIDTH;
    }
}

#[tauri::command]
pub fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    maximized: bool,
) -> Result<(), String> {
    let mut position = WindowPosition {
        x,
        y,
        width,
        height,
        maximized,
    };

    window_check(&mut position);

    dbg!(position.clone());

    let json = serde_json::to_string_pretty(&position).map_err(|e| e.to_string())?;

    let config_dir = &*config::CONFIG_APPLICATION;
    if !config_dir.exists() {
        fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    }

    let pos_file = &*config::CONFIG_FILE_PATH;
    fs::write(&pos_file, json).map_err(|e| e.to_string())?;

    if let Ok(mut saved) = SAVED_POSITION.lock() {
        *saved = Some(position);
    }

    tracing::info!("窗口位置已保存: {:?}", pos_file);
    Ok(())
}

#[tauri::command]
pub fn load_window_position() -> Result<Option<WindowPosition>, String> {
    let pos_file = &*config::CONFIG_FILE_PATH;

    if pos_file.exists() {
        let json = fs::read_to_string(pos_file).map_err(|e| e.to_string())?;
        let mut position: WindowPosition = serde_json::from_str(&json).map_err(|e| e.to_string())?;

        window_check(&mut position);

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
