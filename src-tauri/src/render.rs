//! Minecraft 皮肤渲染库
//!
//! 支持两种渲染模式：
//! - `flat`：平面正面头像（2D）
//! - `isometric`：斜二测 3D 头像（Cabinet Projection）
// TODO: 作为独立crate发布到crates.io

use image::{GenericImageView, Rgba, RgbaImage, imageops, load_from_memory};
use reqwest;
use std::f32::consts::SQRT_2;
use std::io::Cursor;
use tauri::{AppHandle, Manager};

// ── Steve/Alex 模型判定 ──

/// 根据 UUID 判定默认皮肤模型
///
/// 规则：提取 UUID 的二进制形式第 63 位（最低有效位的第 63 位），
/// 简化实现：取 UUID 最后一位 hex → 十进制，奇数 → Alex (slim)，偶数 → Steve (default)
pub fn is_slim_by_uuid(uuid: &str) -> bool {
    let last = uuid
        .chars()
        .filter(|c| *c != '-')
        .last()
        .and_then(|c| u8::from_str_radix(&c.to_string(), 16).ok())
        .unwrap_or(0);
    last % 2 == 1
}

// ── 斜二测投影参数 ──

const DEPTH_SCALE: f32 = 0.5;
const ANGLE_COS: f32 = SQRT_2 / 2.0;
const ANGLE_SIN: f32 = SQRT_2 / 2.0;

const DX: f32 = -DEPTH_SCALE * ANGLE_COS;
const DY: f32 = DEPTH_SCALE * ANGLE_SIN;

// ── UV 坐标常量（64×64 皮肤）──
//
// 命名说明：_RIGHT 表示"视角右侧面"（isometric 投影中观众看到的右侧），
// 对应标准 Minecraft UV 中 Steve 的左侧面 (16,8)-(24,16) / (48,8)-(56,16)

const HEAD_FRONT: (u32, u32, u32, u32) = (8, 8, 16, 16);
const HEAD_TOP: (u32, u32, u32, u32) = (8, 0, 16, 8);
const HEAD_RIGHT: (u32, u32, u32, u32) = (16, 8, 24, 16);

const HAT_FRONT: (u32, u32, u32, u32) = (40, 8, 48, 16);
const HAT_TOP: (u32, u32, u32, u32) = (40, 0, 48, 8);
const HAT_RIGHT: (u32, u32, u32, u32) = (48, 8, 56, 16);

// ── 全身 UV 坐标常量 ──

const BODY_FRONT: (u32, u32, u32, u32) = (20, 20, 28, 32);
const BODY_OUTER_FRONT: (u32, u32, u32, u32) = (20, 36, 28, 48);

const RIGHT_ARM_FRONT: (u32, u32, u32, u32) = (44, 20, 48, 32);
const RIGHT_ARM_OUTER_FRONT: (u32, u32, u32, u32) = (44, 36, 48, 48);

const LEFT_ARM_FRONT: (u32, u32, u32, u32) = (36, 52, 40, 64);
const LEFT_ARM_OUTER_FRONT: (u32, u32, u32, u32) = (52, 52, 56, 64);

const RIGHT_LEG_FRONT: (u32, u32, u32, u32) = (4, 20, 8, 32);
const RIGHT_LEG_OUTER_FRONT: (u32, u32, u32, u32) = (4, 36, 8, 48);

const LEFT_LEG_FRONT: (u32, u32, u32, u32) = (20, 52, 24, 64);
const LEFT_LEG_OUTER_FRONT: (u32, u32, u32, u32) = (4, 52, 8, 64);

const RIGHT_ARM_FRONT_SLIM: (u32, u32, u32, u32) = (44, 20, 47, 32);
const RIGHT_ARM_OUTER_FRONT_SLIM: (u32, u32, u32, u32) = (44, 36, 47, 48);
const LEFT_ARM_FRONT_SLIM: (u32, u32, u32, u32) = (37, 52, 40, 64);
const LEFT_ARM_OUTER_FRONT_SLIM: (u32, u32, u32, u32) = (53, 52, 56, 64);

// ── Mojang Session API 结构体 ──

/// Minecraft 玩家资料（从 Mojang API 获取）
#[derive(serde::Deserialize, Debug)]
pub struct MinecraftProfile {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub legacy: Option<bool>,
    pub properties: Vec<ProfileProperty>,
}

/// 玩家资料属性
#[derive(serde::Deserialize, Debug)]
pub struct ProfileProperty {
    pub name: String,
    #[serde(default)]
    pub signature: Option<String>,
    pub value: String,
}

/// 皮肤纹理数据（从 Base64 解码得到）
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TextureData {
    pub timestamp: u64,
    pub profile_id: String,
    pub profile_name: String,
    #[serde(default)]
    pub signature_required: Option<bool>,
    pub textures: Textures,
}

/// 纹理映射容器
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub struct Textures {
    #[serde(default)]
    pub skin: Option<SkinTexture>,
    #[serde(default)]
    pub cape: Option<CapeTexture>,
}

/// 皮肤纹理信息
#[derive(serde::Deserialize, Debug)]
pub struct SkinTexture {
    pub url: String,
    #[serde(default)]
    pub metadata: Option<SkinMetadata>,
}

/// 皮肤元数据
#[derive(serde::Deserialize, Debug)]
pub struct SkinMetadata {
    #[serde(default)]
    pub model: Option<String>,
}

/// 披风纹理信息
#[derive(serde::Deserialize, Debug)]
pub struct CapeTexture {
    pub url: String,
}

// ── Username → UUID API 结构体 ──

/// Minecraft 玩家档案（用户名→UUID 查询结果）
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct MinecraftUserProfile {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub legacy: Option<bool>,
    #[serde(default)]
    pub demo: Option<bool>,
}

