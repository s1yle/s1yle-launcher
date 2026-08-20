// src-tauri/src/lib.rs
mod account;
mod app_context;
mod background;
mod config;
mod download;
mod font;
mod game;
mod java;
mod launch;
mod logging;
mod microsoft_login;
mod modloader;
mod render;
mod system;
mod types;
mod window;

use crate::app_context::AppContext;
use crate::config::{ConfigManager, set_config_value};

use crate::microsoft_login::{
    cancel_device_code, get_login_status, poll_and_complete_login, start_device_code,
};

use crate::download::DownloadManager;
use crate::window::{WindowType, create_and_show_window, restore_main_window_state};
use std::sync::OnceLock;
use std::time::Instant;
use tauri::webview::PageLoadEvent;
use tauri::{Manager, WebviewUrl};
use tauri_plugin_keyring::KeyringExt;

pub use crate::account::{
    add_player_account, clear_login_state, delete_account, get_account_list, get_current_account,
    get_current_account_token, get_login_state, init_account_manager, initialize_account_system,
    save_login_state, set_current_account,
};
pub use crate::launch::{
    GameLogResult, LaunchConfig, LaunchGameInfo, LaunchStatus, LaunchStatusInfo,
    front_get_game_log, front_get_launch_config, front_get_launch_games,
    front_get_launch_status, front_get_launch_status_by_key, front_launch_game,
    front_stop_game, front_update_launch_config, init_launch_manager,
};
pub use crate::window::{load_window_position, save_window_position};

pub use download::{
    cancel_download, cancel_version_download, clear_completed_tasks, download, get_download_tasks,
    get_version_detail, get_version_download_manifest, get_version_manifest,
};

pub use crate::game::{
    Game, GameManager, create_game, delete_game, get_game, get_game_root, get_game_settings,
    get_global_game_settings, rename_game, scan_games, set_game_root, update_game,
    update_game_settings, update_global_game_settings, validate_game,
};

pub use crate::system::{get_display_resolutions, get_memory_usage, get_system_memory};

pub use crate::java::{
    JavaInstallation, get_java_version, scan_java_installations, select_java_path,
};

pub use crate::modloader::{
    LibraryInfo, ModLoaderInfo, ModLoaderManager, ModLoaderType, ModLoaderVersionItem,
    ModLoaderVersionList, build_fabric_launch_config, build_forge_launch_config,
    get_fabric_version_detail, get_fabric_versions, get_forge_versions, get_installed_mod_loaders,
    get_neoforge_versions, get_optifine_versions,
};

pub use logging::{init_logging, log_frontend};

pub use font::{get_font, get_system_fonts};

/// 全局 Tauri AppHandle，用于在非命令上下文中访问 Tauri 状态
pub static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

/// 测试用的问候命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! 来自Rust后端的问候", name)
}

/// 系统信息结构体
#[derive(serde::Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
    /// 启动器数据目录（.wecraft），供前端访问全局兜底图标等
    wecraft_dir: String,
}

/// 获取当前操作系统和架构信息
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    let arch = if cfg!(target_arch = "x86") {
        "x86"
    } else if cfg!(target_arch = "x86_64") {
        "x64"
    } else if cfg!(target_arch = "arm") {
        "arm"
    } else if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        "unknown"
    };

    let wecraft_dir = APP_HANDLE
        .get()
        .map(|h| h.state::<AppContext>().wecraft_data_dir())
        .unwrap_or_else(|| std::path::PathBuf::from(".wecraft"))
        .to_string_lossy()
        .to_string();

    Ok(SystemInfo {
        os: os.to_string(),
        arch: arch.to_string(),
        wecraft_dir,
    })
}

/// 获取指定路径所在磁盘的剩余可用空间（字节）
#[tauri::command]
fn get_disk_free_space(path: String) -> Result<u64, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

        let path_u16: Vec<u16> = std::path::Path::new(&path)
            .as_os_str()
            .encode_wide()
            .collect();
        let mut free_bytes: u64 = 0;
        let result = unsafe {
            GetDiskFreeSpaceExW(
                windows::core::PCWSTR(path_u16.as_ptr()),
                Some(&mut free_bytes),
                None,
                None,
            )
        };
        if result.is_ok() {
            Ok(free_bytes)
        } else {
            Err("获取磁盘剩余空间失败".to_string())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::ffi::CString;

        let c_path = CString::new(path).map_err(|e| format!("路径无效: {}", e))?;
        let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
        let ret = unsafe { libc::statvfs(c_path.as_ptr(), &mut stat) };
        if ret == 0 {
            let free = (stat.f_frsize as u64).saturating_mul(stat.f_bavail as u64);
            Ok(free)
        } else {
            Err(format!("获取磁盘剩余空间失败 (errno {})", ret))
        }
    }
}

