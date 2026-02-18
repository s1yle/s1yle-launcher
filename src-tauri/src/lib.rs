// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// greet命令：接收一个name参数，返回问候语
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! 来自Rust后端的问候", name)
}

/// get_system_info命令：无需参数，返回当前系统信息
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

    Ok(SystemInfo { os: os.to_string(), arch: arch.to_string() })
}

/// 系统信息结构体
#[derive(serde::Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_system_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
