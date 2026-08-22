//! 通用命令（无领域归属的杂项命令）

use tauri::State;
use crate::app_context::AppContext;
use crate::config_io;
use crate::shared::models::AppPersist;

/// 测试用的问候命令
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! 来自Rust后端的问候", name)
}

/// 读取是否显示迎新界面
#[tauri::command]
pub fn get_first_run(ctx: State<'_, AppContext>) -> bool {
    let persist: Option<AppPersist> =
        config_io::read_section(&ctx.launcher_config_path(), "app");
    persist.map(|p| p.first_run).unwrap_or(true)
}

/// 设置是否显示迎新界面
#[tauri::command]
pub fn set_first_run(value: bool, ctx: State<'_, AppContext>) -> Result<(), String> {
    let mut persist: AppPersist =
        config_io::read_section(&ctx.launcher_config_path(), "app").unwrap_or_default();
    persist.first_run = value;
    config_io::write_section(&ctx.launcher_config_path(), "app", &persist)
}