// ── Username → UUID API 函数 ──

/// 通过玩家名称获取 UUID（单次查询）
pub async fn fetch_uuid_by_username(username: &str) -> Result<MinecraftUserProfile, String> {
    let url = format!(
        "https://api.mojang.com/users/profiles/minecraft/{}",
        username
    );
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| format!("UUID 请求失败: {}", e))?;

    let status = resp.status();
    if status == 404 {
        return Err(format!("玩家不存在: {}", username));
    }
    if status.is_client_error() || status.is_server_error() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Mojang API 返回错误 {}: {}", status.as_u16(), body));
    }

    let profile = resp
        .json::<MinecraftUserProfile>()
        .await
        .map_err(|e| format!("转换为Json失败: {}", e))?;

    Ok(profile)
}

/// 批量通过玩家名称获取 UUID（最多 10 个）
pub async fn fetch_uuids_by_usernames(usernames: Vec<String>) -> Result<Vec<MinecraftUserProfile>, String> {
    if usernames.is_empty() || usernames.len() > 10 {
        return Err("请求数量必须在 1 到 10 之间".to_string());
    }

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.mojang.com/profiles/minecraft")
        .json(&usernames)
        .send()
        .await
        .map_err(|e| format!("批量 UUID 请求失败: {}", e))?;

    let status = resp.status();
    if status == 400 {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("请求参数错误: {}", body));
    }
    if status.is_client_error() || status.is_server_error() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Mojang API 返回错误 {}: {}", status.as_u16(), body));
    }

    let profiles = resp
        .json::<Vec<MinecraftUserProfile>>()
        .await
        .map_err(|e| format!("转换为Json失败: {}", e))?;

    Ok(profiles)
}

/// 通过用户名获取 UUID（Tauri 命令）
#[tauri::command]
pub async fn get_uuid_by_username(username: String) -> Result<MinecraftUserProfile, String> {
    fetch_uuid_by_username(&username).await
}

/// 批量通过用户名获取 UUID（Tauri 命令）
#[tauri::command]
pub async fn get_uuids_by_usernames(usernames: Vec<String>) -> Result<Vec<MinecraftUserProfile>, String> {
    fetch_uuids_by_usernames(usernames).await
}

// ── Mojang API 函数 ──

/// 解码 Base64 编码的纹理数据
fn decode_texture_value(value: &str) -> Result<TextureData, String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(value)
        .map_err(|e| format!("Base64 解码失败: {}", e))?;
    let data = serde_json::from_slice::<TextureData>(&bytes)
        .map_err(|e| format!("纹理JSON解析失败: {}", e))?;
    Ok(data)
}

/// 通过 UUID 从 Mojang API 获取皮肤数据
async fn fetch_skin_by_uuid(uuid: &str) -> Result<MinecraftProfile, String> {
    let profile_url = format!(
        "https://sessionserver.mojang.com/session/minecraft/profile/{}",
        uuid
    );

    let resp = reqwest::get(&profile_url)
        .await
        .map_err(|e| format!("Profile 请求失败: {}", e))?;

    let status = resp.status();
    if status.is_client_error() || status.is_server_error() {
        let body = resp.text().await.unwrap_or_default();
        return Err(match status.as_u16() {
            404 => format!("玩家不存在 (UUID: {})", uuid),
            429 => "Mojang API 限流，请稍后再试".to_string(),
            _ => format!("Mojang API 返回错误 {}: {}", status.as_u16(), body),
        });
    }

    let profile = resp
        .json::<MinecraftProfile>()
        .await
        .map_err(|e| format!("转换为Json失败: {}", e))?;

    Ok(profile)
}

// ── 缓存工具 ──

/// 获取皮肤缓存目录
fn get_skin_cache_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取数据目录失败: {}", e))?
        .join("skins");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建缓存目录失败: {}", e))?;
    Ok(dir)
}

/// 获取头像缓存目录
fn get_avatar_cache_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取数据目录失败: {}", e))?
        .join("avatars");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建缓存目录失败: {}", e))?;
    Ok(dir)
}

/// 从玩家资料中提取皮肤纹理 URL 和模型类型
fn get_texture_url(profile: &MinecraftProfile) -> Result<(String, Option<String>), String> {
    let prop = profile
        .properties
        .iter()
        .find(|p| p.name == "textures")
        .ok_or("缺少 textures 属性")?;
    let texture = decode_texture_value(&prop.value)?;
    let model = texture
        .textures
        .skin
        .as_ref()
        .and_then(|s| s.metadata.as_ref())
        .and_then(|m| m.model.clone());
    let skin_url = texture
        .textures
        .skin
        .as_ref()
        .map(|s| s.url.clone())
        .ok_or("缺少皮肤 URL")?;
    Ok((skin_url, model))
}

/// 皮肤模型响应（用于前端判断 slim/default）
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SkinModelResponse {
    /// 模型类型 ("default" 或 "slim")
    pub model: String,
    /// 是否来自 API（false 表示通过 UUID 推断）
    pub from_api: bool,
}

/// 从缓存读取皮肤模型信息
fn read_cached_model(cache_dir: &std::path::Path, uuid: &str) -> Option<(String, bool)> {
    let meta_path = cache_dir.join(format!("{}.json", uuid));
    let bytes = std::fs::read(meta_path).ok()?;
    let meta: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    let model = meta["model"].as_str().and_then(|s| {
        if s.is_empty() { None } else { Some(s.to_string()) }
    })?;
    // 旧缓存无 from_api 字段 → 需要重新向 API 查询
    let from_api = match meta.get("from_api") {
        Some(v) => v.as_bool().unwrap_or(false),
        None => return None, // 旧缓存，重新查询
    };
    Some((model, from_api))
}

