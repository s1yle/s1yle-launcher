// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use std::env;

use s1yle_launcher_lib::{init_account_manager, init_config, init_launch_manager, run};

fn main() {
    #[cfg(target_os = "windows")]
    {
        env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-pinch --disable-features=OverscrollHistoryNavigation",
        );
    }

    init_config(); // 1
    init_account_manager(); // 2
    init_launch_manager(); // 3

    // 禁用触摸板缩放
    // ICoreWebView2Settings5::SetIsPinchZoomEnabled(false)?;

    run();
}
