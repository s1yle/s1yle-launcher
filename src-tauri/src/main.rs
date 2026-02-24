// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod json;
use json::{JsonValue, read_json_from_file, write_json_to_file};
use std::collections::HashMap;

fn main() {
    // 定义配置文件路径
    let config_path = "config.json";

    // --- 第一步：创建一个配置并写入文件 ---
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

    // --- 第二步：从文件读取配置并打印 ---
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

    s1yle_launcher_lib::run();
}