/// 使用系统默认浏览器打开指定 URL
#[tauri::command]
fn open_url(url: String) -> Result<String, String> {
    log_info!("打开链接: {}", url);
    tauri_plugin_opener::open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {}", e))?;
    Ok(url)
}

/// 使用系统文件管理器打开指定文件夹（目录不存在时先创建，保证浏览子目录可用）
#[tauri::command]
fn open_folder(path: String) -> Result<String, String> {
    log_info!("打开文件夹: {}", path);
    if let Err(e) = std::fs::create_dir_all(&path) {
        log_info!("创建目录失败（忽略并继续打开）: {}", e);
    }
    tauri_plugin_opener::open_path(&path, None::<&str>)
        .map_err(|e| format!("打开文件夹失败: {}", e))?;
    Ok(path)
}

/// 解析启动器工作目录：
/// - `WECRAFT_WORK_DIR` 环境变量优先（开发/便携工具）
/// - 默认：exe 所在目录（配置/日志/缓存与启动器同目录存放）
fn resolve_work_dir() -> std::path::PathBuf {
    use std::path::PathBuf;

    if let Ok(dir) = std::env::var("WECRAFT_WORK_DIR") {
        return PathBuf::from(dir);
    }

    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

/// 初始化应用上下文（组合根）
///
/// - 工作目录：`resolve_work_dir()`（见上）
/// - 游戏根目录：配置文件中 `app.game_dir` → 回退工作目录
fn init_app_context() -> AppContext {
    let work_dir = resolve_work_dir();

    let game_root = resolve_game_root(&work_dir);
    log_info!(
        "工作目录: {} | 游戏根目录: {}",
        work_dir.display(),
        game_root.display()
    );
    let app_context = AppContext::new(work_dir, game_root);
    migrate_legacy_config(&app_context);
    app_context
}

/// 从配置文件读取持久化的游戏根目录（app.game_dir），读取失败/为空时回退 /工作目录/.minecraft
fn resolve_game_root(work_dir: &std::path::Path) -> std::path::PathBuf {
    // 新位置优先：{work_dir}/.wecraft/.wecraft.json（旧位置已废弃，仅作兼容回退）
    let config_path = work_dir.join(".wecraft").join(".wecraft.json");
    let legacy_config_path = work_dir.join(".wecraft.json");
    for path in [config_path, legacy_config_path] {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(root) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(dir) = root
                    .get("app")
                    .and_then(|a| a.get("game_root"))
                    .and_then(|g| g.as_str())
                {
                    if !dir.trim().is_empty() {
                        return std::path::PathBuf::from(dir);
                    }
                }
            }
        }
    }
    work_dir.join(".minecraft").to_path_buf()
}

