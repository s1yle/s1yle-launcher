// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;


// ------------------------------
// 1. 定义 JSON 数据结构（用 enum 表示所有 JSON 类型）
// ------------------------------
#[derive(Debug, Clone, PartialEq)]
enum JsonValue {
    Object(HashMap<String, JsonValue>), // JSON 对象：{"key": "value"}
    Array(Vec<JsonValue>),              // JSON 数组：[1, 2, 3]
    String(String),                      // JSON 字符串："hello"
    Number(f64),                         // JSON 数字：123 或 3.14
    Boolean(bool),                       // JSON 布尔：true / false
    Null,                                // JSON 空值：null
}

// ------------------------------
// 2. 手搓 JSON 解析器（把字符串转成 JsonValue）
// ------------------------------
struct JsonParser {
    chars: Vec<char>, // 把输入字符串拆成字符数组，方便逐个读取
    index: usize,     // 当前读取到的位置
}

impl JsonParser {
    // 新建解析器
    fn new(input: &str) -> Self {
        JsonParser {
            chars: input.chars().collect(),
            index: 0,
        }
    }

    // 跳过空白字符（空格、换行、制表符）
    fn skip_whitespace(&mut self) {
        while self.index < self.chars.len() && self.chars[self.index].is_whitespace() {
            self.index += 1;
        }
    }

    // 读取当前字符（不移动索引）
    fn peek(&self) -> Option<char> {
        self.chars.get(self.index).copied()
    }

    // 读取当前字符并移动索引
    fn next_char(&mut self) -> Option<char> {
        let c = self.peek();
        self.index += 1;
        c
    }

    // 解析 JSON 字符串（比如 "hello\"world"）
    fn parse_string(&mut self) -> Result<String, String> {
        self.next_char(); // 跳过开头的 "
        let mut result = String::new();

        while let Some(c) = self.next_char() {
            match c {
                '"' => return Ok(result), // 遇到结束的 "，返回字符串
                '\\' => {
                    // 处理转义字符：\" \\ \n \r \t
                    match self.next_char() {
                        Some('"') => result.push('"'),
                        Some('\\') => result.push('\\'),
                        Some('n') => result.push('\n'),
                        Some('r') => result.push('\r'),
                        Some('t') => result.push('\t'),
                        Some(c) => return Err(format!("未知转义字符：\\{}", c)),
                        None => return Err("字符串未结束".to_string()),
                    }
                }
                c => result.push(c),
            }
        }

        Err("字符串未结束".to_string())
    }

    // 解析 JSON 数字（比如 123, -456, 3.14, 1e10）
    fn parse_number(&mut self) -> Result<f64, String> {
        let mut num_str = String::new();

        // 处理负号
        if let Some('-') = self.peek() {
            num_str.push(self.next_char().unwrap());
        }

        // 处理整数部分
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() {
                num_str.push(self.next_char().unwrap());
            } else {
                break;
            }
        }

        // 处理小数部分
        if let Some('.') = self.peek() {
            num_str.push(self.next_char().unwrap());
            while let Some(c) = self.peek() {
                if c.is_ascii_digit() {
                    num_str.push(self.next_char().unwrap());
                } else {
                    break;
                }
            }
        }

        // 处理指数部分（e/E）
        if let Some('e') | Some('E') = self.peek() {
            num_str.push(self.next_char().unwrap());
            // 处理指数的正负号
            if let Some('+') | Some('-') = self.peek() {
                num_str.push(self.next_char().unwrap());
            }
            // 处理指数数字
            while let Some(c) = self.peek() {
                if c.is_ascii_digit() {
                    num_str.push(self.next_char().unwrap());
                } else {
                    break;
                }
            }
        }

