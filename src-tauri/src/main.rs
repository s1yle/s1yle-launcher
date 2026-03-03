// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

// use webview2_com::Microsoft::Web::Webview2::Win32::ICoreWebView2Settings;
use s1yle_launcher_lib::{init_config, DEV, run, init_account_manager, init_launch_manager, init_logging};

fn main() {

    #[cfg(target_os = "windows")]
    {
        env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-pinch --disable-features=OverscrollHistoryNavigation"
        );
    }

    init_config();  // 1
    init_account_manager(); // 2
    init_launch_manager(); // 3

    // 禁用触摸板缩放
    // ICoreWebView2Settings5::SetIsPinchZoomEnabled(false)?;

    run();
}
