use std::{collections::HashMap, fs};
use tauri::is_dev;
use crate::json::{JsonValue, read_json_from_file, write_json_to_file};
use crate::account;

pub const CONFIG_PATH:&str=".slauncher/slauncher.json";
pub const DEV:bool = is_dev();

pub fn init_config() {
    // 写配置文件默认值
    let config_path: &str = CONFIG_PATH;

    let mut config:HashMap<String, JsonValue> = HashMap::new();
    config.insert("username".to_string(), JsonValue::String("steve".to_string()));

    let config_value = JsonValue::Object(config);

    match fs::create_dir("./.slauncher") {
        Ok(_) => println!("配置目录创建成功！"),
        Err(e) => {
            println!("目录创建失败：{}", e);
        }
    }

    match write_json_to_file(config_path, &config_value) {
        Ok(_) => println!("配置已写入 config.json"),
        Err(e) => println!("写入失败：{}", e),
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Config {
    pub config_path: String,
    pub account_info: account::AccountInfo,
}

pub fn get_config() -> String {
    "调用了 rust 后端的 get_config 方法".to_string()
}