        // 把字符串转成 f64
        num_str.parse().map_err(|e| format!("无效数字：{}", e))
    }

    // 解析 JSON 核心入口（递归解析所有类型）
    fn parse_value(&mut self) -> Result<JsonValue, String> {
        self.skip_whitespace();
        match self.peek() {
            Some('{') => self.parse_object(),
            Some('[') => self.parse_array(),
            Some('"') => self.parse_string().map(JsonValue::String),
            Some('0'..='9') | Some('-') => self.parse_number().map(JsonValue::Number),
            Some('t') | Some('f') => self.parse_boolean(),
            Some('n') => self.parse_null(),
            Some(c) => Err(format!("意外字符：{}", c)),
            None => Err("意外结束".to_string()),
        }
    }

    // 解析 JSON 对象：{"key1": value1, "key2": value2}
    fn parse_object(&mut self) -> Result<JsonValue, String> {
        self.next_char(); // 跳过开头的 {
        let mut object = HashMap::new();
        self.skip_whitespace();

        // 如果不是 }，说明有键值对
        if self.peek() != Some('}') {
            loop {
                self.skip_whitespace();
                // 解析键（必须是字符串）
                let key = match self.parse_value()? {
                    JsonValue::String(s) => s,
                    _ => return Err("对象的键必须是字符串".to_string()),
                };

                self.skip_whitespace();
                // 跳过冒号
                if self.next_char() != Some(':') {
                    return Err("缺少冒号".to_string());
                }

                // 解析值
                let value = self.parse_value()?;
                object.insert(key, value);

                self.skip_whitespace();
                // 遇到逗号继续，遇到 } 结束
                match self.next_char() {
                    Some(',') => continue,
                    Some('}') => break,
                    _ => return Err("对象缺少 }".to_string()),
                }
            }
        } else {
            self.next_char(); // 跳过空对象的 }
        }

        Ok(JsonValue::Object(object))
    }

    // 解析 JSON 数组：[value1, value2, value3]
    fn parse_array(&mut self) -> Result<JsonValue, String> {
        self.next_char(); // 跳过开头的 [
        let mut array = Vec::new();
        self.skip_whitespace();

        // 如果不是 ]，说明有元素
        if self.peek() != Some(']') {
            loop {
                // 解析元素
                let value = self.parse_value()?;
                array.push(value);

                self.skip_whitespace();
                // 遇到逗号继续，遇到 ] 结束
                match self.next_char() {
                    Some(',') => continue,
                    Some(']') => break,
                    _ => return Err("数组缺少 ]".to_string()),
                }
            }
        } else {
            self.next_char(); // 跳过空数组的 ]
        }

        Ok(JsonValue::Array(array))
    }

    // 解析布尔值：true / false
    fn parse_boolean(&mut self) -> Result<JsonValue, String> {
        match self.peek() {
            Some('t') => {
                // 检查是不是 "true"
                if self.chars.get(self.index..self.index + 4) == Some(&['t', 'r', 'u', 'e']) {
                    self.index += 4;
                    Ok(JsonValue::Boolean(true))
                } else {
                    Err("无效布尔值".to_string())
                }
            }
            Some('f') => {
                // 检查是不是 "false"
                if self.chars.get(self.index..self.index + 5) == Some(&['f', 'a', 'l', 's', 'e']) {
                    self.index += 5;
                    Ok(JsonValue::Boolean(false))
                } else {
                    Err("无效布尔值".to_string())
                }
            }
            _ => Err("无效布尔值".to_string()),
        }
    }

    // 解析 null
    fn parse_null(&mut self) -> Result<JsonValue, String> {
        // 检查是不是 "null"
        if self.chars.get(self.index..self.index + 4) == Some(&['n', 'u', 'l', 'l']) {
            self.index += 4;
            Ok(JsonValue::Null)
        } else {
            Err("无效 null".to_string())
        }
    }
}

