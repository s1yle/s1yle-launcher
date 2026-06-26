use serde::Serialize;
use std::collections::HashMap;

/// 系统字体信息
#[derive(Debug, Serialize, PartialEq, Eq, Hash)]
pub struct SystemFont {
    /// 字体名称
    pub name: String,
}

/// 字体类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub enum FontType {
    /// 当前系统字体
    CURRENT,
    /// 衬线字体
    SERIF,
    /// 无衬线字体
    SANS,
    /// 等宽字体
    MONO,
}

// 以后 linux 下也许应该考虑，
// 如果用户的环境中没有fontconfig工具(一般都有吧，你的linux不会没有fontconfig?!!),
// 该怎么获取字体
#[cfg(target_os = "linux")]
fn list_system_font() -> Option<Vec<SystemFont>> {
    // fc-list : family style file spacing
    //        Lists the filename and spacing value for each font face. ``:'' is an empty pattern that matches all fonts.
    use std::{collections::HashSet, process::Command};

    let output = Command::new("fc-list")
        .arg(":")
        .arg("family")
        .output()
        .expect("fc-list未安装？");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut seen: HashSet<SystemFont> = HashSet::new();
    let mut fonts: Vec<SystemFont> = Vec::new();

    for line in stdout.lines() {
        let name = line.trim();
        if !name.is_empty()
            && seen.insert(SystemFont {
                name: name.to_string(),
            })
        {
            fonts.push(SystemFont {
                name: name.to_string(),
            });
        }
    }

    Some(fonts)
}

#[cfg(target_os = "linux")]
fn get_font_type(font_type: FontType) -> Option<String> {
    use std::process::Command;

    use crate::font::FontType::{CURRENT, MONO, SANS, SERIF};

    let mut font_type_ = "serif";

    match font_type {
        CURRENT => font_type_ = "",
        SERIF => font_type_ = "serif",
        SANS => font_type_ = "sans",
        MONO => font_type_ = "mono",
    }

    let output = Command::new("fc-match")
        .arg(font_type_)
        .arg(":")
        .arg("family")
        .output()
        .expect("fc-match未安装？");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let name = stdout.lines().next().unwrap_or("Unknown Name");

    Some(name.to_string())
}

#[cfg(target_os = "linux")]
fn get_cur_font() -> Option<HashMap<FontType, SystemFont>> {
    println!("---------------linux) get_cur_font------------------");

    let cur_name = get_font_type(FontType::CURRENT).unwrap_or("Unknown Current Font".to_string());
    let serif_name = get_font_type(FontType::SERIF).unwrap_or("Unknown Serif Font".to_string());
    let sans_name = get_font_type(FontType::SANS).unwrap_or("Unknown Sans Font".to_string());
    let mono_name = get_font_type(FontType::MONO).unwrap_or("Unknown Mono Font".to_string());

    let mut ret_val: HashMap<FontType, SystemFont> = HashMap::new();

    ret_val
        .entry(FontType::CURRENT)
        .or_insert(SystemFont { name: cur_name });
    ret_val
        .entry(FontType::SERIF)
        .or_insert(SystemFont { name: serif_name });
    ret_val
        .entry(FontType::SANS)
        .or_insert(SystemFont { name: sans_name });
    ret_val
        .entry(FontType::MONO)
        .or_insert(SystemFont { name: mono_name });

    println!("ret_val: {:?}", ret_val);

    println!("---------------linux) get_cur_font------------------");

    Some(ret_val)
}

#[cfg(target_os = "windows")]
fn list_system_font() -> Option<Vec<SystemFont>> {
    None
}

#[cfg(target_os = "windows")]
fn get_cur_font() -> Option<HashMap<FontType, SystemFont>> {
    None
}

/// 获取当前系统字体映射（CURRENT/SERIF/SANS/MONO）
#[tauri::command]
pub fn get_font() -> HashMap<FontType, SystemFont> {
    get_cur_font().unwrap_or_default()
}

/// 获取系统已安装的字体列表
#[tauri::command]
pub fn get_system_fonts() -> Vec<SystemFont> {
    list_system_font().unwrap_or_default()
}

#[test]
fn test_list_linux_system_font() {
    if let Some(rs) = list_system_font() {
        println!("获取系统字体成功!");
        println!("        字体数量: {}", rs.len());
        // print!("        字体数量: {:?}", rs);
    }
}
#[test]
fn test_get_cur_font() {
    if let Some(rs) = get_cur_font() {}
}
