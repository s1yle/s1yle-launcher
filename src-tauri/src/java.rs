use serde::Serialize;
use std::path::PathBuf;

// 新增文件 src-tauri/src/java.rs
//
//          #[derive(Serialize, Clone, Debug)]
//          pub struct JavaInstallation {
//              pub path: String,          // java 可执行文件绝对路径
//              pub version: String,       // 完整版本号 "17.0.1"
//              pub vendor: String,        // "OpenJDK" / "Oracle" / etc
//          }
//
//          // Tauri 命令 1: 扫描系统 Java 安装
//          #[tauri::command]
//          pub async fn scan_java_installations() -> Result<Vec<JavaInstallation>, String>
//
//          // Tauri 命令 2: 获取指定 Java 路径的版本信息
//          #[tauri::command]
//          pub async fn get_java_version(path: String) -> Result<JavaInstallation, String>
//
// ┌──────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │平台                                      │扫描来源                                                                                                                                   │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │通用                                      │PATH 中的 java/java.exe、JAVA_HOME 环境变量                                                                                                │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │Linux                                     │/usr/lib/jvm/*/bin/java、/usr/lib/java/*/bin/java、/usr/java/*/bin/java、alternatives --list                                               |
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │macOS                                     │/Library/Java/JavaVirtualMachines/*/Contents/Home/bin/java、/usr/libexec/java_home                                                         │
// ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
// │Windows                                   │注册表 HKLM\SOFTWARE\JavaSoft\*、Program Files\Java\*、Program Files (x86)\Java\*                                                          │
// └──────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

#[derive(Serialize, Clone, Debug)]
pub struct JavaInstallation {
    pub path: PathBuf,
    pub version: String,
    pub vendor: String,
    pub is_jdk: bool,
}

fn scan_java_on_linux() -> Result<Vec<JavaInstallation>, String> {
    use std::fs;
    use std::fs::symlink_metadata;
    use std::process::Command;

    println!("------------------- scan_java_on_linux ------------------------");

    const USR_LIB_JVM: &str = "/usr/lib/jvm/";
    const USR_LIB_JAVA: &str = "/usr/lib/java/";
    const USR_JAVA: &str = "/usr/java";
    let mut javas: Vec<JavaInstallation> = Vec::default();

    // 第一步：扫描 java 一般存放的位置
    let linux_java_paths = Vec::from([USR_LIB_JVM, USR_LIB_JAVA, USR_JAVA]);
    for path in linux_java_paths {
        if let Ok(entrys) = fs::read_dir(path) {
            for entry in entrys {
                let metadata = symlink_metadata(entry.as_ref().unwrap().path());
                let mut is_jdk = false;

                if !metadata.as_ref().unwrap().is_symlink() {
                    println!("path: {} \n", path);
                    println!("current entry: {:?}", entry);
                    println!("METADATA {:?}", metadata);

                    // 初步解析出的 java 版本号
                    let java_home = entry.as_ref().unwrap().file_name();
                    println!("JAVA_HOME: {:?}", java_home);

                    // 进入 bin 目录
                    let inner_path = entry.unwrap().path().join("bin");

                    // 检查是 jdk 还是 jre
                    let javac_path = inner_path.join("javac");
                    is_jdk = javac_path.is_file();

                    println!("\n inner_path: {:?}", inner_path);
                    if let Ok(entrys_) = fs::read_dir(inner_path) {
                        for entry in entrys_.filter_map(|rs| rs.ok()) {
                            // 获取到 java 可执行文件
                            if entry.file_name() == "java" {
                                use regex::Regex;

                                println!("---------------------------------------");
                                println!("inner_entry: {:?}", entry);
                                println!("inner_entry.path: {:?}", entry.path());
                                println!("inner_entry.filetype: {:?}", entry.file_type());
                                println!("inner_entry.filename: {:?}", entry.file_name());
                                println!("---------------------------------------\n");

                                let output = Command::new(entry.path())
                                    .arg("-version")
                                    .output()
                                    .expect("command exec failed!");
                                println!("raw: {:?}", output);
                                println!("status: {:?}", output.status);
                                println!("stdout: {:?}", output.stdout);
                                println!("stderr: {:?}", output.stderr);

                                let stderr_bytes = output.stderr;
                                let stderr_txt = String::from_utf8(stderr_bytes)
                                    .map_err(|e| format!("非utf-8输出: {}", e))?;

                                let version_reg =
                                    Regex::new(r#"version "(\d+\.+\d+\.+\d+)"#).unwrap();

                                // 通过正则表达式获取 version 字符串
                                let version = version_reg
                                    .captures(&stderr_txt[..])
                                    .and_then(|cap| cap.get(1))
                                    .map(|m| m.as_str().to_string())
                                    .unwrap_or_else(|| "Unknown".to_string());

                                println!("version: {:?}", version);

                                // 获取发行版/厂商
                                let vendor_reg =
                                    Regex::new(r"Runtime Environment \(([A-Za-z_]+)-").unwrap();
                                let vendor = vendor_reg
                                    .captures(&stderr_txt[..])
                                    .and_then(|cap| cap.get(1))
                                    .map(|m| m.as_str().to_string())
                                    .unwrap_or_else(|| "Unknown".to_string());

                                println!("vendor: {:?}", vendor);

                                javas.push(JavaInstallation {
                                    path: entry.path(),
                                    is_jdk,
                                    version,
                                    vendor,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    println!("------------------- scan_java_on_linux ------------------------");

    if javas.is_empty() {
        Err(format!("linux下未扫描出 java！"))
    } else {
        Ok(javas)
    }
}

#[tauri::command]
pub fn scan_java_installations() -> Result<Vec<JavaInstallation>, String> {
    #[cfg(target_os = "linux")]
    {
        scan_java_installations()
    }
}

#[test]
fn test_scan_java() {
    if let Ok(rs) = scan_java_on_linux() {
        println!("rs: {:?}", rs);
    }
}
