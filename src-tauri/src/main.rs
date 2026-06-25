//! WeCraft Launcher — 桌面应用入口
//!
//! 初始化账户管理器/管理员管理器/启动管理器后调用 Tauri 运行时。
//! Release 模式下自动隐藏 Windows 控制台窗口。

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use std::env;

use wecraft_launcher_lib::{init_account_manager, init_admin_manager, init_launch_manager, run};

fn main() {
    #[cfg(target_os = "windows")]
    unsafe {
        env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-pinch --disable-features=OverscrollHistoryNavigation",
        );
    }

    init_account_manager();
    init_admin_manager();
    init_launch_manager();

    run();
}