/// 一次性迁移旧配置：{work_dir}/.wecraft.json → {work_dir}/.wecraft/.wecraft.json
fn migrate_legacy_config(app_context: &AppContext) {
    let legacy = app_context.launcher_work_dir().join(".wecraft.json");
    if !legacy.exists() {
        return;
    }
    let target = app_context.launcher_config_path();
    if target.exists() {
        return;
    }
    if let Some(parent) = target.parent() {
        if std::fs::create_dir_all(parent).is_err() {
            return;
        }
    }
    match std::fs::rename(&legacy, &target) {
        Ok(()) => log_info!("已迁移配置文件 {} → {}", legacy.display(), target.display()),
        Err(_) => {
            if std::fs::copy(&legacy, &target).is_ok() {
                log_info!("已复制迁移配置文件 → {}", target.display());
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ====== 组合根（Composition Root）：ctx → 管理器 → manage ======
    // AppContext 是唯一"路径事实源"，四个管理器通过构造注入持有其克隆，
    // 运行时共享同一份游戏根目录（set_game_root 即时生效）。
    let app_context = init_app_context();
    app_context.ensure_dirs().expect("初始化基础目录失败");

    let config_manager = ConfigManager::new(app_context.clone());
    let download_manager = DownloadManager::new();
    let mod_loader_manager = ModLoaderManager::new(app_context.clone());
    let game_manager = GameManager::new(app_context.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .manage(app_context)
        .manage(download_manager)
        .manage(mod_loader_manager)
        .manage(game_manager)
        .manage(config_manager)
        .setup(|app| {
            let start = Instant::now();

            app.keyring()
                .initialize_service("com.wecraft.launcher".to_string())?;

            APP_HANDLE.set(app.handle().clone()).ok();

            // asset 协议 scope 是静态配置，无法表达可变的 launchdir；
            // 启动时把真实的 .wecraft 数据目录动态加入（{work_dir}/.wecraft/**）
            if let Err(e) = app
                .asset_protocol_scope()
                .allow_directory(app.state::<AppContext>().wecraft_data_dir(), true)
            {
                log_error!("asset scope 注册失败: {}", e);
            }

            let duration = start.elapsed();
            log_info!("APP_HANDLE.set 耗时: {:?}", duration);

            let handle = app.handle().clone();
            let _loading_window = create_and_show_window(
                &handle,
                "loading",
                WebviewUrl::App("/loading.html".into()),
                WindowType::Loading,
                |window, payload| {
                    if let PageLoadEvent::Finished = payload.event() {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                },
            )?;

            init_logging(app)?;

            // 预先加载账户数据（登录状态在 accounts 节）
            let _ = crate::account::load_accounts_from_disk_internal();

            // 主窗口（隐藏创建）：页面加载完成后关闭 loading 窗口并显示
            let handle_clone = handle.clone();
            let _main_window = create_and_show_window(
                &handle,
                "main",
                WebviewUrl::App("".into()),
                WindowType::Main,
                move |window, payload| {
                    if let PageLoadEvent::Finished = payload.event() {
                        if let Some(win) = handle_clone.get_webview_window("loading") {
                            let _ = win.close();
                        }
                        restore_main_window_state(&window);
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                },
            )?;

            Ok(())
        })
        .on_window_event(|_window, _event| {})
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            // 窗口管理
            window::save_window_position,
            window::load_window_position,
            window::save_window_position_by_label,
            window::load_window_position_by_label,
            add_player_account,
            get_account_list,
            get_current_account,
            get_current_account_token,
            get_login_state,
            delete_account,
            set_current_account,
            // 启动/停止 游戏
            front_launch_game,
            front_stop_game,
            front_get_launch_status,
            front_get_launch_status_by_key,
            front_get_launch_games,
            front_get_launch_config,
            front_update_launch_config,
            front_get_game_log,
            log_frontend,
            initialize_account_system,
            get_version_manifest,
            get_version_detail,
            get_version_download_manifest,
            download,
            get_download_tasks,
            cancel_download,
            cancel_version_download,
            clear_completed_tasks,
            get_fabric_versions,
            get_fabric_version_detail,
            build_fabric_launch_config,
            get_forge_versions,
            build_forge_launch_config,
            get_installed_mod_loaders,
            get_neoforge_versions,
            get_optifine_versions,
            get_disk_free_space,
            scan_games,
            get_game,
            create_game,
            delete_game,
            rename_game,
            update_game,
            get_game_root,
            set_game_root,
            validate_game,
            // 游戏设置相关命令
            get_game_settings,
            update_game_settings,
            get_global_game_settings,
            update_global_game_settings,
            // 系统相关命令
            system::get_system_memory,
            system::get_memory_usage,
            system::get_display_resolutions,
            java::select_java_path,
            open_url,
            open_folder,
            // 配置相关命令
            config::get_config,
            set_config_value,
            save_login_state,
            clear_login_state,
            // 背景相关命令
            background::select_background_image,
            scan_java_installations,
            get_java_version,
            // 字体
            get_system_fonts,
            get_font,
            // 皮肤渲染
            render::render_avatar,
            render::get_skin_head,
            render::get_skin_cape,
            render::render_isometric_avatar_cmd,
            render::get_skin_model,
            render::get_uuid_by_username,
            render::get_uuids_by_usernames,
            // 正版登录
            start_device_code,
            cancel_device_code,
            poll_and_complete_login,
            get_login_status,
        ])
        .run(tauri::generate_context!())
        .expect("启动失败！");
}
