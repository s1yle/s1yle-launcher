// src-tauri/src/launch/args.rs
// 启动参数构建：版本 JSON 解析、继承链合并与 ${...} 模板替换

use std::collections::HashMap;
use std::path::PathBuf;

use crate::app_context::AppContext;
use crate::download::models::{Library, Rule};
use crate::download::utils::rules_allow;
use crate::launch::LaunchConfig;
use crate::log_info;

// ======================== 版本 JSON 解析 ========================

/// 解析后的启动信息（合并继承链后）
struct ParsedLaunch {
    main_class: String,
    asset_index_id: String,
    jvm_args: Vec<String>,
    game_args: Vec<String>,
    classpath: Vec<String>,
    logging_file: Option<PathBuf>,
}

/// 从版本 JSON 读取库文件的 classpath 条目
fn collect_library_paths(version_json: &serde_json::Value) -> Vec<String> {
    let mut paths = Vec::new();

    if let Some(libraries) = version_json["libraries"].as_array() {
        for lib_json in libraries {
            let library: Library = match serde_json::from_value(lib_json.clone()) {
                Ok(lib) => lib,
                Err(_) => continue,
            };

            if !rules_allow(&library.rules) {
                continue;
            }

            let path = library
                .downloads
                .as_ref()
                .and_then(|d| d.artifact.as_ref())
                .map(|a| a.path.clone())
                .or_else(|| maven_path_from_name(&library.name));

            if let Some(p) = path {
                paths.push(p);
            }
        }
    }

    paths
}

/// 从 Maven 坐标推导库文件路径（缺少 downloads 时）
fn maven_path_from_name(name: &str) -> Option<String> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() < 3 {
        return None;
    }

    let group = parts[0];
    let artifact = parts[1];
    let version = parts[2];
    let classifier = parts.get(3).filter(|c| !c.is_empty());

    let file_name = match classifier {
        Some(c) => format!("{}-{}-{}.jar", artifact, version, c),
        None => format!("{}-{}.jar", artifact, version),
    };

    Some(format!(
        "{}/{}/{}/{}/{}",
        group.replace('.', "/"),
        artifact,
        version,
        artifact,
        file_name
    ))
}