/// 写入皮肤模型信息到缓存
fn write_cached_model(cache_dir: &std::path::Path, uuid: &str, model: Option<&str>, from_api: bool) {
    let meta_path = cache_dir.join(format!("{}.json", uuid));
    let value = serde_json::json!({ "model": model.unwrap_or(""), "from_api": from_api });
    let _ = std::fs::write(&meta_path, serde_json::to_string(&value).unwrap());
}

/// 下载并缓存皮肤图片，返回缓存路径和模型类型
async fn download_and_cache_skin(
    app: &AppHandle,
    uuid: &str,
) -> Result<(std::path::PathBuf, Option<String>), String> {
    let cache_dir = get_skin_cache_dir(app)?;
    let cached_path = cache_dir.join(format!("{}.png", uuid));

    if cached_path.exists() {
        let model = read_cached_model(&cache_dir, uuid).map(|(m, _)| m);
        return Ok((cached_path, model));
    }

    let (skin_bytes, model, from_api): (Vec<u8>, Option<String>, bool) =
        match fetch_skin_by_uuid(uuid).await {
            Ok(profile) => {
                match get_texture_url(&profile) {
                    Ok((skin_url, model)) => {
                        match reqwest::get(&skin_url).await {
                            Ok(resp) => {
                                match resp.bytes().await {
                                    Ok(bytes) => (bytes.to_vec(), model, true),
                                    Err(_) => {
                                        let is_slim = is_slim_by_uuid(uuid);
                                        let fallback = generate_default_skin(is_slim);
                                        (encode_png(&fallback).unwrap_or_default(), Some(if is_slim { "slim".to_string() } else { "default".to_string() }), false)
                                    }
                                }
                            }
                            Err(_) => {
                                let is_slim = is_slim_by_uuid(uuid);
                                let fallback = generate_default_skin(is_slim);
                                (encode_png(&fallback).unwrap_or_default(), Some(if is_slim { "slim".to_string() } else { "default".to_string() }), false)
                            }
                        }
                    }
                    Err(_) => {
                        let is_slim = is_slim_by_uuid(uuid);
                        let fallback = generate_default_skin(is_slim);
                        (encode_png(&fallback).unwrap_or_default(), Some(if is_slim { "slim".to_string() } else { "default".to_string() }), false)
                    }
                }
            }
            Err(_) => {
                let is_slim = is_slim_by_uuid(uuid);
                let fallback = generate_default_skin(is_slim);
                (encode_png(&fallback).unwrap_or_default(), Some(if is_slim { "slim".to_string() } else { "default".to_string() }), false)
            }
        };

    let model_str = model.as_deref().unwrap_or("default");
    std::fs::write(&cached_path, &skin_bytes).map_err(|e| format!("写入缓存失败: {}", e))?;
    write_cached_model(&cache_dir, uuid, Some(model_str), from_api);

    Ok((cached_path, model))
}

/// 将 RGBA 图像编码为 PNG 字节
fn encode_png(img: &RgbaImage) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    image::DynamicImage::ImageRgba8(img.clone())
        .write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
        .map_err(|e| format!("PNG 编码失败: {}", e))?;
    Ok(bytes)
}

// ── 工具函数 ──

/// 加载皮肤图片，自动处理 64×32 旧格式并扩展到 64×64
pub fn load_skin_from_bytes(bytes: &[u8]) -> Result<RgbaImage, String> {
    let img = load_from_memory(bytes)
        .map_err(|e| format!("图片加载失败: {}", e))?
        .into_rgba8();

    let (w, h) = (img.width(), img.height());

    if w == 64 && h == 64 {
        return Ok(img);
    }

    if w == 64 && h == 32 {
        let mut expanded = RgbaImage::new(64, 64);
        imageops::overlay(&mut expanded, &img, 0, 0);
        return Ok(expanded);
    }

    Err(format!("皮肤尺寸必须为 64×64 或 64×32，实际为 {}×{}", w, h))
}

/// 从文件路径加载皮肤图片
fn load_skin(path: &std::path::Path) -> Result<RgbaImage, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("读取文件失败: {}", e))?;
    load_skin_from_bytes(&bytes)
}

/// 生成默认皮肤（离线账号降级用）
fn generate_default_skin(is_slim: bool) -> RgbaImage {
    fn rect(img: &mut RgbaImage, x1: u32, y1: u32, x2: u32, y2: u32, color: Rgba<u8>) {
        for y in y1..y2 {
            for x in x1..x2 {
                img.put_pixel(x, y, color);
            }
        }
    }

    let mut img = RgbaImage::new(64, 64);
    let skin_color = Rgba([200, 168, 120, 255]);
    let eye_color = Rgba([50, 50, 50, 255]);
    let mouth_color = Rgba([140, 80, 50, 255]);
    let shirt_color = Rgba([80, 140, 200, 255]);
    let pants_color = Rgba([70, 50, 40, 255]);

    // 头部正面 (8,8)-(16,16)
    rect(&mut img, 8, 8, 16, 16, skin_color);
    // 左眼 (9,10)-(11,11)
    rect(&mut img, 9, 10, 11, 11, eye_color);
    // 右眼 (13,10)-(15,11)
    rect(&mut img, 13, 10, 15, 11, eye_color);
    // 嘴巴 (11,13)-(13,14)
    rect(&mut img, 11, 13, 13, 14, mouth_color);
    // 头顶 (8,0)-(16,8)
    rect(&mut img, 8, 0, 16, 8, Rgba([180, 148, 100, 255]));
    // 头部右侧 (16,8)-(24,16)
    rect(&mut img, 16, 8, 24, 16, Rgba([170, 140, 95, 255]));

    // 身体 (20,20)-(28,32)
    rect(&mut img, 20, 20, 28, 32, shirt_color);
    // 身体外层 (20,36)-(28,48)
    rect(&mut img, 20, 36, 28, 48, Rgba([60, 110, 170, 150]));

    // 右臂
    let (rax1, rax2, lax1, lax2) = if is_slim {
        (44u32, 47u32, 37u32, 40u32)
    } else {
        (44, 48, 36, 40)
    };
    rect(&mut img, rax1, 20, rax2, 32, shirt_color);
    rect(&mut img, rax1, 36, rax2, 48, Rgba([60, 110, 170, 150]));
    // 左臂（镜像纹理）
    rect(&mut img, lax1, 52, lax2, 64, shirt_color);
    rect(&mut img, 53, 52, 56, 64, Rgba([60, 110, 170, 150]));

    // 右腿 (4,20)-(8,32)
    rect(&mut img, 4, 20, 8, 32, pants_color);
    rect(&mut img, 4, 36, 8, 48, Rgba([50, 35, 25, 150]));
    // 左腿（镜像纹理）
    rect(&mut img, 20, 52, 24, 64, pants_color);
    rect(&mut img, 4, 52, 8, 64, Rgba([50, 35, 25, 150]));

    img
}

