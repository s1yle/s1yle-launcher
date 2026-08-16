//! 通过进程 PID 检测其是否已创建可见窗口（跨平台）
//!
//! - Windows: EnumWindows + GetWindowThreadProcessId + IsWindowVisible
//! - Linux: x11rb 查询 _NET_CLIENT_LIST 并匹配 _NET_WM_PID（XWayland 下同样适用）
//! - macOS / 其它: 暂不支持，返回 false（由上层超时兜底）

#[cfg(target_os = "linux")]
mod linux {
    use x11rb::connection::Connection;
    use x11rb::protocol::xproto::{AtomEnum, ConnectionExt};

    /// 查询窗口的 _NET_WM_PID 属性是否等于目标 pid
    fn window_has_pid(conn: &impl Connection, window: u32, pid: u32) -> bool {
        let _root = conn.setup().roots[0].root;
        let net_wm_pid = conn
            .intern_atom(false, b"_NET_WM_PID")
            .ok()
            .and_then(|c| c.reply().ok())
            .map(|r| r.atom);

        let Some(net_wm_pid) = net_wm_pid else {
            return false;
        };

        let value = match conn.get_property(false, window, net_wm_pid, AtomEnum::CARDINAL, 0, 1) {
            Ok(c) => match c.reply() {
                Ok(r) => r.value,
                Err(_) => return false,
            },
            Err(_) => return false,
        };

        parse_cardinal_ne(&value).map(|v| v == pid).unwrap_or(false)
    }

    /// 从 GetProperty 返回值解析 32 位整数。
    /// GetProperty 返回数据按客户端协商字节序传输（x11rb 连接协商为原生字节序），
    /// 与 _NET_CLIENT_LIST 的窗口 ID 解析保持一致。
    pub(crate) fn parse_cardinal_ne(value: &[u8]) -> Option<u32> {
        if value.len() < 4 {
            return None;
        }
        Some(u32::from_ne_bytes([value[0], value[1], value[2], value[3]]))
    }

    pub fn process_has_visible_window(pid: u32) -> bool {
        let (conn, _screen) = match x11rb::connect(None) {
            Ok(v) => v,
            Err(_) => return false,
        };

        let root = conn.setup().roots[0].root;
        let net_client_list = conn
            .intern_atom(false, b"_NET_CLIENT_LIST")
            .ok()
            .and_then(|c| c.reply().ok())
            .map(|r| r.atom);
        let Some(net_client_list) = net_client_list else {
            return false;
        };

        let clients = conn
            .get_property(false, root, net_client_list, AtomEnum::WINDOW, 0, 1024)
            .ok()
            .and_then(|c| c.reply().ok())
            .map(|r| r.value);
        let Some(clients) = clients else {
            return false;
        };

        // _NET_CLIENT_LIST 仅包含已映射（可见）的顶层窗口
        clients
            .chunks_exact(4)
            .map(|c| u32::from_ne_bytes([c[0], c[1], c[2], c[3]]))
            .any(|win| window_has_pid(&conn, win, pid))
    }
}

#[cfg(target_os = "linux")]
pub use linux::process_has_visible_window;

#[cfg(windows)]
mod windows_impl {
    use windows::Win32::{
        Foundation::{HWND, LPARAM},
        UI::WindowsAndMessaging::{EnumWindows, GetWindowThreadProcessId, IsWindowVisible},
    };

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> windows::core::BOOL {
        let target_pid = lparam.0 as u32; // 转换为 u32
        let mut window_pid: u32 = 0;
        let _ = !unsafe {
            GetWindowThreadProcessId(hwnd, Some(&mut window_pid))
        }; 
        if window_pid == target_pid && !unsafe{ IsWindowVisible(hwnd).as_bool() } {
            windows::core::BOOL(0) // 找到目标窗口，停止枚举
        } else {
            windows::core::BOOL(1) // 继续枚举
        }
    }

    pub fn process_has_visible_window(pid: LPARAM) -> bool {
        // 回调返回 FALSE 停止枚举时 EnumWindows 返回 FALSE，即视为命中
        let found = !unsafe { EnumWindows(Some(enum_proc), pid).is_err() };
        found
    }
}

#[cfg(windows)]
pub use windows_impl::process_has_visible_window;

#[cfg(not(any(windows, target_os = "linux")))]
pub fn process_has_visible_window(_pid: u32) -> bool {
    false
}

#[cfg(test)]
mod tests {
    #[test]
    fn unsupported_or_disconnected_returns_false() {
        // 非 Linux/Windows 平台或无显示环境时均返回 false（由上层超时兜底）
        #[cfg(not(any(windows, target_os = "linux")))]
        assert!(!super::process_has_visible_window(999999));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn parse_cardinal_ne_roundtrip() {
        // GetProperty 返回值按原生字节序（x11rb 协商，x86_64 为小端）
        let pid: u32 = 0x1234_5678;
        assert_eq!(
            super::linux::parse_cardinal_ne(&pid.to_ne_bytes()),
            Some(pid)
        );
        assert_eq!(super::linux::parse_cardinal_ne(&[0, 1, 2]), None);
    }
}
