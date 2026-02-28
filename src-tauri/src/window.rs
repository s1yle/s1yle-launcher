use crate::DEV;
use std::{fs};

pub fn close_window() -> Result<String, String> {
    if DEV {
        match fs::remove_dir_all("./.slauncher") {
            Ok(_)=>{
                let msg = "成功删除配置目录".to_string();
                println!("{}", msg);
                Ok(msg)
            },
            Err(err)=>{
                let err_msg = format!("删除配置目录失败!原因： {}", err);
                println!("{}", err_msg);
                Err(err_msg)
            }
        }
    } else {
        // 生产环境不执行删除操作
        Ok("生产环境，跳过目录清理".to_string())
    }
}


#[tauri::command]
pub fn tauri_close_window() -> Result<String, String> {
    close_window()
}