//! Minecraft 启动模块（JSON 驱动：读取版本 JSON 组装启动参数，支持多子进程）
//!
//! 每次启动生成唯一游戏 ID（UUID），同一游戏目录也可并行启动多次，
//! 每个游戏独立持有子进程与状态机，可独立停止 / 查询状态。

use once_cell::sync::OnceCell;

use core::convert::{From, Into};
use core::prelude::v1::derive;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, MutexGuard};
use uuid::Uuid;

use crate::app_context::AppContext;
use crate::download::models::FileDownload;
use crate::download::{DownloadManager, extract_jar, parse_version_json};
use crate::game::GameManager;
use crate::launch::args::build_launch_args;
use crate::{log_error, log_info};
use tauri::Manager;

mod args;
pub mod command;
mod log;
mod window;
pub use command::*;
pub use log::{GameLogResult, LogLevel, LogLine};

/// 避免子进程（如 java.exe 控制台程序）在 Windows 上弹出黑窗口。
/// 无窗口创建标志 `CREATE_NO_WINDOW` (0x08000000)，非 Windows 平台为空操作。
#[cfg(windows)]
trait NoConsoleWindow {
    fn no_console_window(&mut self) -> &mut Self;
}

#[cfg(windows)]
impl NoConsoleWindow for Command {
    fn no_console_window(&mut self) -> &mut Self {
        use std::os::windows::process::CommandExt;
        self.creation_flags(0x08000000) // CREATE_NO_WINDOW
    }
}

#[cfg(not(windows))]
trait NoConsoleWindow {
    fn no_console_window(&mut self) -> &mut Self;
}

#[cfg(not(windows))]
impl NoConsoleWindow for Command {
    fn no_console_window(&mut self) -> &mut Self {
        self
    }
}

// ======================== 类型定义 ========================

/// 启动状态枚举
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum LaunchStatus {
    /// 未启动
    Idle,
    /// 启动中
    Launching,
    /// 运行中
    Running,
    /// 已崩溃
    Crashed,
    /// 已停止
    Stopped,
}

/// 启动配置结构体
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LaunchConfig {
    /// Java 可执行文件路径
    pub java_path: String,
    /// 内存大小（MB）
    pub memory_mb: u32,
    /// Minecraft 版本
    pub version: String,
    /// 游戏目录（.minecraft 根目录，兼作游戏标识）
    pub game_dir: String,
    /// 资源目录
    pub assets_dir: String,
    /// 用户名
    pub username: String,
    /// 用户 UUID
    pub uuid: String,
    /// 主类名（模组加载器可覆盖）
    #[serde(default)]
    pub main_class: Option<String>,
    /// 版本类型（release/snapshot/fabric 等）
    #[serde(default)]
    pub version_type: Option<String>,
    /// 用户属性（--userProperties）
    #[serde(default)]
    pub user_properties: Option<String>,
    /// natives 解压目录（默认 {game_dir}/natives）
    #[serde(default)]
    pub natives_dir: Option<String>,
    /// 账户类型（microsoft/offline/thirdparty）
    #[serde(default)]
    pub account_type: Option<String>,
    /// 附加 JVM 参数
    #[serde(default)]
    pub jvm_args: Vec<String>,
    /// 附加游戏参数
    #[serde(default)]
    pub game_args: Vec<String>,
    /// 窗口宽度（用于 ${resolution_width}）
    #[serde(default)]
    pub resolution_width: Option<u32>,
    /// 窗口高度（用于 ${resolution_height}）
    #[serde(default)]
    pub resolution_height: Option<u32>,
    /// 是否全屏启动游戏（追加 --fullscreen）
    #[serde(default)]
    pub fullscreen: bool,
    /// 启动游戏后启动器窗口是否保持可见（false 时启动后隐藏，游戏退出后恢复）
    #[serde(default = "default_true")]
    pub launcher_visible: bool,
}

impl Default for LaunchConfig {
    fn default() -> Self {
        Self {
            java_path: "java".to_string(),
            memory_mb: 2048,
            version: "1.20.4".to_string(),
            game_dir: "./.minecraft".to_string(),
            assets_dir: "./.minecraft/assets".to_string(),
            username: "Steve".to_string(),
            uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5".to_string(),
            main_class: None,
            version_type: None,
            user_properties: None,
            natives_dir: None,
            account_type: None,
            jvm_args: Vec::new(),
            game_args: Vec::new(),
            resolution_width: None,
            resolution_height: None,
            fullscreen: false,
            launcher_visible: true,
        }
    }
}