/// Alpha 混合（源 over 目标）
fn alpha_blend(dst: Rgba<u8>, src: Rgba<u8>) -> Rgba<u8> {
    let src_a = src[3] as f32 / 255.0;
    let dst_a = dst[3] as f32 / 255.0;

    let out_a = src_a + dst_a * (1.0 - src_a);
    if out_a == 0.0 {
        return Rgba([0, 0, 0, 0]);
    }

    let blend = |s: u8, d: u8| -> u8 {
        let s = s as f32 / 255.0;
        let d = d as f32 / 255.0;
        let out = (s * src_a + d * dst_a * (1.0 - src_a)) / out_a;
        (out * 255.0).round() as u8
    };

    Rgba([
        blend(src[0], dst[0]),
        blend(src[1], dst[1]),
        blend(src[2], dst[2]),
        (out_a * 255.0).round() as u8,
    ])
}

// ── Flat 模式：平面正面头像 ──

/// 渲染平面正面头像，支持带帽子和不带帽子两种模式
pub fn render_flat_avatar(skin: &RgbaImage, size: u32, show_hat: bool) -> RgbaImage {
    let (x1, y1, x2, y2) = HEAD_FRONT;
    let mut head = skin.view(x1, y1, x2 - x1, y2 - y1).to_image();

    if show_hat {
        let (hx1, hy1, hx2, hy2) = HAT_FRONT;
        let hat = skin.view(hx1, hy1, hx2 - hx1, hy2 - hy1).to_image();

        for y in 0..hat.height() {
            for x in 0..hat.width() {
                let hat_px = hat.get_pixel(x, y);
                if hat_px[3] == 0 {
                    continue;
                }
                let head_px = head.get_pixel(x, y);
                let blended = alpha_blend(*head_px, *hat_px);
                head.put_pixel(x, y, blended);
            }
        }
    }

    imageops::resize(&head, size, size, imageops::FilterType::Nearest)
}

// ── 全身正面渲染 ──

/// 渲染全身正面视图
///
/// `is_slim`: true = Alex 模型（3px 手臂），false = Steve 模型（4px 手臂）
/// `scale`: 像素缩放倍数（1 = 1:1 原始像素）
pub fn render_full_body(skin: &RgbaImage, is_slim: bool, scale: u32) -> RgbaImage {
    let arm_uv = if is_slim {
        (RIGHT_ARM_FRONT_SLIM, RIGHT_ARM_OUTER_FRONT_SLIM, LEFT_ARM_FRONT_SLIM, LEFT_ARM_OUTER_FRONT_SLIM)
    } else {
        (RIGHT_ARM_FRONT, RIGHT_ARM_OUTER_FRONT, LEFT_ARM_FRONT, LEFT_ARM_OUTER_FRONT)
    };

    let arm_w = if is_slim { 3u32 } else { 4u32 };
    let canvas_w = (arm_w + 8 + arm_w) * scale;
    let canvas_h = (8 + 12 + 12) * scale;
    let mut output = RgbaImage::new(canvas_w, canvas_h);

    // 左肢在 MC 贴图中是右肢的水平镜像，渲染前需翻转
    let flip_h = |uv: (u32, u32, u32, u32)| -> RgbaImage {
        let mut img = skin.view(uv.0, uv.1, uv.2 - uv.0, uv.3 - uv.1).to_image();
        imageops::flip_horizontal_in_place(&mut img);
        img
    };

    // 内层 + 外层顺序组合
    let layers: &[(RgbaImage, u32, u32)] = &[
        // 头部
        (skin.view(HEAD_FRONT.0, HEAD_FRONT.1, 8, 8).to_image(), arm_w * scale, 0),
        // 身体
        (skin.view(BODY_FRONT.0, BODY_FRONT.1, 8, 12).to_image(), arm_w * scale, 8 * scale),
        // 右臂
        (skin.view(arm_uv.0 .0, arm_uv.0 .1, arm_w, 12).to_image(), 0, 8 * scale),
        // 左臂（水平翻转）
        (flip_h(arm_uv.2), (arm_w + 8) * scale, 8 * scale),
        // 右腿
        (skin.view(RIGHT_LEG_FRONT.0, RIGHT_LEG_FRONT.1, 4, 12).to_image(), arm_w * scale, (8 + 12) * scale),
        // 左腿（水平翻转）
        (flip_h(LEFT_LEG_FRONT), (arm_w + 4) * scale, (8 + 12) * scale),
        // 外层：夹克
        (skin.view(BODY_OUTER_FRONT.0, BODY_OUTER_FRONT.1, 8, 12).to_image(), arm_w * scale, 8 * scale),
        // 外层：右袖
        (skin.view(arm_uv.1 .0, arm_uv.1 .1, arm_w, 12).to_image(), 0, 8 * scale),
        // 外层：左袖（水平翻转）
        (flip_h(arm_uv.3), (arm_w + 8) * scale, 8 * scale),
        // 外层：右裤腿
        (skin.view(RIGHT_LEG_OUTER_FRONT.0, RIGHT_LEG_OUTER_FRONT.1, 4, 12).to_image(), arm_w * scale, (8 + 12) * scale),
        // 外层：左裤腿（水平翻转）
        (flip_h(LEFT_LEG_OUTER_FRONT), (arm_w + 4) * scale, (8 + 12) * scale),
    ];

    for (part, dx, dy) in layers {
        let scaled = imageops::resize(part, part.width() * scale, part.height() * scale, imageops::FilterType::Nearest);
        for y in 0..scaled.height() {
            for x in 0..scaled.width() {
                let px = scaled.get_pixel(x, y);
                if px[3] == 0 {
                    continue;
                }
                let dst = output.get_pixel(x + dx, y + dy);
                output.put_pixel(x + dx, y + dy, alpha_blend(*dst, *px));
            }
        }
    }

    output
}

