//! 游戏进程 stdout/stderr 管道捕获与日志缓冲（环形存储，供前端增量拉取）

use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::io::{BufRead, BufReader};
use std::process::Child;
use std::sync::Mutex;
use std::thread;

/// 日志等级（源自 MC 日志格式 `[时间] [线程/等级]` 的简单文本匹配）
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LogLevel {
    Info,
    Warn,
    Error,
    Fatal,
}

/// 单条日志行
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LogLine {
    pub level: LogLevel,
    pub text: String,
}

/// 日志拉取结果（增量游标）
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameLogResult {
    /// 下次拉取的游标位置
    pub offset: usize,
    /// 本段日志行
    pub lines: Vec<LogLine>,
}

/// 单游戏日志缓冲：环形队列，超上限丢最早行
struct LogBuffer {
    lines: VecDeque<LogLine>,
    /// 队首行的绝对编号（增量游标 = start + len）
    start: usize,
    max: usize,
}

impl LogBuffer {
    fn new(max: usize) -> Self {
        Self {
            lines: VecDeque::new(),
            start: 0,
            max,
        }
    }

    fn push(&mut self, line: LogLine) {
        if self.lines.len() >= self.max {
            self.lines.pop_front();
            self.start += 1;
        }
        self.lines.push_back(line);
    }

    /// 返回 (新游标, 行列表)；offset 早于缓冲起点时从起点返回
    fn slice_from(&self, offset: usize) -> (usize, Vec<LogLine>) {
        let from = offset.max(self.start);
        let skip = from - self.start;
        let lines: Vec<LogLine> = self.lines.iter().skip(skip).cloned().collect();
        (from + lines.len(), lines)
    }
}

/// 全局游戏日志存储：game_id → 缓冲
struct GameLogStore {
    inner: Mutex<HashMap<String, LogBuffer>>,
}

static GAME_LOG_STORE: OnceCell<GameLogStore> = OnceCell::new();

fn store() -> &'static GameLogStore {
    GAME_LOG_STORE.get_or_init(|| GameLogStore {
        inner: Mutex::new(HashMap::new()),
    })
}

/// 默认缓冲上限（行）
const MAX_LINES: usize = 2000;

/// 按 MC 日志格式解析等级：`[线程/FATAL]`/`[FATAL]`/`[SEVERE]` → Fatal，
/// `[ERROR]` → Error，`[WARN]` → Warn，其余（含 JVM 早期输出、无标记文本）按 Info 处理
fn parse_level(line: &str) -> LogLevel {
    if line.contains("/FATAL]") || line.contains("[FATAL]") || line.contains("/SEVERE]") || line.contains("[SEVERE]") {
        LogLevel::Fatal
    } else if line.contains("/ERROR]") || line.contains("[ERROR]") {
        LogLevel::Error
    } else if line.contains("/WARN]") || line.contains("[WARN]") {
        LogLevel::Warn
    } else {
        LogLevel::Info
    }
}

/// 单路管道读取线程：逐行解析入队，读到 EOF（进程退出）后自然结束。
/// 使用 read_until + 有损 UTF-8 转换，避免非 UTF-8 字节（如中文 Windows 的 GBK
/// 控制台输出）触发 `BufRead::lines` 的 InvalidData 而提前中断导致整段日志丢失。
fn read_loop<R: std::io::Read + Send + 'static>(reader: R, game_id: String) {
    let mut buf = BufReader::new(reader);
    let mut bytes: Vec<u8> = Vec::new();
    loop {
        bytes.clear();
        match buf.read_until(b'\n', &mut bytes) {
            Ok(0) => break,
            Ok(_) => {
                let line = String::from_utf8_lossy(&bytes)
                    .trim_end_matches(['\r', '\n'])
                    .to_string();
                if let Ok(mut store) = store().inner.lock() {
                    store
                        .entry(game_id.clone())
                        .or_insert_with(|| LogBuffer::new(MAX_LINES))
                        .push(LogLine {
                            level: parse_level(&line),
                            text: line,
                        });
                }
            }
            Err(_) => break,
        }
    }
}

