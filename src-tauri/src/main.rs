// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

use s1yle_launcher_lib::{init_config, DEV, run};

fn main() {
    init_config();
    run();

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