/// 默认 true 的辅助函数（serde default）
fn default_true() -> bool {
    true
}

/// 关闭主启动器窗口（销毁 webview，真正释放 React/CPU/内存）。
/// 同时置位 LAUNCHER_KEEP_ALIVE，阻止进程随窗口关闭而退出。
fn close_launcher_window() {
    if let Some(handle) = crate::APP_HANDLE.get() {
        if let Some(window) = handle.get_webview_window("main") {
            let _ = window.close();
        }
    }
    if let Ok(mut g) = crate::LAUNCHER_KEEP_ALIVE.lock() {
        *g = true;
    }
}

/// 游戏结束后重建并恢复主启动器窗口；若窗口仍在则仅显示。
/// 同时清除 LAUNCHER_KEEP_ALIVE，恢复默认退出行为。
fn reopen_launcher_window() {
    if let Some(handle) = crate::APP_HANDLE.get() {
        if let Some(window) = handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        } else {
            let _ = crate::window::create_and_show_window(
                handle,
                "main",
                tauri::WebviewUrl::App("".into()),
                crate::window::WindowType::Main,
                |window, payload| {
                    if let tauri::webview::PageLoadEvent::Finished = payload.event() {
                        crate::window::restore_main_window_state(&window);
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                },
            );
        }
    }
    if let Ok(mut g) = crate::LAUNCHER_KEEP_ALIVE.lock() {
        *g = false;
    }
}

/// 运行中游戏的快照信息（暴露给前端）
#[derive(Serialize, Clone, Debug)]
pub struct LaunchGameInfo {
    /// 游戏唯一标识（UUID，每次启动生成）
    pub game_id: String,
    /// 游戏目录（.minecraft 根目录）
    pub game_dir: String,
    /// 启动状态
    pub status: LaunchStatus,
    /// 子进程 PID（未启动为 None）
    pub pid: Option<u32>,
    /// Minecraft 版本
    pub version: String,
    /// 用户名
    pub username: String,
    /// 最近一次错误信息
    pub last_error: Option<String>,
    /// 真实进度（0-100）
    pub progress: u32,
    /// 当前阶段文案
    pub stage: String,
}

/// 增量拉取指定游戏的日志（游标式，offset=0 时返回全部现存日志）
pub fn get_game_log(game_id: &str, offset: usize) -> GameLogResult {
    log::get_game_log(game_id, offset)
}

/// 指定游戏的状态 + 进度快照（暴露给前端）
#[derive(Serialize, Clone, Debug)]
pub struct LaunchStatusInfo {
    /// 启动状态
    pub status: LaunchStatus,
    /// 真实进度（0-100）
    pub progress: u32,
    /// 当前阶段文案
    pub stage: String,
    /// 最近一次错误信息
    #[serde(default)]
    pub last_error: Option<String>,
    /// 崩溃原因摘要（崩溃时生成）
    #[serde(default)]
    pub crash_summary: Option<String>,
}

/// 单个游戏的运行时状态
struct RunningGame {
    config: LaunchConfig,
    child_process: Option<Child>,
    status: LaunchStatus,
    last_error: Option<String>,
    progress: u32,
    stage: String,
    /// 进程退出码（Running 态退出时记录）
    exit_code: Option<i32>,
    /// 崩溃原因摘要（分析日志生成）
    crash_summary: Option<String>,
    /// 日志缓冲键（与 start_capture 使用的 game_id 一致）
    log_key: String,
}

/// 启动管理器状态（多子进程，以每次启动生成的游戏 ID 为 key）
struct LaunchManager {
    default_config: LaunchConfig,
    processes: HashMap<String, RunningGame>,
}

impl Default for LaunchManager {
    fn default() -> Self {
        Self {
            default_config: LaunchConfig::default(),
            processes: HashMap::new(),
        }
    }
}

// ======================== 全局状态 ========================

/// 全局启动管理器游戏
static LAUNCH_MANAGER: OnceCell<Mutex<LaunchManager>> = OnceCell::new();

/// 初始化启动管理器
pub fn init_launch_manager() {
    LAUNCH_MANAGER
        .set(Mutex::new(LaunchManager::default()))
        .unwrap_or_else(|_| panic!("启动管理器已初始化，不可重复调用"));
}

/// 获取启动管理器全局锁
fn lock_manager() -> Result<MutexGuard<'static, LaunchManager>, String> {
    LAUNCH_MANAGER
        .get()
        .ok_or("启动管理器未初始化".to_string())
        .and_then(|m| m.lock().map_err(|e| format!("获取启动锁失败: {}", e)))
}