/// 展开 arguments 数组（支持带 rules 的对象元素）
fn expand_argument_list(
    args_value: &serde_json::Value,
    templates: &TemplateContext,
) -> Vec<String> {
    let mut result = Vec::new();

    if let Some(args) = args_value.as_array() {
        for arg in args {
            if let Some(text) = arg.as_str() {
                result.push(templates.replace(text));
            } else if let Some(obj) = arg.as_object() {
                let rules_value = obj.get("rules").cloned().unwrap_or(serde_json::Value::Null);
                let rules: Vec<Rule> = match serde_json::from_value(rules_value) {
                    Ok(rules) => rules,
                    Err(_) => Vec::new(),
                };

                if !rules_allow(&rules) {
                    continue;
                }

                match obj.get("value") {
                    Some(serde_json::Value::String(text)) => result.push(templates.replace(text)),
                    Some(serde_json::Value::Array(values)) => {
                        for value in values {
                            if let Some(text) = value.as_str() {
                                result.push(templates.replace(text));
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    result
}

/// 递归合并继承链：子版本字段覆盖父版本，libraries 按名称去重合并
fn merge_version_json(
    version_json: &serde_json::Value,
    game_dir: &PathBuf,
    ctx: &AppContext,
    visited: &mut Vec<String>,
) -> Result<serde_json::Value, String> {
    let version_id = version_json["id"]
        .as_str()
        .ok_or("版本 JSON 缺少 id")?
        .to_string();

    let parent_json = if let Some(parent_id) = version_json["inheritsFrom"].as_str() {
        if visited.contains(&parent_id.to_string()) {
            return Err(format!("版本继承链出现循环: {}", parent_id));
        }
        visited.push(parent_id.to_string());

        let parent_path = ctx.version_json_in_dir(game_dir, &parent_id);

        if !parent_path.exists() {
            return Err(format!(
                "父版本 JSON 不存在: {}（请先部署该版本）",
                parent_path.display()
            ));
        }

        let parent_raw = std::fs::read_to_string(&parent_path)
            .map_err(|e| format!("读取父版本 JSON 失败: {}", e))?;
        let parent: serde_json::Value = serde_json::from_str(&parent_raw)
            .map_err(|e| format!("解析父版本 JSON 失败: {}", e))?;

        merge_version_json(&parent, game_dir, ctx, visited)?
    } else {
        serde_json::Value::Null
    };

    let mut merged = if parent_json.is_null() {
        version_json.clone()
    } else {
        let mut parent = parent_json;

        // 继承 libraries（按 name 去重，子覆盖父）
        if let Some(parent_libs) = parent.get("libraries").and_then(|l| l.as_array()).cloned() {
            if let Some(child_libs) = version_json["libraries"].as_array() {
                let mut child_names = std::collections::HashSet::new();
                for lib in child_libs {
                    if let Some(name) = lib.get("name").and_then(|n| n.as_str()) {
                        child_names.insert(name.to_string());
                    }
                }
                let mut merged_libs: Vec<serde_json::Value> = parent_libs
                    .into_iter()
                    .filter(|lib| {
                        !lib.get("name")
                            .and_then(|n| n.as_str())
                            .map(|n| child_names.contains(n))
                            .unwrap_or(false)
                    })
                    .collect();
                merged_libs.extend(child_libs.iter().cloned());
                parent["libraries"] = serde_json::Value::Array(merged_libs);
            }
        }

        // 覆盖字段（子优先）
        for key in [
            "mainClass",
            "assetIndex",
            "assets",
            "downloads",
            "logging",
            "javaVersion",
        ] {
            if let Some(value) = version_json.get(key) {
                parent[key] = value.clone();
            }
        }

        // 合并 arguments：jvm/game 子覆盖父
        let child_args = version_json.get("arguments");
        let parent_args = parent.get_mut("arguments");
        if let Some(child_args) = child_args {
            match parent_args {
                Some(parent_args_obj) => {
                    if let Some(obj) = parent_args_obj.as_object_mut() {
                        for key in ["jvm", "game"] {
                            if let Some(child_value) = child_args.get(key) {
                                if let Some(parent_value) = obj.get_mut(key) {
                                    let mut merged_args = Vec::new();
                                    if let Some(parent_arr) = parent_value.as_array() {
                                        merged_args.extend(parent_arr.clone());
                                    }
                                    if let Some(child_arr) = child_value.as_array() {
                                        merged_args.extend(child_arr.clone());
                                    }
                                    *parent_value = serde_json::Value::Array(merged_args);
                                } else {
                                    obj.insert(key.to_string(), child_value.clone());
                                }
                            }
                        }
                    }
                }
                None => {
                    parent["arguments"] = child_args.clone();
                }
            }
        }

        // minecraftArguments：子覆盖父
        if let Some(value) = version_json.get("minecraftArguments") {
            parent["minecraftArguments"] = value.clone();
        }

        parent
    };

    log_info!(
        "版本 {} 继承链合并完成 (visited: {:?})",
        version_id,
        visited
    );
    let _ = &mut merged;
    Ok(merged)
}

/// 模板上下文（用于 ${...} 替换）
struct TemplateContext {
    values: HashMap<String, String>,
}

impl TemplateContext {
    /// 执行 ${...} 模板替换
    fn replace(&self, input: &str) -> String {
        let mut result = String::with_capacity(input.len());
        let mut rest = input;

        while let Some(start) = rest.find("${") {
            result.push_str(&rest[..start]);
            let after = &rest[start + 2..];

            if let Some(end) = after.find('}') {
                let key = &after[..end];
                if let Some(value) = self.values.get(key) {
                    result.push_str(value);
                } else {
                    result.push_str("${");
                    result.push_str(key);
                    result.push('}');
                }
                rest = &after[end + 1..];
            } else {
                result.push_str("${");
                rest = after;
            }
        }

        result.push_str(rest);
        result
    }
}

// ======================== 启动参数构建 ========================

/// 读取本地版本 JSON 并组装启动参数
/// access_token 由后端从账户管理器注入（token 绝不经过前端）
pub(super) fn build_launch_args(
    config: &LaunchConfig,
    ctx: &AppContext,
    access_token: Option<String>,
) -> Result<(String, Vec<String>), String> {
    log_info!("构建启动参数, LaunchConfig: {:?}", config);
    let game_dir = PathBuf::from(&config.game_dir);

    let version_json_path = ctx.version_json_in_dir(&game_dir, &config.version);

    if !version_json_path.exists() {
        return Err(format!(
            "版本 JSON 不存在: {}（请先部署该版本）",
            version_json_path.display()
        ));
    }

    let raw = std::fs::read_to_string(&version_json_path)
        .map_err(|e| format!("读取版本 JSON 失败: {}", e))?;
    let version_json: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("解析版本 JSON 失败: {}", e))?;

    let mut visited = vec![config.version.clone()];
    let merged = merge_version_json(&version_json, &game_dir, ctx, &mut visited)?;

    // ---- 目录路径（一律来自 app_context，全局共享目录与下载/校验保持一致） ----
    let libraries_dir = ctx.libraries_dir();
    let assets_dir = ctx.assets_dir();
    let natives_dir = ctx.natives_dir();

    let game_jar = ctx.version_jar_in_dir(&game_dir, &config.version);

    // ---- classpath ----
    let mut classpath = Vec::new();
    for lib_path in collect_library_paths(&merged) {
        classpath.push(libraries_dir.join(lib_path));
    }
    classpath.push(game_jar.clone());

    // classpath 文件必须全部存在，否则 JVM 报错晦涩难懂，这里直接给出明确清单
    let missing: Vec<String> = classpath
        .iter()
        .filter(|p| !p.is_file())
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    if !missing.is_empty() {
        return Err(format!(
            "以下库文件缺失，无法启动（请先在游戏管理中修复完整性）：\n{}",
            missing.join("\n")
        ));
    }

    let classpath_str = if cfg!(target_os = "windows") {
        classpath
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect::<Vec<_>>()
            .join(";")
    } else {
        classpath
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect::<Vec<_>>()
            .join(":")
    };

    // ---- 模板上下文 ----
    let asset_index_id = merged["assetIndex"]["id"]
        .as_str()
        .unwrap_or(&config.version)
        .to_string();
    let version_type = config
        .version_type
        .clone()
        .or_else(|| merged["type"].as_str().map(|t| t.to_string()))
        .unwrap_or_else(|| "release".to_string());

    let user_type = match config.account_type.as_deref() {
        Some("microsoft") => "msa".to_string(),
        Some("offline") => "legacy".to_string(),
        Some("thirdparty") => "mojang".to_string(),
        _ => "mojang".to_string(),
    };

    let access_token = access_token.unwrap_or_else(|| "0".to_string());

    let mut template_values = HashMap::new();
    template_values.insert("auth_player_name".into(), config.username.clone());
    template_values.insert("version_name".into(), config.version.clone());
    template_values.insert(
        "game_directory".into(),
        game_dir.to_string_lossy().to_string(),
    );
    template_values.insert(
        "assets_root".into(),
        assets_dir.to_string_lossy().to_string(),
    );
    template_values.insert("assets_index_name".into(), asset_index_id.clone());
    template_values.insert("auth_uuid".into(), config.uuid.clone());
    template_values.insert("auth_access_token".into(), access_token);
    template_values.insert("user_type".into(), user_type);
    template_values.insert("version_type".into(), version_type);
    template_values.insert(
        "user_properties".into(),
        config
            .user_properties
            .clone()
            .unwrap_or_else(|| "{}".to_string()),
    );
    template_values.insert("classpath".into(), classpath_str.clone());
    template_values.insert(
        "natives_directory".into(),
        natives_dir.to_string_lossy().to_string(),
    );
    template_values.insert("launcher_name".into(), "wecraft".to_string());
    template_values.insert(
        "launcher_version".into(),
        env!("CARGO_PKG_VERSION").to_string(),
    );
    template_values.insert(
        "resolution_width".into(),
        config
            .resolution_width
            .map(|w| w.to_string())
            .unwrap_or_else(|| "854".to_string()),
    );
    template_values.insert(
        "resolution_height".into(),
        config
            .resolution_height
            .map(|h| h.to_string())
            .unwrap_or_else(|| "480".to_string()),
    );

    let templates = TemplateContext {
        values: template_values,
    };

    // ---- JVM 参数 ----
    let mut jvm_args: Vec<String> = Vec::new();

    // 内存参数（PCL 语义：滑块只映射 -Xmx；初始堆 -Xms 不自动生成，
    // 交由 JVM 默认策略，用户可在自定义 JVM 参数中手动指定）
    jvm_args.push(format!("-Xmx{}M", config.memory_mb));

    // log4j 配置
    if let Some(logging_path) = merged["logging"]["client"]["file"]["path"].as_str() {
        let log_config = assets_dir.join(logging_path);
        if log_config.exists() {
            jvm_args.push(format!(
                "-Dlog4j.configurationFile={}",
                log_config.to_string_lossy()
            ));
        }
    }

    // 版本 JSON 中的 JVM 参数（1.13+）
    if let Some(args_value) = merged.get("arguments") {
        if let Some(jvm_value) = args_value.get("jvm") {
            jvm_args.extend(expand_argument_list(jvm_value, &templates));
        }
    }

    // natives 目录（旧版本 JSON 无 arguments 时补充）
    let has_java_library_path = jvm_args
        .iter()
        .any(|a| a.starts_with("-Djava.library.path"));
    if !has_java_library_path {
        jvm_args.push(format!(
            "-Djava.library.path={}",
            natives_dir.to_string_lossy()
        ));
    }

    // classpath
    jvm_args.push("-cp".to_string());
    jvm_args.push(classpath_str);

    // 用户附加 JVM 参数
    jvm_args.extend(config.jvm_args.iter().cloned());

    // ---- 游戏参数 ----
    let mut game_args: Vec<String> = Vec::new();

    if let Some(args_value) = merged.get("arguments") {
        if let Some(game_value) = args_value.get("game") {
            game_args.extend(expand_argument_list(game_value, &templates));
        }
    } else if let Some(minecraft_args) = merged["minecraftArguments"].as_str() {
        game_args.extend(
            minecraft_args
                .split_whitespace()
                .map(|part| templates.replace(part)),
        );
    }

    // 用户附加游戏参数
    game_args.extend(config.game_args.iter().cloned());

    // ---- 主类 ----
    let main_class = config
        .main_class
        .clone()
        .or_else(|| merged["mainClass"].as_str().map(|s| s.to_string()))
        .ok_or("版本 JSON 缺少 mainClass")?;

    log_info!("主类: {}", main_class);
    log_info!("资源索引: {}", asset_index_id);
    log_info!("classpath 条目数: {}", classpath.len());
    log_info!("JVM 参数数: {}", jvm_args.len());
    log_info!("游戏参数数: {}", game_args.len());

    let mut all_args = Vec::with_capacity(jvm_args.len() + game_args.len() + 1);
    all_args.extend(jvm_args);
    all_args.push(main_class.clone());
    all_args.extend(game_args);

    Ok((main_class, all_args))
}