// 给 JsonValue 加一个解析方法，方便调用
impl JsonValue {
    fn parse(input: &str) -> Result<Self, String> {
        let mut parser = JsonParser::new(input);
        let value = parser.parse_value()?;
        parser.skip_whitespace();
        // 确保解析完所有字符
        if parser.index < parser.chars.len() {
            return Err("多余字符".to_string());
        }
        Ok(value)
    }
}

// ------------------------------
// 3. 手搓 JSON 生成器（把 JsonValue 转成字符串）
// ------------------------------
impl JsonValue {
    fn to_json_string(&self) -> String {
        match self {
            JsonValue::Object(obj) => {
                let mut items = Vec::new();
                for (key, value) in obj {
                    // 键要转成 JSON 字符串，值递归转
                    items.push(format!("\"{}\":{}", escape_string(key), value.to_json_string()));
                }
                format!("{{{}}}", items.join(","))
            }
            JsonValue::Array(arr) => {
                let items: Vec<String> = arr.iter().map(|v| v.to_json_string()).collect();
                format!("[{}]", items.join(","))
            }
            JsonValue::String(s) => format!("\"{}\"", escape_string(s)),
            JsonValue::Number(n) => n.to_string(),
            JsonValue::Boolean(b) => b.to_string(),
            JsonValue::Null => "null".to_string(),
        }
    }
}

// 辅助函数：转义字符串中的特殊字符（和解析时对应）
fn escape_string(s: &str) -> String {
    let mut result = String::new();
    for c in s.chars() {
        match c {
            '"' => result.push_str("\\\""),
            '\\' => result.push_str("\\\\"),
            '\n' => result.push_str("\\n"),
            '\r' => result.push_str("\\r"),
            '\t' => result.push_str("\\t"),
            c => result.push(c),
        }
    }
    result
}

// ------------------------------
// 4. 文件持久化：读取 JSON 文件 + 写入 JSON 文件
// ------------------------------
// 从文件读取 JSON
fn read_json_from_file<P: AsRef<Path>>(path: P) -> Result<JsonValue, String> {
    let mut file = File::open(path).map_err(|e| format!("打开文件失败：{}", e))?;
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| format!("读取文件失败：{}", e))?;
    JsonValue::parse(&content)
}

// 把 JSON 写入文件
fn write_json_to_file<P: AsRef<Path>>(path: P, value: &JsonValue) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true) // 清空文件再写
        .open(path)
        .map_err(|e| format!("创建/打开文件失败：{}", e))?;
    let json_str = value.to_json_string();
    file.write_all(json_str.as_bytes()).map_err(|e| format!("写入文件失败：{}", e))?;
    Ok(())
}

// ------------------------------
// 5. 测试：模拟配置持久化
// ------------------------------
fn main() {
    // 定义配置文件路径
    let config_path = "config.json";

    // --- 第一步：创建一个配置并写入文件 ---
    let mut config = HashMap::new();
    config.insert("username".to_string(), JsonValue::String("Steve".to_string()));
    config.insert("memory".to_string(), JsonValue::Number(2048.0));
    config.insert("fullscreen".to_string(), JsonValue::Boolean(true));
    config.insert("mods".to_string(), JsonValue::Array(vec![
        JsonValue::String("fabric-api".to_string()),
        JsonValue::String("sodium".to_string()),
    ]));
    let config_value = JsonValue::Object(config);

    // 写入文件
    match write_json_to_file(config_path, &config_value) {
        Ok(_) => println!("配置已写入 config.json"),
        Err(e) => println!("写入失败：{}", e),
    }

    // --- 第二步：从文件读取配置并打印 ---
    match read_json_from_file(config_path) {
        Ok(value) => {
            println!("读取到的配置：{:?}", value);
            // 尝试获取 username
            if let JsonValue::Object(obj) = value {
                if let Some(JsonValue::String(name)) = obj.get("username") {
                    println!("用户名：{}", name);
                }
            }
        }
        Err(e) => println!("读取失败：{}", e),
    }

    s1yle_launcher_lib::run();
}