/// 开启游戏日志捕获：把子进程 stdout/stderr 接为管道，各起一个线程异步读取。
/// 必须持续读取直至 EOF，否则管道缓冲写满会阻塞游戏进程。
pub fn start_capture(game_id: &str, child: &mut Child) {
    if let Some(stdout) = child.stdout.take() {
        thread::spawn({
            let id = game_id.to_string();
            move || read_loop(stdout, id)
        });
    }
    if let Some(stderr) = child.stderr.take() {
        thread::spawn({
            let id = game_id.to_string();
            move || read_loop(stderr, id)
        });
    }
}

/// 增量拉取指定游戏的日志
pub fn get_game_log(game_id: &str, offset: usize) -> GameLogResult {
    let store = store();
    let Ok(guard) = store.inner.lock() else {
        return GameLogResult {
            offset,
            lines: Vec::new(),
        };
    };
    match guard.get(game_id) {
        Some(buf) => {
            let (offset, lines) = buf.slice_from(offset);
            GameLogResult { offset, lines }
        }
        None => GameLogResult {
            offset,
            lines: Vec::new(),
        },
    }
}

/// 读取指定游戏的日志全量文本（供崩溃分析使用，可从指定偏移开始）
pub fn scan_logs(game_id: &str, max: usize) -> Vec<LogLine> {
    let store = store();
    let Ok(guard) = store.inner.lock() else {
        return Vec::new();
    };
    guard
        .get(game_id)
        .map(|buf| buf.lines.iter().rev().take(max).rev().cloned().collect())
        .unwrap_or_default()
}

/// 释放指定游戏的日志缓冲
pub fn drop_capture(game_id: &str) {
    if let Ok(mut guard) = store().inner.lock() {
        guard.remove(game_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_level_matches_mc_format() {
        assert_eq!(parse_level("[12:00:01] [main/INFO]: loading"), LogLevel::Info);
        assert_eq!(parse_level("[12:00:02] [main/WARN]: deprecated"), LogLevel::Warn);
        assert_eq!(parse_level("[12:00:03] [Render thread/ERROR]: boom"), LogLevel::Error);
        assert_eq!(parse_level("[12:00:04] [main/FATAL]: fatal"), LogLevel::Fatal);
        assert_eq!(parse_level("[12:00:05] [main/SEVERE]: old"), LogLevel::Fatal);
        assert_eq!(parse_level("[12:00:06] [INFO]: standalone"), LogLevel::Info);
        assert_eq!(parse_level("Picked up JAVA_TOOL_OPTIONS: -Xmx1G"), LogLevel::Info);
    }

    #[test]
    fn buffer_ring_evicts_oldest() {
        let mut buf = LogBuffer::new(3);
        for i in 0..5 {
            buf.push(LogLine {
                level: LogLevel::Info,
                text: format!("line{}", i),
            });
        }
        assert_eq!(buf.start, 2);
        assert_eq!(buf.lines.len(), 3);
        let (offset, lines) = buf.slice_from(0);
        assert_eq!(offset, 5);
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[0].text, "line2");
    }

    #[test]
    fn slice_from_mid_offset() {
        let mut buf = LogBuffer::new(10);
        for i in 0..5 {
            buf.push(LogLine {
                level: LogLevel::Info,
                text: format!("line{}", i),
            });
        }
        let (offset, lines) = buf.slice_from(3);
        assert_eq!(offset, 5);
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].text, "line3");
    }

    #[test]
    fn store_drop_and_incremental() {
        let id = "test-game";
        let store = store();
        {
            let mut guard = store.inner.lock().unwrap();
            let buf = guard.entry(id.to_string()).or_insert_with(|| LogBuffer::new(10));
            for i in 0..4 {
                buf.push(LogLine {
                    level: LogLevel::Info,
                    text: format!("l{}", i),
                });
            }
        }
        let first = get_game_log(id, 0);
        assert_eq!(first.offset, 4);
        assert_eq!(first.lines.len(), 4);
        let second = get_game_log(id, 4);
        assert_eq!(second.offset, 4);
        assert!(second.lines.is_empty());
        drop_capture(id);
        assert!(get_game_log(id, 0).lines.is_empty());
    }
}