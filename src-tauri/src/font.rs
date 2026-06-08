use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SystemFont {
    pub name: String,
    pub style: String,
}

#[cfg(target_os = "linux")]
fn list_system_font() -> Option<Vec<SystemFont>> {
    // fc-list : family style file spacing
    //        Lists the filename and spacing value for each font face. ``:'' is an empty pattern that matches all fonts.
    println!("---------------linux) list_system_font------------------");
    use std::process::Command;

    let output = Command::new("fc-list")
        .arg("--format")
        .arg("%{family}:%{style}\n")
        .output()
        .expect("fc-list未安装？");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut fonts: Vec<SystemFont> = Vec::new();
    for line in stdout.lines() {
        println!("line: {}", line);
        let mut parts = line.split(":");

        let name = parts.next().unwrap_or("Unknown Name");
        let style = parts.next().filter(|s| !s.is_empty()).unwrap_or("Normal");

        fonts.push(SystemFont {
            name: name.to_string(),
            style: style.to_string(),
        });

        println!("      name:{:?}", name);
        println!("      style:{:?}", style);
    }

    println!("---------------linux) list_system_font------------------");

    Some(fonts)
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<SystemFont> {
    list_system_font().unwrap_or_default()
}

#[test]
fn test_list_linux_system_font() {
    if let Some(rs) = list_system_font() {
        println!("获取系统字体成功!");
        print!("        字体数量: {}", rs.len());
        // print!("        字体数量: {:?}", rs);
    }
}
