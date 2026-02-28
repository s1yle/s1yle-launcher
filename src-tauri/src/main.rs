// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

use s1yle_launcher_lib::{init_config, DEV, run, init_account_manager, init_launch_manager};

fn main() {
    init_config();  // 1
    init_account_manager(); // 2
    init_launch_manager(); // 3
    run();
}
