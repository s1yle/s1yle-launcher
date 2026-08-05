use serde::Serialize;
use std::collections::HashMap;
#[cfg(target_os = "windows")]
use windows::{
    Win32::{
        Foundation::WIN32_ERROR,
        System::Registry::{RegEnumKeyExW, RegEnumValueW},
    },
    core::PWSTR,
};

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
    use std::collections::HashSet;
    use windows::Win32::Foundation::ERROR_SUCCESS;
    use windows::Win32::System::Registry::{
        HKEY, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ, RegCloseKey, RegEnumValueW,
        RegOpenKeyExW,
    };
    use windows::core::PCWSTR;

    let key_path: Vec<u16> = "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    let mut fonts: Vec<SystemFont> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    // 从指定的根键枚举字体
    let enumerate_fonts =
        |root_key: HKEY, fonts: &mut Vec<SystemFont>, seen: &mut HashSet<String>| {
            let mut hkey = std::mem::MaybeUninit::uninit();
            let result = unsafe {
                RegOpenKeyExW(
                    root_key,
                    PCWSTR::from_raw(key_path.as_ptr()),
                    Some(0u32),
                    KEY_READ,
                    hkey.as_mut_ptr(),
                )
            };

            if result != ERROR_SUCCESS {
                return;
            }

            let hkey = unsafe { hkey.assume_init() };
            let mut index: u32 = 0;

            loop {
                let mut value_name = [0u16; 512];
                let mut cb_value_name: u32 = value_name.len() as u32;
                let mut data = [0u8; 1024];
                let mut cb_data: u32 = data.len() as u32;

                let result = unsafe {
                    RegEnumValueW(
                        hkey,
                        index,
                        Some(windows::core::PWSTR::from_raw(value_name.as_mut_ptr())),
                        &mut cb_value_name,
                        None,
                        None,
                        Some(data.as_mut_ptr()),
                        Some(&mut cb_data),
                    )
                };

                if result != ERROR_SUCCESS {
                    break;
                }

                let name = String::from_utf16_lossy(&value_name[..cb_value_name as usize]);
                let family = if let Some(pos) = name.rfind(" (") {
                    name[..pos].to_string()
                } else {
                    name
                };

                let family = family.trim().to_string();
                if !family.is_empty() && seen.insert(family.clone()) {
                    fonts.push(SystemFont { name: family });
                }

                index += 1;
            }

            let _ = unsafe { RegCloseKey(hkey) };
        };

    // 先读取 HKLM（系统字体）
    enumerate_fonts(HKEY_LOCAL_MACHINE, &mut fonts, &mut seen);
    // 再读取 HKCU（用户字体）
    enumerate_fonts(HKEY_CURRENT_USER, &mut fonts, &mut seen);

    Some(fonts)
}

#[cfg(target_os = "windows")]
fn get_cur_font() -> Option<HashMap<FontType, SystemFont>> {
    use windows::Win32::Foundation::ERROR_SUCCESS;
    use windows::Win32::System::Registry::{
        KEY_READ, RegCloseKey, RegOpenKeyExW, RegQueryValueExW,
    };
    use windows::core::PCWSTR;

    // 从注册表读取指定值名称的字体
    let get_font_from_registry = |value_name_str: &str| -> Option<String> {
        use windows::Win32::System::Registry::{HKEY, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};

        let key_path: Vec<u16> = "Control Panel\\Desktop\\WindowMetrics"
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();

        // 尝试从指定根键读取字体
        let try_read_font = |root_key: HKEY| -> Option<String> {
            let mut hkey = std::mem::MaybeUninit::uninit();
            let result = unsafe {
                RegOpenKeyExW(
                    root_key,
                    PCWSTR::from_raw(key_path.as_ptr()),
                    Some(0u32),
                    KEY_READ,
                    hkey.as_mut_ptr(),
                )
            };

            if result != ERROR_SUCCESS {
                return None;
            }

            let hkey = unsafe { hkey.assume_init() };
            let value_name: Vec<u16> = value_name_str
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            let mut data = [0u8; 256];
            let mut cb_data: u32 = data.len() as u32;

            let result = unsafe {
                RegQueryValueExW(
                    hkey,
                    PCWSTR::from_raw(value_name.as_ptr()),
                    None,
                    None,
                    Some(data.as_mut_ptr()),
                    Some(&mut cb_data),
                )
            };

            let _ = unsafe { RegCloseKey(hkey) };

            if result != ERROR_SUCCESS {
                return None;
            }

            #[repr(C)]
            struct LogFontW {
                height: i32,
                width: i32,
                escape: i32,
                orientation: i32,
                weight: i32,
                italic: u8,
                underline: u8,
                strike_out: u8,
                char_set: u8,
                out_precision: u8,
                clip_precision: u8,
                quality: u8,
                pitch_family: u8,
                face_name: [u16; 32],
            }

            if cb_data as usize >= std::mem::size_of::<LogFontW>() {
                let logfont: LogFontW = unsafe { std::ptr::read(data.as_ptr() as *const LogFontW) };
                let len = logfont.face_name.iter().position(|&c| c == 0).unwrap_or(32);
                let name = String::from_utf16_lossy(&logfont.face_name[..len]);
                if !name.is_empty() {
                    return Some(name);
                }
            }

            None
        };

        // 优先 HKCU（用户设置），回退 HKLM（系统默认）
        try_read_font(HKEY_CURRENT_USER).or_else(|| try_read_font(HKEY_LOCAL_MACHINE))
    };

    // 按优先级尝试获取字体：CaptionFont > MenuFont > 默认 Segoe UI
    let current = get_font_from_registry("CaptionFont")
        .or_else(|| get_font_from_registry("MenuFont"))
        .unwrap_or_else(|| "Segoe UI".to_string());

    println!("当前字体: {}", current);

    let mut map = HashMap::new();
    map.insert(FontType::CURRENT, SystemFont { name: current });

    Some(map)
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
fn test_list_windows_system_font() {
    if cfg!(target_os = "windows") {
        if let Some(rs) = list_system_font() {
            println!("Windows 字体数量: {}", rs.len());
            for f in rs.iter().take(5) {
                println!("  - {}", f.name);
            }
        }
    }
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

#[test]
fn get_cur_user_font() {
    if let Some(rs) = get_cur_font() {
        println!("       - {:?}", rs);
    }
}