// ── 斜二测 3D 头像渲染 ──

/// 3D 立方体面渲染描述
struct Face {
    indices: [usize; 4],
    uv: (u32, u32, u32, u32),
    flip_u: bool,
    flip_v: bool,
}

/// 渲染斜二测 3D 头像（Cabinet Projection）
pub fn render_isometric_avatar(skin: &RgbaImage, size: u32, show_hat: bool) -> RgbaImage {
    let mut output = RgbaImage::new(size, size);
    let half: f32 = 4.0;
    let hat_offset: f32 = 0.5;

    let make_vertices = |h: f32| -> [(f32, f32, f32); 8] {
        [
            (-h, -h, h),
            (h, -h, h),
            (h, h, h),
            (-h, h, h),
            (-h, -h, -h),
            (h, -h, -h),
            (h, h, -h),
            (-h, h, -h),
        ]
    };

    let base_vertices = make_vertices(half);

    let project = |x: f32, y: f32, z: f32| -> (f32, f32) { (x + DX * z, y + DY * z) };

    let projected_base: [(f32, f32); 8] = std::array::from_fn(|i| {
        project(base_vertices[i].0, base_vertices[i].1, base_vertices[i].2)
    });

    let all_points = if show_hat {
        let hat_vertices = make_vertices(half + hat_offset);
        let mut points = projected_base.to_vec();
        for v in &hat_vertices {
            points.push(project(v.0, v.1, v.2));
        }
        points
    } else {
        projected_base.to_vec()
    };

    let min_x = all_points.iter().map(|p| p.0).fold(f32::MAX, f32::min);
    let max_x = all_points.iter().map(|p| p.0).fold(f32::MIN, f32::max);
    let min_y = all_points.iter().map(|p| p.1).fold(f32::MAX, f32::min);
    let max_y = all_points.iter().map(|p| p.1).fold(f32::MIN, f32::max);

    let width = max_x - min_x;
    let height = max_y - min_y;
    let scale = size as f32 / f32::max(width, height) * 0.9;

    let offset_x = size as f32 / 2.0 - (min_x + max_x) / 2.0 * scale;
    let offset_y = size as f32 / 2.0 - (min_y + max_y) / 2.0 * scale;

    let faces = [
        Face {
            indices: [1, 5, 6, 2],
            uv: HEAD_RIGHT,
            flip_u: false,
            flip_v: false,
        },
        Face {
            indices: [0, 1, 5, 4],
            uv: HEAD_TOP,
            flip_u: false,
            flip_v: false,
        },
        Face {
            indices: [0, 1, 2, 3],
            uv: HEAD_FRONT,
            flip_u: false,
            flip_v: false,
        },
    ];

    for face in &faces {
        render_face(
            &mut output,
            skin,
            &projected_base,
            face,
            scale,
            offset_x,
            offset_y,
        );
    }

    if show_hat {
        let hat_vertices = make_vertices(half + hat_offset);
        let projected_hat: [(f32, f32); 8] = std::array::from_fn(|i| {
            project(hat_vertices[i].0, hat_vertices[i].1, hat_vertices[i].2)
        });

        let hat_faces = [
            Face {
                indices: [1, 5, 6, 2],
                uv: HAT_RIGHT,
                flip_u: false,
                flip_v: false,
            },
            Face {
                indices: [0, 1, 5, 4],
                uv: HAT_TOP,
                flip_u: false,
                flip_v: false,
            },
            Face {
                indices: [0, 1, 2, 3],
                uv: HAT_FRONT,
                flip_u: false,
                flip_v: false,
            },
        ];

        for face in &hat_faces {
            render_face(
                &mut output,
                skin,
                &projected_hat,
                face,
                scale,
                offset_x,
                offset_y,
            );
        }
    }

    output
}

