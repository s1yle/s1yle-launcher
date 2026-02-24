// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod json;
use json::{JsonValue, read_json_from_file, write_json_to_file};
use tauri::is_dev;
use std::{collections::HashMap, fs};

pub const CONFIG_PATH:&str=".slauncher/slauncher.json";
pub const DEV:bool = is_dev();

fn test_json() {
    let config_path = "config.json";

    // --- 创建一个配置并写入文件 ---
    let mut config = HashMap::new();
    config.insert("username".to_string(), JsonValue::String("Steve".to_string()));
    config.insert("memory".to_string(), JsonValue::Number(2048.0));
    config.insert("fullscreen".to_string(), JsonValue::Boolean(true));
    config.insert("mods".to_string(), JsonValue::Array(vec![
        JsonValue::String("fabric-api".to_string()),
        JsonValue::String("sodium".to_string()),
    ]));
    let config_value = JsonValue::Object(config);

    // 写入文件
    match write_json_to_file(config_path, &config_value) {
        Ok(_) => println!("配置已写入 config.json"),
        Err(e) => println!("写入失败：{}", e),
    }

    // --- 从文件读取配置并打印 ---
    match read_json_from_file(config_path) {
        Ok(value) => {
            println!("读取到的配置：{:?}", value);
            // 尝试获取 username
            if let JsonValue::Object(obj) = value {
                if let Some(JsonValue::String(name)) = obj.get("username") {
                    println!("用户名：{}", name);
                }
            }
        }
        Err(e) => println!("读取失败：{}", e),
    }
}

fn init_config() {
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

fn main() {
    init_config();
    s1yle_launcher_lib::run();

    if DEV {
        let rs = fs::remove_dir_all("./slauncher");
        match rs {
            Ok(_)=>{
                println!("成功删除配置目录");
            },
            Err(err)=>{
                println!("删除配置目录失败, {}", err);
            }
        }
    }

}