// ======================== 状态机辅助 ========================

/// 轮询单个游戏的子进程退出状态，同步更新状态机
fn update_process_status(game: &mut RunningGame) -> Result<(), String> {
    if game.status == LaunchStatus::Running {
        if let Some(child) = &mut game.child_process {
            match child.try_wait() {
                Ok(Some(status)) => {
                    game.exit_code = status.code();
                    game.status = if status.success() {
                        LaunchStatus::Stopped
                    } else {
                        LaunchStatus::Crashed
                    };
                    if game.status == LaunchStatus::Crashed {
                        let summary = analyze_crash(&game);
                        game.crash_summary = summary;
                    } else {
                        game.crash_summary = None;
                    }
                    game.child_process = None;
                }
                Ok(None) => {}
                Err(e) => {
                    game.last_error = Some(format!("检查进程状态失败: {}", e));
                    game.status = LaunchStatus::Crashed;
                    game.child_process = None;
                }
            }
        }
    }
    Ok(())
}

/// 聚合所有游戏状态：任一启动中 > 任一运行中 > 任一崩溃 > 全部停止 > 空闲
fn aggregate_status(manager: &LaunchManager) -> LaunchStatus {
    if manager.processes.is_empty() {
        return LaunchStatus::Idle;
    }
    let mut has_running = false;
    let mut has_crashed = false;
    let mut has_stopped = false;
    for game in manager.processes.values() {
        match game.status {
            LaunchStatus::Launching => return LaunchStatus::Launching,
            LaunchStatus::Running => has_running = true,
            LaunchStatus::Crashed => has_crashed = true,
            LaunchStatus::Stopped => has_stopped = true,
            LaunchStatus::Idle => {}
        }
    }
    if has_running {
        LaunchStatus::Running
    } else if has_crashed {
        LaunchStatus::Crashed
    } else if has_stopped {
        LaunchStatus::Stopped
    } else {
        LaunchStatus::Idle
    }
}

// ======================== 核心启动逻辑 ========================

/// 更新指定游戏的进度与阶段文案（后台管线专用）
fn set_game_progress(game_id: &str, progress: u32, stage: &str) {
    if let Ok(mut manager) = lock_manager() {
        if let Some(game) = manager.processes.get_mut(game_id) {
            game.progress = progress.min(100);
            game.stage = stage.to_string();
        }
    }
}

/// 标记游戏启动失败（后台管线专用）
fn set_game_failed(game_id: &str, error: &str) {
    if let Ok(mut manager) = lock_manager() {
        if let Some(game) = manager.processes.get_mut(game_id) {
            game.status = LaunchStatus::Crashed;
            game.last_error = Some(error.to_string());
            if game.crash_summary.is_none() {
                game.crash_summary = analyze_crash(game);
            }
            game.child_process = None;
        }
    }
    log_info!("❌ {}: {}", game_id, error);
}

/// 崩溃原因分析：扫描捕获日志做关键词启发式匹配，并检索 JVM 崩溃报告文件。
/// 返回可读摘要；无命中时返回 None（前端展示 last_error）。
fn analyze_crash(game: &RunningGame) -> Option<String> {
    let logs = log::scan_logs(&game.log_key, MAX_CRASH_SCAN_LINES);
    let joined = logs
        .iter()
        .map(|l| l.text.as_str())
        .collect::<Vec<_>>()
        .join("\n");

    if joined.contains("OutOfMemoryError") || joined.contains("Out of memory") {
        return Some("游戏内存不足 (OutOfMemoryError)，建议在设置中增大分配内存".to_string());
    }
    if joined.contains("UnsupportedClassVersionError") {
        return Some(
            "Java 版本不匹配 (UnsupportedClassVersionError)，请安装更新的 Java".to_string(),
        );
    }
    if joined.contains("NoClassDefFoundError") {
        return Some("缺失类或依赖 (NoClassDefFoundError)，可能是模组或游戏文件损坏".to_string());
    }
    if joined.contains("A fatal error has been detected by the Java Runtime Environment") {
        return Some("JVM 发生致命错误，已检索崩溃报告".to_string());
    }

    let game_dir = PathBuf::from(&game.config.game_dir);
    if find_by_prefix(&game_dir, "hs_err_pid").is_some() {
        return Some("检测到 JVM 崩溃报告 (hs_err_pid*.log)，可在游戏目录中查看".to_string());
    }
    if game_dir
        .join("crash-reports")
        .join("latest-crash.txt")
        .exists()
    {
        return Some("检测到游戏崩溃报告 (crash-reports/latest-crash.txt)".to_string());
    }
    None
}

