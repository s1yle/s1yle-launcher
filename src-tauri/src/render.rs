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

// ── 斜二测投影参数 ──

const DEPTH_SCALE: f32 = 0.5;
const ANGLE_COS: f32 = SQRT_2 / 2.0;
const ANGLE_SIN: f32 = SQRT_2 / 2.0;

const DX: f32 = -DEPTH_SCALE * ANGLE_COS;
const DY: f32 = DEPTH_SCALE * ANGLE_SIN;

// ── UV 坐标常量（64×64 皮肤）──

const HEAD_FRONT: (u32, u32, u32, u32) = (8, 8, 16, 16);
const HEAD_TOP: (u32, u32, u32, u32) = (8, 0, 16, 8);
const HEAD_RIGHT: (u32, u32, u32, u32) = (16, 8, 24, 16);

const HAT_FRONT: (u32, u32, u32, u32) = (40, 8, 48, 16);
const HAT_TOP: (u32, u32, u32, u32) = (40, 0, 48, 8);
const HAT_RIGHT: (u32, u32, u32, u32) = (48, 8, 56, 16);

// ── Mojang Session API 结构体 ──

#[derive(serde::Deserialize, Debug)]
pub struct MinecraftProfile {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub legacy: Option<bool>,
    pub properties: Vec<ProfileProperty>,
}

#[derive(serde::Deserialize, Debug)]
pub struct ProfileProperty {
    pub name: String,
    #[serde(default)]
    pub signature: Option<String>,
    pub value: String,
}

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

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub struct Textures {
    #[serde(default)]
    pub skin: Option<SkinTexture>,
    #[serde(default)]
    pub cape: Option<CapeTexture>,
}

#[derive(serde::Deserialize, Debug)]
pub struct SkinTexture {
    pub url: String,
    #[serde(default)]
    pub metadata: Option<SkinMetadata>,
}

#[derive(serde::Deserialize, Debug)]
pub struct SkinMetadata {
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(serde::Deserialize, Debug)]
pub struct CapeTexture {
    pub url: String,
}

// ── Mojang API 函数 ──

fn decode_texture_value(value: &str) -> Result<TextureData, String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(value)
        .map_err(|e| format!("Base64 解码失败: {}", e))?;
    let data = serde_json::from_slice::<TextureData>(&bytes)
        .map_err(|e| format!("纹理JSON解析失败: {}", e))?;
    Ok(data)
}

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

fn get_skin_cache_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取数据目录失败: {}", e))?
        .join("skins");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建缓存目录失败: {}", e))?;
    Ok(dir)
}

fn get_avatar_cache_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取数据目录失败: {}", e))?
        .join("avatars");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建缓存目录失败: {}", e))?;
    Ok(dir)
}

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

fn read_cached_model(cache_dir: &std::path::Path, uuid: &str) -> Option<String> {
    let meta_path = cache_dir.join(format!("{}.json", uuid));
    let bytes = std::fs::read(meta_path).ok()?;
    let meta: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    meta["model"].as_str().and_then(|s| {
        if s.is_empty() {
            None
        } else {
            Some(s.to_string())
        }
    })
}

fn write_cached_model(cache_dir: &std::path::Path, uuid: &str, model: Option<&str>) {
    let meta_path = cache_dir.join(format!("{}.json", uuid));
    let value = serde_json::json!({ "model": model.unwrap_or("") });
    let _ = std::fs::write(&meta_path, serde_json::to_string(&value).unwrap());
}

async fn download_and_cache_skin(
    app: &AppHandle,
    uuid: &str,
) -> Result<(std::path::PathBuf, Option<String>), String> {
    let cache_dir = get_skin_cache_dir(app)?;
    let cached_path = cache_dir.join(format!("{}.png", uuid));

    if cached_path.exists() {
        let model = read_cached_model(&cache_dir, uuid);
        return Ok((cached_path, model));
    }

    let profile = fetch_skin_by_uuid(uuid).await?;
    let (skin_url, model) = get_texture_url(&profile)?;

    let skin_bytes = reqwest::get(&skin_url)
        .await
        .map_err(|e| format!("皮肤下载失败: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("读取皮肤数据失败: {}", e))?
        .to_vec();

    std::fs::write(&cached_path, &skin_bytes).map_err(|e| format!("写入缓存失败: {}", e))?;
    write_cached_model(&cache_dir, uuid, model.as_deref());

    Ok((cached_path, model))
}

fn encode_png(img: &RgbaImage) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    image::DynamicImage::ImageRgba8(img.clone())
        .write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
        .map_err(|e| format!("PNG 编码失败: {}", e))?;
    Ok(bytes)
}

// ── 工具函数 ──

/// 加载皮肤图片，自动处理 64×32 旧格式
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

fn load_skin(path: &std::path::Path) -> Result<RgbaImage, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("读取文件失败: {}", e))?;
    load_skin_from_bytes(&bytes)
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

/// 渲染平面正面头像
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

// ── 斜二测 3D 头像渲染 ──

struct Face {
    indices: [usize; 4],
    uv: (u32, u32, u32, u32),
    flip_u: bool,
    flip_v: bool,
}

/// 渲染斜二测 3D 头像
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