/// 渲染单个 3D 面片到输出图像
fn render_face(
    output: &mut RgbaImage,
    skin: &RgbaImage,
    projected: &[(f32, f32); 8],
    face: &Face,
    scale: f32,
    offset_x: f32,
    offset_y: f32,
) {
    let (uv_x1, uv_y1, uv_x2, uv_y2) = face.uv;
    let uv_w = (uv_x2 - uv_x1) as f32;
    let uv_h = (uv_y2 - uv_y1) as f32;

    let pts: [(f32, f32); 4] = [
        (
            projected[face.indices[0]].0 * scale + offset_x,
            projected[face.indices[0]].1 * scale + offset_y,
        ),
        (
            projected[face.indices[1]].0 * scale + offset_x,
            projected[face.indices[1]].1 * scale + offset_y,
        ),
        (
            projected[face.indices[2]].0 * scale + offset_x,
            projected[face.indices[2]].1 * scale + offset_y,
        ),
        (
            projected[face.indices[3]].0 * scale + offset_x,
            projected[face.indices[3]].1 * scale + offset_y,
        ),
    ];

    let min_x = pts.iter().map(|p| p.0).fold(f32::MAX, f32::min).floor() as i32;
    let max_x = pts.iter().map(|p| p.0).fold(f32::MIN, f32::max).ceil() as i32;
    let min_y = pts.iter().map(|p| p.1).fold(f32::MAX, f32::min).floor() as i32;
    let max_y = pts.iter().map(|p| p.1).fold(f32::MIN, f32::max).ceil() as i32;

    let out_w = output.width() as i32;
    let out_h = output.height() as i32;

    for sy in min_y..max_y {
        for sx in min_x..max_x {
            if sx < 0 || sy < 0 || sx >= out_w || sy >= out_h {
                continue;
            }

            if let Some((u, v)) = point_in_quad(&pts, sx as f32, sy as f32) {
                let mut u = u;
                let mut v = v;

                if face.flip_u {
                    u = 1.0 - u;
                }
                if face.flip_v {
                    v = 1.0 - v;
                }

                let tx = (uv_x1 as f32 + u * uv_w).round() as u32;
                let ty = (uv_y1 as f32 + v * uv_h).round() as u32;

                let tx = tx.clamp(uv_x1, uv_x2.saturating_sub(1));
                let ty = ty.clamp(uv_y1, uv_y2.saturating_sub(1));

                let pixel = skin.get_pixel(tx, ty);

                if pixel[3] == 0 {
                    continue;
                }

                let dst = output.get_pixel(sx as u32, sy as u32);
                let blended = alpha_blend(*dst, *pixel);
                output.put_pixel(sx as u32, sy as u32, blended);
            }
        }
    }
}

/// 判断点是否在四边形内并返回 UV 坐标
fn point_in_quad(pts: &[(f32, f32); 4], px: f32, py: f32) -> Option<(f32, f32)> {
    if let Some(bary) = point_in_triangle(pts[0], pts[1], pts[2], px, py) {
        let (u, v, w) = bary;
        let uv_u = 1.0 * u + 1.0 * v + 0.0 * w;
        let uv_v = 1.0 * u + 0.0 * v + 0.0 * w;
        return Some((uv_u.clamp(0.0, 1.0), uv_v.clamp(0.0, 1.0)));
    }

    if let Some(bary) = point_in_triangle(pts[0], pts[2], pts[3], px, py) {
        let (u, v, w) = bary;
        let uv_u = 0.0 * u + 1.0 * v + 0.0 * w;
        let uv_v = 1.0 * u + 1.0 * v + 0.0 * w;
        return Some((uv_u.clamp(0.0, 1.0), uv_v.clamp(0.0, 1.0)));
    }

    None
}

/// 使用重心坐标判断点是否在三角形内
fn point_in_triangle(
    a: (f32, f32),
    b: (f32, f32),
    c: (f32, f32),
    px: f32,
    py: f32,
) -> Option<(f32, f32, f32)> {
    let v0x = c.0 - a.0;
    let v0y = c.1 - a.1;
    let v1x = b.0 - a.0;
    let v1y = b.1 - a.1;
    let v2x = px - a.0;
    let v2y = py - a.1;

    let dot00 = v0x * v0x + v0y * v0y;
    let dot01 = v0x * v1x + v0y * v1y;
    let dot02 = v0x * v2x + v0y * v2y;
    let dot11 = v1x * v1x + v1y * v1y;
    let dot12 = v1x * v2x + v1y * v2y;

    let denom = dot00 * dot11 - dot01 * dot01;
    if denom.abs() < 1e-10 {
        return None;
    }

    let inv_denom = 1.0 / denom;
    let u = (dot11 * dot02 - dot01 * dot12) * inv_denom;
    let v = (dot00 * dot12 - dot01 * dot02) * inv_denom;

    if u >= -0.001 && v >= -0.001 && u + v <= 1.001 {
        let u = u.clamp(0.0, 1.0);
        let v = v.clamp(0.0, 1.0);
        let w = (1.0 - u - v).clamp(0.0, 1.0);
        Some((u, v, w))
    } else {
        None
    }
}

// ── Tauri 命令 ──

/// 渲染玩家平面头像（带缓存），返回 PNG 字节
#[tauri::command]
pub async fn render_avatar(
    app: AppHandle,
    uuid: String,
    size: Option<u32>,
    show_hat: Option<bool>,
) -> Result<Vec<u8>, String> {
    let output_size = match size.unwrap_or(128) {
        s if s <= 32 => 32,
        s if s <= 64 => 64,
        s if s <= 128 => 128,
        _ => 256,
    };
    let show_hat = show_hat.unwrap_or(true);

    let avatar_cache_dir = get_avatar_cache_dir(&app)?;
    let cache_path = avatar_cache_dir.join(format!("{}_{}.png", uuid, output_size));
    if cache_path.exists() {
        return std::fs::read(&cache_path).map_err(|e| format!("读取缓存失败: {}", e));
    }

    let (skin_path, _) = download_and_cache_skin(&app, &uuid).await?;
    let skin = load_skin(&skin_path)?;
    let avatar = render_flat_avatar(&skin, output_size, show_hat);
    let png_bytes = encode_png(&avatar)?;

    let _ = std::fs::write(&cache_path, &png_bytes);

    Ok(png_bytes)
}