/// 崩溃扫描的最大日志行数（取尾部）
const MAX_CRASH_SCAN_LINES: usize = 200;

/// 目录下是否有以指定前缀命名的文件
fn find_by_prefix(dir: &Path, prefix: &str) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with(prefix) {
            return Some(entry.path());
        }
    }
    None
}

/// 启动 Minecraft 游戏：立即返回游戏唯一 ID（同一游戏目录可并行启动多次），
/// 实际流程（校验 → 缺失下载 → 构建参数 → 启动进程）在后台异步执行，
/// 进度与阶段通过 `get_launch_status_by_key` 查询，启动失败以 Crashed 状态上报。
pub fn launch_game(
    config: Option<LaunchConfig>,
    ctx: &AppContext,
    dm: DownloadManager,
    gm: GameManager,
) -> Result<String, String> {
    let mut manager = lock_manager()?;

    let config = match config {
        Some(c) => c,
        None => manager.default_config.clone(),
    };
    let game_id = Uuid::new_v4().to_string();

    manager.processes.insert(
        game_id.clone(),
        RunningGame {
            config: config.clone(),
            child_process: None,
            status: LaunchStatus::Launching,
            last_error: None,
            progress: 0,
            stage: "正在初始化".to_string(),
            exit_code: None,
            crash_summary: None,
            log_key: game_id.clone(),
        },
    );
    drop(manager);

    let task_id = game_id.clone();
    let task_ctx = ctx.clone();
    let task_dm = dm.clone();
    let task_gm = gm.clone();
    tauri::async_runtime::spawn(async move {
        run_launch_pipeline(&task_id, config, task_ctx, task_dm, task_gm).await;
    });

    Ok(game_id)
}

