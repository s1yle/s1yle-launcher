//! 启动引导命令

use crate::account::{get_account_list, get_current_account};
use crate::app_context::AppContext;
use crate::config_io;
use crate::game::state::GameState;
use crate::shared::models::SystemConfig;
use crate::system;
use serde_json::Value;
use tauri::State;

use super::models::BootstrapData;

/// 聚合前端初始化所需的全部数据
#[tauri::command]
pub fn get_bootstrap_data(ctx: State<'_, AppContext>) -> Result<BootstrapData, String> {
    let path = ctx.launcher_config_path();
    let app: SystemConfig = config_io::read_section(&path, "app").unwrap_or_default();
    let background: Value = if app.background.is_null() {
        Value::Null
    } else {
        app.background.clone()
    };
    let game_state = GameState::load(&ctx);
    let game_folders = game_state.get_folders();
    let accounts = get_account_list().map_err(|e| e)?;
    let current_account = get_current_account().ok().flatten();
    let system_info = system::system_info(&ctx);

    Ok(BootstrapData {
        first_run: app.first_run,
        background,
        game_root: ctx.game_root().to_string_lossy().to_string(),
        game_folders,
        accounts,
        current_account,
        system_info,
        version: app.version,
    })
}