/// 获取玩家皮肤头部渲染（无缓存），返回 PNG 字节
#[tauri::command]
pub async fn get_skin_head(
    app: AppHandle,
    uuid: String,
    size: Option<u32>,
    show_hat: Option<bool>,
) -> Result<Vec<u8>, String> {
    let output_size = size.unwrap_or(64).max(8);
    let show_hat = show_hat.unwrap_or(true);

    let (skin_path, _) = download_and_cache_skin(&app, &uuid).await?;
    let skin = load_skin(&skin_path)?;

    encode_png(&render_flat_avatar(&skin, output_size, show_hat))
}

/// 获取玩家披风纹理，返回 PNG 字节（支持缓存和无披风标记）
#[tauri::command]
pub async fn get_skin_cape(app: AppHandle, uuid: String) -> Result<Option<Vec<u8>>, String> {
    let cache_dir = get_skin_cache_dir(&app)?;
    let cape_cache = cache_dir.join(format!("cape_{}.png", uuid));
    let absent_cache = cache_dir.join(format!("cape_{}.absent", uuid));

    if absent_cache.exists() {
        return Ok(None);
    }

    if cape_cache.exists() {
        return Ok(Some(
            std::fs::read(&cape_cache).map_err(|e| format!("读取披风缓存失败: {}", e))?,
        ));
    }

    let profile = fetch_skin_by_uuid(&uuid).await?;
    let prop = profile
        .properties
        .iter()
        .find(|p| p.name == "textures")
        .ok_or("缺少 textures 属性")?;
    let texture = decode_texture_value(&prop.value)?;

    let cape_url = match texture.textures.cape {
        Some(c) => c.url,
        None => {
            let _ = std::fs::write(&absent_cache, b"");
            return Ok(None);
        }
    };

    let cape_bytes = reqwest::get(&cape_url)
        .await
        .map_err(|e| format!("披风下载失败: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("读取披风数据失败: {}", e))?
        .to_vec();

    let _ = std::fs::write(&cape_cache, &cape_bytes);

    Ok(Some(cape_bytes))
}

/// 渲染玩家斜二测 3D 头像，返回 PNG 字节
#[tauri::command]
pub async fn render_isometric_avatar_cmd(
    app: AppHandle,
    uuid: String,
    size: Option<u32>,
    show_hat: Option<bool>,
) -> Result<Vec<u8>, String> {
    let output_size = size.unwrap_or(256).max(64);
    let show_hat = show_hat.unwrap_or(true);

    let (skin_path, _) = download_and_cache_skin(&app, &uuid).await?;
    let skin = load_skin(&skin_path)?;

    let avatar = render_isometric_avatar(&skin, output_size, show_hat);
    encode_png(&avatar)
}

/// 获取玩家皮肤模型类型（"default" 或 "slim"），优先从 API 获取，失败时根据 UUID 推断
#[tauri::command]
pub async fn get_skin_model(app: AppHandle, uuid: String) -> Result<SkinModelResponse, String> {
    let cache_dir = get_skin_cache_dir(&app)?;

    if let Some((model, from_api)) = read_cached_model(&cache_dir, &uuid) {
        return Ok(SkinModelResponse { model, from_api });
    }

    match fetch_skin_by_uuid(&uuid).await {
        Ok(profile) => {
            if let Ok((_, model)) = get_texture_url(&profile) {
                let m = model.unwrap_or_else(|| "default".to_string());
                write_cached_model(&cache_dir, &uuid, Some(&m), true);
                return Ok(SkinModelResponse { model: m, from_api: true });
            }
        }
        Err(_) => {}
    }

    let is_slim = is_slim_by_uuid(&uuid);
    let model = if is_slim { "slim".to_string() } else { "default".to_string() };
    write_cached_model(&cache_dir, &uuid, Some(&model), false);
    Ok(SkinModelResponse { model, from_api: false })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flat_render_size() {
        let skin = RgbaImage::from_pixel(64, 64, Rgba([255, 0, 0, 255]));
        let avatar = render_flat_avatar(&skin, 128, true);
        assert_eq!(avatar.width(), 128);
        assert_eq!(avatar.height(), 128);
    }

    #[test]
    fn test_isometric_render_size() {
        let skin = RgbaImage::from_pixel(64, 64, Rgba([0, 255, 0, 255]));
        let avatar = render_isometric_avatar(&skin, 256, true);
        assert_eq!(avatar.width(), 256);
        assert_eq!(avatar.height(), 256);
    }

    fn make_test_skin() -> RgbaImage {
        let mut img = RgbaImage::new(64, 64);

        // 基础皮肤底色
        for y in 0..64 {
            for x in 0..64 {
                img.put_pixel(x, y, Rgba([0, 0, 0, 0]));
            }
        }

        // 头部正面 (8,8)-(16,16) —— 肤色
        for y in 8..16 {
            for x in 8..16 {
                img.put_pixel(x, y, Rgba([210, 180, 140, 255]));
            }
        }

        // 左眼 (9,10)-(11,11)
        for y in 10..12 {
            for x in 9..11 {
                img.put_pixel(x, y, Rgba([50, 50, 50, 255]));
            }
        }

        // 右眼 (13,10)-(15,11)
        for y in 10..12 {
            for x in 13..15 {
                img.put_pixel(x, y, Rgba([50, 50, 50, 255]));
            }
        }

        // 嘴巴 (11,13)-(13,14)
        for y in 13..15 {
            for x in 11..13 {
                img.put_pixel(x, y, Rgba([150, 80, 50, 255]));
            }
        }

        // 帽子正面 (40,8)-(48,16) —— 红色帽子，中间有缝隙（露出眼睛）
        for y in 10..16 {
            for x in 40..48 {
                // 在眼睛位置留空
                let eye_x = x - 40 + 8;
                if (9..11).contains(&eye_x) || (13..15).contains(&eye_x) {
                    continue;
                }
                img.put_pixel(x, y, Rgba([200, 50, 50, 200]));
            }
        }
        // 帽子顶部 (40,0)-(48,8)
        for y in 0..8 {
            for x in 40..48 {
                img.put_pixel(x, y, Rgba([180, 30, 30, 255]));
            }
        }
        // 帽子右侧（视角右 = Steve 左侧）(48,8)-(56,16)
        for y in 8..16 {
            for x in 48..56 {
                img.put_pixel(x, y, Rgba([140, 20, 20, 255]));
            }
        }

        // 头部右侧面（视角右 = Steve 左侧）(16,8)-(24,16)
        for y in 8..16 {
            for x in 16..24 {
                img.put_pixel(x, y, Rgba([180, 150, 110, 255]));
            }
        }

        // 头顶 (8,0)-(16,8)
        for y in 0..8 {
            for x in 8..16 {
                img.put_pixel(x, y, Rgba([200, 170, 130, 255]));
            }
        }

        // 身体正面 (20,20)-(28,32) —— 蓝色衬衫
        for y in 20..32 {
            for x in 20..28 {
                img.put_pixel(x, y, Rgba([60, 120, 200, 255]));
            }
        }
        // 身体外层 (20,36)-(28,48) —— 深蓝外套
        for y in 36..48 {
            for x in 20..28 {
                img.put_pixel(x, y, Rgba([40, 90, 170, 200]));
            }
        }

        // 右臂正面 (44,20)-(48,32) —— 蓝色袖子
        for y in 20..32 {
            for x in 44..48 {
                img.put_pixel(x, y, Rgba([60, 120, 200, 255]));
            }
        }
        // 右臂外层 (44,36)-(48,48) —— 深蓝袖
        for y in 36..48 {
            for x in 44..48 {
                img.put_pixel(x, y, Rgba([40, 90, 170, 200]));
            }
        }

        // 左臂正面 (36,52)-(40,64) —— 蓝色袖子（镜像）
        for y in 52..64 {
            for x in 36..40 {
                img.put_pixel(x, y, Rgba([60, 120, 200, 255]));
            }
        }
        // 左臂外层 (52,52)-(56,64) —— 深蓝袖（镜像）
        for y in 52..64 {
            for x in 52..56 {
                img.put_pixel(x, y, Rgba([40, 90, 170, 200]));
            }
        }

        // 右腿正面 (4,20)-(8,32) —— 棕色裤子
        for y in 20..32 {
            for x in 4..8 {
                img.put_pixel(x, y, Rgba([100, 70, 50, 255]));
            }
        }
        // 右腿外层 (4,36)-(8,48) —— 深棕裤
        for y in 36..48 {
            for x in 4..8 {
                img.put_pixel(x, y, Rgba([80, 50, 30, 200]));
            }
        }

        // 左腿正面 (20,52)-(24,64) —— 棕色裤子（镜像）
        for y in 52..64 {
            for x in 20..24 {
                img.put_pixel(x, y, Rgba([100, 70, 50, 255]));
            }
        }
        // 左腿外层 (4,52)-(8,64) —— 深棕裤（镜像）
        for y in 52..64 {
            for x in 4..8 {
                img.put_pixel(x, y, Rgba([80, 50, 30, 200]));
            }
        }

        img
    }

    #[test]
    fn generate_preview_images() {
        let skin = make_test_skin();
        let out_dir = std::path::Path::new("/tmp/wecraft-render-test");

        // Flat 头像（无帽子）
        let flat = render_flat_avatar(&skin, 128, false);
        flat.save(out_dir.join("preview_flat_no_hat.png"))
            .expect("保存 flat_no_hat 失败");

        // Flat 头像（有帽子）
        let flat_hat = render_flat_avatar(&skin, 128, true);
        flat_hat.save(out_dir.join("preview_flat_hat.png"))
            .expect("保存 flat_hat 失败");

        // Isometric 头像（无帽子）
        let iso = render_isometric_avatar(&skin, 256, false);
        iso.save(out_dir.join("preview_iso_no_hat.png"))
            .expect("保存 iso_no_hat 失败");

        // Isometric 头像（有帽子）
        let iso_hat = render_isometric_avatar(&skin, 256, true);
        iso_hat.save(out_dir.join("preview_iso_hat.png"))
            .expect("保存 iso_hat 失败");

        // 全身渲染（Steve 模型，缩放 4x）
        let body = render_full_body(&skin, false, 4);
        body.save(out_dir.join("preview_full_body.png"))
            .expect("保存 full_body 失败");

        // 全身渲染（Slim 模型，缩放 4x）
        let body_slim = render_full_body(&skin, true, 4);
        body_slim.save(out_dir.join("preview_full_body_slim.png"))
            .expect("保存 full_body_slim 失败");

        println!("预览图片已生成到: {:?}", out_dir);
    }

    #[test]
    fn test_point_in_quad_square() {
        let pts = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)];

        let uv = point_in_quad(&pts, 50.0, 50.0);
        assert!(uv.is_some());
        let (u, v) = uv.unwrap();
        assert!((u - 0.5).abs() < 0.01);
        assert!((v - 0.5).abs() < 0.01);

        let uv = point_in_quad(&pts, 0.0, 0.0);
        assert!(uv.is_some());
        let (u, v) = uv.unwrap();
        assert!(u.abs() < 0.01);
        assert!(v.abs() < 0.01);

        let uv = point_in_quad(&pts, 100.0, 100.0);
        assert!(uv.is_some());
        let (u, v) = uv.unwrap();
        assert!((u - 1.0).abs() < 0.01);
        assert!((v - 1.0).abs() < 0.01);
    }
}