/// 后台启动管线：校验 → 缺失文件下载 → 构建参数 → 启动进程
async fn run_launch_pipeline(
    game_id: &str,
    config: LaunchConfig,
    ctx: AppContext,
    dm: DownloadManager,
    gm: GameManager,
) {
    let game_dir = PathBuf::from(&config.game_dir);
    let game_name = game_dir
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    log_info!("🚀 后台启动管线开始:");
    log_info!("  游戏标识: {}", game_id);
    log_info!("  游戏目录: {}", config.game_dir);
    log_info!("  Java路径: {}", config.java_path);
    log_info!("  内存: {}MB", config.memory_mb);
    log_info!("  版本: {}", config.version);
    log_info!("  用户名: {}", config.username);

    // ====== 阶段 1: 校验游戏文件（真实 SHA1 校验，10% → 35%） ======
    set_game_progress(game_id, 10, "正在校验游戏文件");
    let validation =
        match crate::game::validator::validate_game_integrity(&ctx, &gm, &game_name, false) {
            Ok(v) => v,
            Err(e) => {
                set_game_failed(game_id, &format!("校验失败: {}", e));
                return;
            }
        };

    if validation.valid {
        set_game_progress(game_id, 85, "文件校验通过");
    } else {
        set_game_progress(game_id, 40, "发现缺失文件，正在下载");

        // ====== 阶段 2: 下载缺失文件（真实进度 40% → 85%） ======
        let to_download = match build_download_list(&config, &validation).await {
            Ok(list) => list,
            Err(e) => {
                set_game_failed(game_id, &e);
                return;
            }
        };

        if to_download.is_empty() {
            set_game_progress(game_id, 85, "文件校验通过");
        } else {
            let total = to_download.len();
            log_info!("待下载缺失文件 {} 个", total);
            for (idx, (category, file)) in to_download.iter().enumerate() {
                let stage = format!("正在下载缺失文件 ({}/{})", idx + 1, total);
                set_game_progress(
                    game_id,
                    40 + ((idx as u32) * 45 / (total.max(1) as u32)),
                    &stage,
                );

                let dest_base = match category.as_str() {
                    "client" => ctx
                        .version_jar_in_dir(&game_dir, &config.version)
                        .to_path_buf(),
                    "library" | "native" => ctx.libraries_dir().join(&file.path),
                    "index" | "asset" | "log_config" => ctx.assets_dir().join(&file.path),
                    _ => continue,
                };

                if let Err(e) = dm
                    .download_file_if_needed(
                        &file.url,
                        &dest_base,
                        file.sha1.as_deref(),
                        Some(file.size),
                        &None,
                        None,
                    )
                    .await
                {
                    set_game_failed(game_id, &format!("下载 {} 失败: {}", file.path, e));
                    return;
                }
            }

            // natives 下载完成后解压到 natives 目录
            if to_download.iter().any(|(c, _)| c == "native") {
                set_game_progress(game_id, 85, "正在解压原生库");
                let natives_dir = ctx.natives_dir();
                for (category, file) in to_download.iter().filter(|(c, _)| c == "native") {
                    let _ = category;
                    let jar_path = ctx.libraries_dir().join(&file.path);
                    if let Err(e) = extract_jar(
                        &jar_path,
                        &natives_dir,
                        file.extract.as_ref().and_then(|x| x.exclude.as_deref()),
                    ) {
                        set_game_failed(game_id, &format!("解压原生库失败: {}", e));
                        return;
                    }
                }
            }
            set_game_progress(game_id, 85, "文件下载完成");
        }
    }

    // ====== 阶段 3: 构建启动参数（85% → 90%） ======
    set_game_progress(game_id, 88, "正在构建启动参数");
    let access_token = crate::account::manager::get_current_account_token_internal()
        .ok()
        .flatten();
    let (main_class, launch_args) = match build_launch_args(&config, &ctx, access_token) {
        Ok(v) => v,
        Err(e) => {
            set_game_failed(game_id, &e);
            return;
        }
    };

    // ====== 阶段 4: 启动 Java 进程并等待游戏窗口出现（90% → 100%） ======
    set_game_progress(game_id, 95, "正在启动游戏窗口");

    // 启动前检查：用户可能已在后台阶段停止该游戏
    let cancelled = lock_manager()
        .map(|m| {
            m.processes
                .get(game_id)
                .map(|i| i.status != LaunchStatus::Launching)
                .unwrap_or(true)
        })
        .unwrap_or(true);
    if cancelled {
        log_info!("游戏 {} 已被取消启动", game_id);
        return;
    }

    match Command::new(&config.java_path)
        .args(&launch_args)
        .current_dir(&game_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .no_console_window()
        .spawn()
    {
        Ok(mut child) => {
            log::start_capture(game_id, &mut child);
            if let Ok(mut manager) = lock_manager() {
                if let Some(game) = manager.processes.get_mut(game_id) {
                    game.child_process = Some(child);
                }
            }
            log_info!("✅ Minecraft Java 进程已启动: {}", game_id);
            log_info!("  主类: {}", main_class);

            // 启动器可见性：游戏窗口真正出现后再隐藏，游戏结束后恢复
            wait_for_game_window(game_id, config.launcher_visible).await;

            // 等待游戏进程结束，结束后重建并恢复启动器窗口
            wait_until_game_exits(game_id).await;
            if !config.launcher_visible {
                reopen_launcher_window();
            }
        }
        Err(e) => {
            let error_msg = format!("启动失败: {}", e);
            set_game_failed(game_id, &error_msg);
        }
    }
}

/// 等待游戏窗口出现后置为 Running（每 500ms 检测一次，最长 90 秒兜底）。
/// 期间用户可停止游戏；进程提前退出视为启动失败。
async fn wait_for_game_window(game_id: &str, launcher_visible: bool) {
    use std::time::{Duration, Instant};

    let pid = lock_manager()
        .ok()
        .and_then(|m| {
            m.processes
                .get(game_id)
                .and_then(|g| g.child_process.as_ref())
                .map(|c| c.id())
        })
        .unwrap_or(0);
    if pid == 0 {
        set_game_failed(game_id, "启动失败: 无法获取游戏进程");
    }

    let deadline = Instant::now() + Duration::from_secs(90);
    loop {
        // 1. 进程是否已退出或已被用户停止
        if let Ok(mut manager) = lock_manager() {
            if let Some(game) = manager.processes.get_mut(game_id) {
                match game.child_process.as_mut().map(|c| c.try_wait()) {
                    Some(Ok(Some(status))) => {
                        game.exit_code = status.code();
                        let msg = format!(
                            "启动失败: 游戏进程已退出 (代码 {})",
                            game.exit_code.unwrap_or(-1)
                        );
                        set_game_failed(game_id, &msg);
                        return;
                    }
                    Some(Ok(None)) => {}
                    Some(Err(e)) => {
                        let msg = format!("启动失败: 检查进程状态出错: {}", e);
                        set_game_failed(game_id, &msg);
                        return;
                    }
                    None => {
                        // child 已被 stop_one 取走，说明用户停止了游戏
                        log_info!("等待窗口期间游戏 {} 已被停止", game_id);
                        return;
                    }
                }
            } else {
                return;
            }
        }

        // 2. 检测游戏窗口是否出现
        if crate::launch::window::process_has_visible_window(pid) {
            if let Ok(mut manager) = lock_manager() {
                if let Some(game) = manager.processes.get_mut(game_id) {
                    game.status = LaunchStatus::Running;
                    game.progress = 100;
                    game.stage = "游戏运行中".to_string();
                }
            }
            log_info!("🎮 Minecraft 窗口已出现，进入运行状态: {}", game_id);
            // 启动器可见性：游戏窗口真正出现后才关闭启动器窗口（释放资源）
            if !launcher_visible {
                close_launcher_window();
            }
            return;
        }

        // 3. 超时兜底：进程仍存活则视为运行中
        if Instant::now() >= deadline {
            let alive = if let Ok(mut manager) = lock_manager() {
                manager
                    .processes
                    .get_mut(game_id)
                    .and_then(|g| g.child_process.as_mut())
                    .map(|c| c.try_wait().map(|w| w.is_none()).unwrap_or(false))
                    .unwrap_or(false)
            } else {
                false
            };
            if alive {
                if let Ok(mut manager) = lock_manager() {
                    if let Some(game) = manager.processes.get_mut(game_id) {
                        game.status = LaunchStatus::Running;
                        game.progress = 100;
                        game.stage = "游戏运行中".to_string();
                    }
                }
                log_info!("⏱ 等待窗口超时，进程存活，按运行中处理: {}", game_id);
                return;
            }
            set_game_failed(game_id, "启动失败: 等待游戏窗口超时");
            return;
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
    }
}

/// 等待游戏进程结束（最多 24 小时兜底）。用于"启动器可见性"设置：
/// 游戏运行期间隐藏启动器窗口，进程退出后由调用方恢复。
async fn wait_until_game_exits(game_id: &str) {
    use std::time::{Duration, Instant};

    let deadline = Instant::now() + Duration::from_secs(24 * 3600);
    loop {
        let ended = if let Ok(mut manager) = lock_manager() {
            match manager.processes.get_mut(game_id) {
                // 进程已被取走（用户停止）或记录不存在 → 视为已结束
                None => true,
                Some(game) => match game.child_process.as_mut().map(|c| c.try_wait()) {
                    Some(Ok(Some(_))) => true,
                    Some(Ok(None)) => false,
                    Some(Err(_)) => true,
                    None => true,
                },
            }
        } else {
            true
        };
        if ended {
            return;
        }
        if Instant::now() >= deadline {
            return;
        }
        tokio::time::sleep(Duration::from_millis(1000)).await;
    }
}

/// 构建待下载清单：优先匹配校验失败项，空壳游戏则全量下载。
/// 返回 (分类, 下载项) 列表，natives 保留解压配置。
async fn build_download_list(
    config: &LaunchConfig,
    validation: &crate::game::validator::GameValidation,
) -> Result<Vec<(String, FileDownload)>, String> {
    let version_json = crate::download::version::fetch_version_value(&config.version).await?;
    let manifest = parse_version_json(&version_json).await?;

    if validation.empty {
        let mut all: Vec<(String, FileDownload)> = Vec::new();
        if let Some(c) = &manifest.client_jar {
            all.push(("client".to_string(), c.clone()));
        }
        if let Some(i) = &manifest.asset_index {
            all.push(("index".to_string(), i.clone()));
        }
        for lib in &manifest.libraries {
            all.push(("library".to_string(), lib.clone()));
        }
        for native in &manifest.natives {
            all.push(("native".to_string(), native.clone()));
        }
        for asset in &manifest.assets {
            all.push(("asset".to_string(), asset.clone()));
        }
        if let Some(lc) = &manifest.log_config {
            all.push(("log_config".to_string(), lc.clone()));
        }
        return Ok(all);
    }

    let mut result: Vec<(String, FileDownload)> = Vec::new();
    for check in &validation.failed {
        let mut found: Option<(String, FileDownload)> = None;
        match check.category.as_str() {
            "client" | "version" => {
                found = manifest
                    .client_jar
                    .as_ref()
                    .map(|c| ("client".to_string(), c.clone()));
            }
            "index" => {
                found = manifest
                    .asset_index
                    .as_ref()
                    .map(|c| ("index".to_string(), c.clone()));
            }
            "library" => {
                found = manifest
                    .libraries
                    .iter()
                    .find(|l| l.path == check.path)
                    .map(|l| ("library".to_string(), l.clone()));
            }
            "native" => {
                found = manifest
                    .natives
                    .iter()
                    .find(|l| l.path == check.path)
                    .map(|l| ("native".to_string(), l.clone()));
            }
            "asset" => {
                found = manifest
                    .assets
                    .iter()
                    .find(|a| a.path == check.path)
                    .map(|a| ("asset".to_string(), a.clone()));
            }
            "log_config" => {
                found = manifest
                    .log_config
                    .as_ref()
                    .map(|l| ("log_config".to_string(), l.clone()));
            }
            _ => {}
        }
        if let Some(item) = found {
            if !result.iter().any(|(_, f)| f.path == item.1.path) {
                result.push(item);
            }
        }
    }
    Ok(result)
}

/// 停止一个游戏的子进程
fn stop_one(manager: &mut LaunchManager, game_id: &str) -> Result<String, String> {
    let Some(game) = manager.processes.get_mut(game_id) else {
        return Ok(format!("游戏 {} 未在运行", game_id));
    };

    match game.child_process.take() {
        Some(mut child) => {
            if let Err(e) = child.kill() {
                let error_msg = format!("终止进程失败: {}", e);
                game.last_error = Some(error_msg.clone());
                return Err(error_msg);
            }

            if let Err(e) = child.wait() {
                let error_msg = format!("等待进程结束失败: {}", e);
                game.last_error = Some(error_msg.clone());
                return Err(error_msg);
            }

            game.status = LaunchStatus::Stopped;
            log_info!("✅ Minecraft 已停止: {}", game_id);
            Ok(format!("Minecraft 已停止: {}", game_id))
        }
        None => {
            game.status = LaunchStatus::Stopped;
            game.last_error = Some("启动已取消".to_string());
            Ok(format!("游戏 {} 已取消启动", game_id))
        }
    }
}

/// 停止 Minecraft 游戏；未指定游戏 ID 时停止全部
pub fn stop_game(game_id: Option<String>) -> Result<String, String> {
    let mut manager = lock_manager()?;

    match game_id {
        Some(id) => stop_one(&mut manager, &id),
        None => {
            let keys: Vec<String> = manager.processes.keys().cloned().collect();
            if keys.is_empty() {
                return Ok("Minecraft 未在运行".to_string());
            }
            let mut results = Vec::with_capacity(keys.len());
            for key in keys {
                results.push(stop_one(&mut manager, &key)?);
            }
            Ok(results.join("\n"))
        }
    }
}

/// 获取聚合启动状态（全部游戏）
pub fn get_launch_status() -> Result<LaunchStatus, String> {
    let mut manager = lock_manager()?;

    for game in manager.processes.values_mut() {
        update_process_status(game)?;
    }

    Ok(aggregate_status(&manager))
}

/// 获取指定游戏的启动状态与进度（以游戏 ID 标识）
pub fn get_launch_status_by_key(game_id: &str) -> Result<LaunchStatusInfo, String> {
    let mut manager = lock_manager()?;

    match manager.processes.get_mut(game_id) {
        Some(game) => {
            update_process_status(game)?;
            Ok(LaunchStatusInfo {
                status: game.status.clone(),
                progress: game.progress,
                stage: game.stage.clone(),
                last_error: game.last_error.clone(),
                crash_summary: game.crash_summary.clone(),
            })
        }
        None => Ok(LaunchStatusInfo {
            status: LaunchStatus::Idle,
            progress: 0,
            stage: String::new(),
            last_error: None,
            crash_summary: None,
        }),
    }
}

/// 获取全部运行游戏的快照列表
pub fn get_launch_games() -> Result<Vec<LaunchGameInfo>, String> {
    let mut manager = lock_manager()?;

    for game in manager.processes.values_mut() {
        let _ = update_process_status(game);
    }

    Ok(manager
        .processes
        .iter()
        .map(|(game_id, game)| LaunchGameInfo {
            game_id: game_id.clone(),
            game_dir: game.config.game_dir.clone(),
            status: game.status.clone(),
            pid: game.child_process.as_ref().map(|c| c.id()),
            version: game.config.version.clone(),
            username: game.config.username.clone(),
            last_error: game.last_error.clone(),
            progress: game.progress,
            stage: game.stage.clone(),
        })
        .collect())
}

/// 获取默认启动配置
pub fn get_launch_config() -> Result<LaunchConfig, String> {
    let manager = lock_manager()?;
    Ok(manager.default_config.clone())
}

/// 更新默认启动配置
pub fn update_launch_config(config: LaunchConfig) -> Result<String, String> {
    let mut manager = lock_manager()?;
    manager.default_config = config;
    log_info!("✅ 启动配置已更新");
    Ok("启动配置已更新".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn game(status: LaunchStatus) -> RunningGame {
        RunningGame {
            config: LaunchConfig::default(),
            child_process: None,
            status,
            last_error: None,
            progress: 0,
            stage: String::new(),
            exit_code: None,
            crash_summary: None,
            log_key: String::new(),
        }
    }

    fn manager_with(statuses: &[(&str, LaunchStatus)]) -> LaunchManager {
        LaunchManager {
            default_config: LaunchConfig::default(),
            processes: statuses
                .iter()
                .map(|(key, status)| (key.to_string(), game(status.clone())))
                .collect(),
        }
    }

    #[test]
    fn aggregate_empty_is_idle() {
        assert_eq!(
            aggregate_status(&LaunchManager::default()),
            LaunchStatus::Idle
        );
    }

    #[test]
    fn aggregate_single_running() {
        let m = manager_with(&[("a", LaunchStatus::Running)]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Running);
    }

    #[test]
    fn aggregate_running_beats_crashed_and_stopped() {
        let m = manager_with(&[
            ("a", LaunchStatus::Running),
            ("b", LaunchStatus::Crashed),
            ("c", LaunchStatus::Stopped),
        ]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Running);
    }

    #[test]
    fn aggregate_launching_beats_running() {
        let m = manager_with(&[("a", LaunchStatus::Launching), ("b", LaunchStatus::Running)]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Launching);
    }

    #[test]
    fn aggregate_crashed_beats_stopped() {
        let m = manager_with(&[("a", LaunchStatus::Crashed), ("b", LaunchStatus::Stopped)]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Crashed);
    }

    #[test]
    fn aggregate_all_stopped() {
        let m = manager_with(&[("a", LaunchStatus::Stopped), ("b", LaunchStatus::Stopped)]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Stopped);
    }

    #[test]
    fn aggregate_mixed_idle_and_stopped_is_stopped() {
        let m = manager_with(&[("a", LaunchStatus::Idle), ("b", LaunchStatus::Stopped)]);
        assert_eq!(aggregate_status(&m), LaunchStatus::Stopped);
    }

    #[test]
    fn status_info_reports_progress_and_stage() {
        let mut m = LaunchManager::default();
        let mut i = game(LaunchStatus::Running);
        i.progress = 100;
        i.stage = "游戏运行中".to_string();
        m.processes.insert("x".to_string(), i);
        assert_eq!(aggregate_status(&m), LaunchStatus::Running);

        let mut guard = m;
        let game = guard.processes.get_mut("x").unwrap();
        assert_eq!(game.progress, 100);
        assert_eq!(game.stage, "游戏运行中");
    }

    #[test]
    fn unknown_game_returns_idle_status_info() {
        let _ = LAUNCH_MANAGER.set(Mutex::new(LaunchManager::default()));
        let info = get_launch_status_by_key("no-such-id").unwrap();
        assert_eq!(info.status, LaunchStatus::Idle);
        assert_eq!(info.progress, 0);
    }

    #[test]
    fn launch_returns_game_id_immediately() {
        let _ = LAUNCH_MANAGER.set(Mutex::new(LaunchManager::default()));
        let (ctx, gm) = {
            let dir =
                std::env::temp_dir().join(format!("wecraft-launch-test-{}", std::process::id()));
            let ctx = crate::app_context::AppContext::new(dir.join("work"), dir.join("games"));
            let gm = GameManager::new(ctx.clone());
            (ctx, gm)
        };
        let dm = DownloadManager::new();
        let config = LaunchConfig {
            java_path: "nonexistent-java".to_string(),
            version: "1.20.4".to_string(),
            game_dir: ctx.game_dir("vg1").to_string_lossy().to_string(),
            ..Default::default()
        };
        let id = launch_game(Some(config), &ctx, dm, gm).unwrap();
        assert!(!id.is_empty());

        let info = get_launch_status_by_key(&id).unwrap();
        assert_eq!(info.status, LaunchStatus::Launching);
        assert_eq!(info.progress, 0);
    }
}
