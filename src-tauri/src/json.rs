use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;

#[derive(Debug, Clone, PartialEq)]
pub enum JsonValue {
    Object(HashMap<String, JsonValue>),
    Array(Vec<JsonValue>),
    String(String),
    Number(f64),
    Boolean(bool),
    Null,
}

struct JsonParser {
    chars: Vec<char>,
    index: usize,
}

impl JsonParser {
    fn new(input: &str) -> Self {
        JsonParser {
            chars: input.chars().collect(),
            index: 0,
        }
    }

    fn skip_whitespace(&mut self) {
        while self.index < self.chars.len() && self.chars[self.index].is_whitespace() {
            self.index += 1;
        }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.index).copied()
    }

    fn next_char(&mut self) -> Option<char> {
        let c = self.peek();
        self.index += 1;
        c
    }

    fn parse_string(&mut self) -> Result<String, String> {
        self.next_char();
        let mut result = String::new();
        while let Some(c) = self.next_char() {
            match c {
                '"' => return Ok(result),
                '\\' => match self.next_char() {
                    Some('"') => result.push('"'),
                    Some('\\') => result.push('\\'),
                    Some('n') => result.push('\n'),
                    Some('r') => result.push('\r'),
                    Some('t') => result.push('\t'),
                    Some(c) => return Err(format!("未知转义字符：\\{}", c)),
                    None => return Err("字符串未结束".to_string()),
                },
                c => result.push(c),
            }
        }
        Err("字符串未结束".to_string())
    }

    fn parse_number(&mut self) -> Result<f64, String> {
        let mut num_str = String::new();
        if let Some('-') = self.peek() {
            num_str.push(self.next_char().unwrap());
        }
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() {
                num_str.push(self.next_char().unwrap());
            } else {
                break;
            }
        }
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
        if let Some('e') | Some('E') = self.peek() {
            num_str.push(self.next_char().unwrap());
            if let Some('+') | Some('-') = self.peek() {
                num_str.push(self.next_char().unwrap());
            }
            while let Some(c) = self.peek() {
                if c.is_ascii_digit() {
                    num_str.push(self.next_char().unwrap());
                } else {
                    break;
                }
            }
        }
        num_str.parse().map_err(|e| format!("无效数字：{}", e))
    }

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

    fn parse_object(&mut self) -> Result<JsonValue, String> {
        self.next_char();
        let mut object = HashMap::new();
        self.skip_whitespace();
        if self.peek() != Some('}') {
            loop {
                self.skip_whitespace();
                let key = match self.parse_value()? {
                    JsonValue::String(s) => s,
                    _ => return Err("对象的键必须是字符串".to_string()),
                };
                self.skip_whitespace();
                if self.next_char() != Some(':') {
                    return Err("缺少冒号".to_string());
                }
                let value = self.parse_value()?;
                object.insert(key, value);
                self.skip_whitespace();
                match self.next_char() {
                    Some(',') => continue,
                    Some('}') => break,
                    _ => return Err("对象缺少 }".to_string()),
                }
            }
        } else {
            self.next_char();
        }
        Ok(JsonValue::Object(object))
    }

    fn parse_array(&mut self) -> Result<JsonValue, String> {
        self.next_char();
        let mut array = Vec::new();
        self.skip_whitespace();
        if self.peek() != Some(']') {
            loop {
                let value = self.parse_value()?;
                array.push(value);
                self.skip_whitespace();
                match self.next_char() {
                    Some(',') => continue,
                    Some(']') => break,
                    _ => return Err("数组缺少 ]".to_string()),
                }
            }
        } else {
            self.next_char();
        }
        Ok(JsonValue::Array(array))
    }

    fn parse_boolean(&mut self) -> Result<JsonValue, String> {
        match self.peek() {
            Some('t') => {
                if self.chars.get(self.index..self.index + 4) == Some(&['t', 'r', 'u', 'e']) {
                    self.index += 4;
                    Ok(JsonValue::Boolean(true))
                } else {
                    Err("无效布尔值".to_string())
                }
            }
            Some('f') => {
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

    fn parse_null(&mut self) -> Result<JsonValue, String> {
        if self.chars.get(self.index..self.index + 4) == Some(&['n', 'u', 'l', 'l']) {
            self.index += 4;
            Ok(JsonValue::Null)
        } else {
            Err("无效 null".to_string())
        }
    }
}

impl JsonValue {
    pub fn parse(input: &str) -> Result<Self, String> {
        let mut parser = JsonParser::new(input);
        let value = parser.parse_value()?;
        parser.skip_whitespace();
        if parser.index < parser.chars.len() {
            return Err("多余字符".to_string());
        }
        Ok(value)
    }

    pub fn to_json_string(&self) -> String {
        match self {
            JsonValue::Object(obj) => {
                let mut items = Vec::new();
                for (key, value) in obj {
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

pub fn read_json_from_file<P: AsRef<Path>>(path: P) -> Result<JsonValue, String> {
    let mut file = File::open(path).map_err(|e| format!("打开文件失败：{}", e))?;
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| format!("读取文件失败：{}", e))?;
    JsonValue::parse(&content)
}

pub fn write_json_to_file<P: AsRef<Path>>(path: P, value: &JsonValue) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)
        .map_err(|e| format!("创建/打开文件失败：{}", e))?;
    let json_str = value.to_json_string();
    file.write_all(json_str.as_bytes()).map_err(|e| format!("写入文件失败：{}", e))?;
    Ok(())
}