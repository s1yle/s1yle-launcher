# Minecraft 皮肤渲染规范

> **最后更新**: 2026-06-09  
> **项目版本**: 0.1.0-alpha.2  
> **状态**: 参考规范  
> **分类**: 技术规范

**相关文档**:
- 文档维护规范：[`MAINTENANCE.md`](MAINTENANCE.md) - 文档编写与更新指南
- 架构设计：[`architecture.md`](architecture.md) - 技术架构
- API 文档：[`api.md`](api.md) - 后端 API 调用指南

---

## 1. 概述

### 1.1 用途

本文档定义了 Minecraft Java 版皮肤（64×64 现代格式）的完整规范，包括：

- 文件格式与约束
- 所有身体部位的 UV 映射坐标
- Steve/Alex 两种模型差异
- Rust 后端解析与渲染示例

### 1.2 适用范围

| 范围 | 说明 |
|------|------|
| 游戏版本 | Java 版 1.8+（2014 年至今） |
| 皮肤格式 | 64×64 现代格式（兼容 64×32 旧版） |
| 渲染用途 | 头像渲染、全身渲染、皮肤预览 |

### 1.3 规范稳定性

Minecraft 皮肤核心规范自 2014 年 Java 1.8 发布以来**从未发生过破坏性变更**：

- 2014 年 1.8：从 64×32 升级到 64×64，增加外层装饰
- 2015 年 1.9：增加外层半透明支持
- 2022 年 1.19.3：新增 7 个默认皮肤，**格式未变**

---

## 2. 文件规范 {#file-spec}

所有合法 Minecraft 皮肤必须满足以下要求：

| 规范项 | 强制标准 | 说明 |
|--------|----------|------|
| 文件格式 | 无损 PNG | JPG/WebP 丢失透明度，不推荐 |
| 颜色模式 | RGBA 32 位 | 支持 Alpha 透明通道 |
| 标准尺寸 | 64×64 像素 | Java 版唯一通用格式 |
| 文件大小 | ≤ 16 KB | Mojang 官方服务器限制 |
| 旧版兼容 | 64×32 像素 | 自动填充透明至 64×64 |

### 2.1 层渲染规则 {#layer-rules}

- **第一层（内层）**：身体基础层，Java 版不允许完全透明（否则显示黑色）
- **第二层（外层）**：装饰层（帽子、夹克、袖子、裤子），支持完全透明和半透明
- **渲染顺序**：先内层后外层，按深度排序（后面 → 前面）
- **Z-fighting 避免**：外层比内层大 0.25 像素（头部外层大 0.5 像素）
- **插值方式**：必须使用**最近邻插值**，禁止线性插值

---

## 3. 64×64 平面布局总览 {#layout-overview}

皮肤平面图按**纵向 4 个 16 像素高**的区块划分：

```
Y 坐标范围
  0-15  →  头部区域（内层 + 外层）
 16-31  →  上身内层（身体 + 右臂 + 右腿）
 32-47  →  上身外层（夹克 + 右袖 + 右裤）
 48-63  →  下身区域（左腿 + 左臂 内层 + 外层）

X 坐标范围：0-63
```

### 3.1 区块对照图

```
       0   8   16  24  32  40  48  56  63
Y=0    ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │   │头 │头 │头 │   │帽 │帽 │帽 │
       │   │顶 │底 │   │   │顶 │底 │   │
Y=8    ├───┼───┼───┼───┼───┼───┼───┼───┤
       │头 │脸 │侧 │后 │帽 │帽 │帽 │帽 │
Y=16   ├───┼───┼───┼───┼───┼───┼───┼───┤
       │右 │身 │身 │身 │右 │右 │右 │   │
       │腿 │肩 │   │背 │臂 │臂 │臂 │   │
Y=32   ├───┼───┼───┼───┼───┼───┼───┼───┤
       │右 │夹 │夹 │夹 │右 │右 │右 │   │
       │裤 │克 │克 │克 │袖 │袖 │袖 │   │
Y=48   ├───┼───┼───┼───┼───┼───┼───┼───┤
       │左 │左 │左 │   │左 │左 │左 │左 │
       │裤 │腿 │腿 │   │臂 │臂 │臂 │袖 │
Y=63   └───┴───┴───┴───┴───┴───┴───┴───┘
```

---

## 4. UV 映射坐标参考 {#uv-reference}

### 4.1 头部区域（Y: 0-15）{#head-uv}

#### 头部内层（第一层）X: 0-31, Y: 0-15

| 面 | UV 坐标范围 | 尺寸 | 说明 |
|----|------------|------|------|
| 顶面 | `(8,0)` ~ `(15,7)` | 8×8 | 头顶 |
| 底面 | `(16,0)` ~ `(23,7)` | 8×8 | 下巴（通常不可见） |
| 右面 | `(0,8)` ~ `(7,15)` | 8×8 | 头部右侧 |
| **前面（脸）** | `(8,8)` ~ `(15,15)` | **8×8** | **正脸** |
| 左面 | `(16,8)` ~ `(23,15)` | 8×8 | 头部左侧 |
| 后面 | `(24,8)` ~ `(31,15)` | 8×8 | 后脑勺 |

#### 帽子外层（第二层）X: 32-63, Y: 0-15

| 面 | UV 坐标范围 | 尺寸 | 说明 |
|----|------------|------|------|
| 顶面 | `(40,0)` ~ `(47,7)` | 8×8 | 帽子顶部 |
| 底面 | `(48,0)` ~ `(55,7)` | 8×8 | 帽子底部 |
| 右面 | `(32,8)` ~ `(39,15)` | 8×8 | 帽子右侧 |
| **前面** | `(40,8)` ~ `(47,15)` | **8×8** | **帽子正面** |
| 左面 | `(48,8)` ~ `(55,15)` | 8×8 | 帽子左侧 |
| 后面 | `(56,8)` ~ `(63,15)` | 8×8 | 帽子背面 |

**偏移规律**：头部到帽子 UV 偏移为 `dx+32, dy+0`（X 右移 32 像素，Y 不变）。

### 4.2 身体区域（Y: 16-47）{#body-uv}

#### 身体内层（第一层）X: 16-39, Y: 16-31

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面（肩） | `(20,16)` ~ `(27,19)` | 8×4 |
| 底面（腰） | `(28,16)` ~ `(35,19)` | 8×4 |
| 右面 | `(16,20)` ~ `(19,31)` | 4×12 |
| **前面** | `(20,20)` ~ `(27,31)` | **8×12** |
| 左面 | `(28,20)` ~ `(31,31)` | 4×12 |
| 后面 | `(32,20)` ~ `(39,31)` | 8×12 |

#### 身体外层/夹克（第二层）X: 16-39, Y: 32-47

所有面的 UV 坐标与身体内层相同（仅 Y 偏移 +16），渲染时立方体大 0.25 像素。

### 4.3 右臂区域（玩家视角左臂，Y: 16-47）{#right-arm-uv}

#### 右臂内层 X: 40-55, Y: 16-31

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面（肩） | `(44,16)` ~ `(47,19)` | 4×4 |
| 底面（腕） | `(48,16)` ~ `(51,19)` | 4×4 |
| 右面（外侧） | `(40,20)` ~ `(43,31)` | 4×12 |
| **前面** | `(44,20)` ~ `(47,31)` | **4×12** |
| 左面（内侧） | `(48,20)` ~ `(51,31)` | 4×12 |
| 后面 | `(52,20)` ~ `(55,31)` | 4×12 |

#### 右臂外层/右袖 X: 40-55, Y: 32-47

与内层同 UV 坐标，Y 偏移 +16。

### 4.4 右腿区域（Y: 16-47）{#right-leg-uv}

#### 右腿内层 X: 0-15, Y: 16-31

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面 | `(4,16)` ~ `(7,19)` | 4×4 |
| 底面 | `(8,16)` ~ `(11,19)` | 4×4 |
| 右面（外侧） | `(0,20)` ~ `(3,31)` | 4×12 |
| **前面** | `(4,20)` ~ `(7,31)` | **4×12** |
| 左面（内侧） | `(8,20)` ~ `(11,31)` | 4×12 |
| 后面 | `(12,20)` ~ `(15,31)` | 4×12 |

#### 右腿外层/右裤 X: 0-15, Y: 32-47

与内层同 UV 坐标，Y 偏移 +16。

### 4.5 左腿区域（Y: 48-63）{#left-leg-uv}

#### 左腿内层 X: 16-31, Y: 48-63

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面 | `(20,48)` ~ `(23,51)` | 4×4 |
| 底面 | `(24,48)` ~ `(27,51)` | 4×4 |
| 右面（内侧） | `(16,52)` ~ `(19,63)` | 4×12 |
| **前面** | `(20,52)` ~ `(23,63)` | **4×12** |
| 左面（外侧） | `(24,52)` ~ `(27,63)` | 4×12 |
| 后面 | `(28,52)` ~ `(31,63)` | 4×12 |

#### 左腿外层/左裤 X: 0-15, Y: 48-63

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面 | `(4,48)` ~ `(7,51)` | 4×4 |
| 底面 | `(8,48)` ~ `(11,51)` | 4×4 |
| 右面（内侧） | `(0,52)` ~ `(3,63)` | 4×12 |
| **前面** | `(4,52)` ~ `(7,63)` | **4×12** |
| 左面（外侧） | `(8,52)` ~ `(11,63)` | 4×12 |
| 后面 | `(12,52)` ~ `(15,63)` | 4×12 |

### 4.6 左臂区域（玩家视角右臂，Y: 48-63）{#left-arm-uv}

#### 左臂内层 X: 32-47, Y: 48-63

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面（肩） | `(36,48)` ~ `(39,51)` | 4×4 |
| 底面（腕） | `(40,48)` ~ `(43,51)` | 4×4 |
| 右面（内侧） | `(32,52)` ~ `(35,63)` | 4×12 |
| **前面** | `(36,52)` ~ `(39,63)` | **4×12** |
| 左面（外侧） | `(40,52)` ~ `(43,63)` | 4×12 |
| 后面 | `(44,52)` ~ `(47,63)` | 4×12 |

#### 左臂外层/左袖 X: 48-63, Y: 48-63

| 面 | UV 坐标范围 | 尺寸 |
|----|------------|------|
| 顶面 | `(52,48)` ~ `(55,51)` | 4×4 |
| 底面 | `(56,48)` ~ `(59,51)` | 4×4 |
| 右面（内侧） | `(48,52)` ~ `(51,63)` | 4×12 |
| **前面** | `(52,52)` ~ `(55,63)` | **4×12** |
| 左面（外侧） | `(56,52)` ~ `(59,63)` | 4×12 |
| 后面 | `(60,52)` ~ `(63,63)` | 4×12 |

---

## 5. 模型差异 {#model-diff}

**模型类型与皮肤文件无关**，由用户在 Mojang 账号设置中选择。同一张 64×64 皮肤可在两种模型上使用。

| 模型 | 别名 | 手臂宽度 | 适用皮肤 |
|------|------|----------|----------|
| 宽型 | Classic / Steve | 4 像素 | Steve, Ari, Kai, Sunny, Zuri |
| 纤细型 | Slim / Alex | 3 像素 | Alex, Efe, Makena, Noor |

**渲染差异**：仅手臂宽度不同，UV 坐标不变（皮肤图的像素布局相同）。Slim 模型的左臂/右臂渲染时裁切宽度为 3 像素而非 4 像素：

```rust
// Steve（宽臂）：x2 = x1 + 4
const RIGHT_ARM_FRONT: (u32, u32, u32, u32) = (44, 20, 48, 32);  // width = 4
// Alex（细臂）：x2 = x1 + 3
const RIGHT_ARM_FRONT_SLIM: (u32, u32, u32, u32) = (44, 20, 47, 32); // width = 3
```

⚠️ 常见误区：皮肤文件中的手臂区域始终占用 4 列像素（Steve/Alex 共用同一套 UV 坐标），区别在于 Slim 模型渲染时会忽略最右侧 1 列。模型类型应通过 Mojang API 的 `metadata.model` 字段判断，而非对像素进行启发式检测。

---

## 6. Rust 解析与渲染示例 {#rust-examples}

### 6.1 前置条件

`image` crate 已在 [`Cargo.toml`](../src-tauri/Cargo.toml) 中引入：

```toml
[dependencies]
image = "0.25.10"
```

### 6.2 从 Mojang API 获取皮肤数据 {#fetch-skin}

```rust
use reqwest;
use serde_json::Value;

/// 从 UUID 获取皮肤纹理的 RGB 像素数据
///
/// API 链路:
///   1. sessionserver.mojang.com/profile/{uuid}
///   2. 解析 base64 编码的 textures JSON
///   3. 从 textures.SKIN.url 下载 PNG
async fn fetch_skin_by_uuid(uuid: &str) -> Result<Vec<u8>, String> {
    // Step 1: 获取用户 profile
    let profile_url = format!(
        "https://sessionserver.mojang.com/session/minecraft/profile/{}",
        uuid
    );
    let resp = reqwest::get(&profile_url)
        .await
        .map_err(|e| format!("Profile 请求失败: {}", e))?;
    let profile: Value = resp
        .json()
        .await
        .map_err(|e| format!("Profile 解析失败: {}", e))?;

    // Step 2: 提取 textures 属性（base64 编码的 JSON）
    let properties = profile["properties"]
        .as_array()
        .ok_or("缺少 properties 字段")?;
    let textures_prop = properties
        .iter()
        .find(|p| p["name"] == "textures")
        .ok_or("缺少 textures 属性")?;
    let encoded = textures_prop["value"]
        .as_str()
        .ok_or("textures.value 不是字符串")?;

    // base64 解码
    use base64::Engine;
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| format!("base64 解码失败: {}", e))?;
    let textures: Value =
        serde_json::from_slice(&decoded).map_err(|e| format!("JSON 解析失败: {}", e))?;

    // Step 3: 提取皮肤 URL 并下载
    let skin_url = textures["textures"]["SKIN"]["url"]
        .as_str()
        .ok_or("缺少皮肤 URL")?;

    // Step 4: 判断模型类型
    let is_slim = textures["textures"]["SKIN"]["metadata"]["model"]
        .as_str()
        .map(|m| m == "slim")
        .unwrap_or(false);

    let skin_bytes = reqwest::get(skin_url)
        .await
        .map_err(|e| format!("皮肤下载失败: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("读取皮肤数据失败: {}", e))?
        .to_vec();

    Ok(skin_bytes)
}
```

### 6.3 加载与验证皮肤文件 {#load-skin}

```rust
use image::{ImageBuffer, Rgba, RgbaImage};
use std::io::Cursor;

/// 从字节数据加载皮肤，验证格式和尺寸
fn load_skin(bytes: &[u8]) -> Result<RgbaImage, String> {
    let img = image::load_from_memory(bytes)
        .map_err(|e| format!("图片加载失败: {}", e))?
        .into_rgba8();

    if img.width() != 64 || img.height() != 64 {
        return Err(format!(
            "皮肤尺寸必须为 64×64，实际为 {}×{}",
            img.width(),
            img.height()
        ));
    }

    Ok(img)
}
```

### 6.4 UV 区域提取 {#uv-extract}

将 UV 坐标定义为常量，便于验证和修护：

```rust
// ── 头部内层 UV 坐标 ──
pub const HEAD_FRONT: (u32, u32, u32, u32) = (8, 8, 16, 16);
pub const HEAD_TOP: (u32, u32, u32, u32) = (8, 0, 16, 8);
pub const HEAD_BOTTOM: (u32, u32, u32, u32) = (16, 0, 24, 8);
pub const HEAD_RIGHT: (u32, u32, u32, u32) = (0, 8, 8, 16);
pub const HEAD_LEFT: (u32, u32, u32, u32) = (16, 8, 24, 16);
pub const HEAD_BACK: (u32, u32, u32, u32) = (24, 8, 32, 16);

// ── 帽子外层 UV 坐标 ──
pub const HAT_FRONT: (u32, u32, u32, u32) = (40, 8, 48, 16);
pub const HAT_TOP: (u32, u32, u32, u32) = (40, 0, 48, 8);
pub const HAT_RIGHT: (u32, u32, u32, u32) = (32, 8, 40, 16);
pub const HAT_LEFT: (u32, u32, u32, u32) = (48, 8, 56, 16);
pub const HAT_BACK: (u32, u32, u32, u32) = (56, 8, 64, 16);

// ── 身体内层 UV 坐标 ──
pub const BODY_FRONT: (u32, u32, u32, u32) = (20, 20, 28, 32);
pub const BODY_BACK: (u32, u32, u32, u32) = (32, 20, 40, 32);

// ── 右臂内层 ──
pub const RIGHT_ARM_FRONT: (u32, u32, u32, u32) = (44, 20, 48, 32);

// ── 左臂内层 ──
pub const LEFT_ARM_FRONT: (u32, u32, u32, u32) = (36, 52, 40, 64);

// ── 提取 UV 区域为独立子图 ──
fn extract_uv_region(skin: &RgbaImage, uv: (u32, u32, u32, u32)) -> RgbaImage {
    let (x1, y1, x2, y2) = uv;
    let w = x2 - x1;
    let h = y2 - y1;
    let mut region = RgbaImage::new(w, h);
    for y in y1..y2 {
        for x in x1..x2 {
            region.put_pixel(x - x1, y - y1, *skin.get_pixel(x, y));
        }
    }
    region
}
```

### 6.5 头像渲染（斜二测投影）{#render-avatar}

实现经典的 Minecraft 头像渲染：仅显示头部（前面 + 顶面 + 右面），使用 2:1 斜二测投影。

```rust
use image::{ImageBuffer, Rgba, RgbaImage};

/// 头像渲染尺寸
pub enum AvatarSize {
    S32 = 32,
    S64 = 64,
    S128 = 128,
    S256 = 256,
}

/// 使用斜二测投影渲染 3D 头部
///
/// 投影公式（标准 MC 头像 2:1 比例）:
///   screen_x = (x - z) * scale + offset_x
///   screen_y = (x + z) * 0.5 * scale - y * scale + offset_y
pub fn render_head_avatar(
    skin: &RgbaImage,
    size: AvatarSize,
    show_hat: bool,
) -> RgbaImage {
    let size_px = size as u32;
    let mut output = RgbaImage::new(size_px, size_px);

    // 头部立方体半边长
    let half: f32 = 4.0;
    // 缩放系数：头部占画布约 60%
    let scale = size_px as f32 / (half * 3.5);
    let offset_x = size_px as f32 / 2.0;
    let offset_y = size_px as f32 / 2.0;

    // 投影函数 (x, y, z) -> (screen_x, screen_y)
    let project = |x: f32, y: f32, z: f32| -> (f32, f32) {
        let sx = (x - z) * scale + offset_x;
        let sy = (x + z) * 0.5 * scale - y * scale + offset_y;
        (sx, sy)
    };

    // 立方体 8 个顶点（局部坐标）
    let vertices: [(f32, f32, f32); 8] = [
        (-half, -half, -half), // 0: 前下左
        ( half, -half, -half), // 1: 前下右
        ( half,  half, -half), // 2: 前上右
        (-half,  half, -half), // 3: 前上左
        (-half, -half,  half), // 4: 后下左
        ( half, -half,  half), // 5: 后下右
        ( half,  half,  half), // 6: 后上右
        (-half,  half,  half), // 7: 后上左
    ];

    // 可见面定义（前面、顶面、右面）
    struct Face {
        indices: [usize; 4], // 顶点索引
        uv: (u32, u32, u32, u32), // 纹理区域
    }

    let faces = [
        Face { indices: [0, 1, 2, 3], uv: HEAD_FRONT },
        Face { indices: [3, 2, 6, 7], uv: HEAD_TOP },
        Face { indices: [1, 5, 6, 2], uv: HEAD_RIGHT },
    ];

    // 渲染每个面（先渲染内层）
    for face in &faces {
        render_face(&mut output, skin, &vertices, face, &project);
    }

    // 渲染帽子外层
    if show_hat {
        // 帽子比头部大 0.5 像素
        let hat_half = half + 0.5;
        let hat_vertices: [(f32, f32, f32); 8] = [
            (-hat_half, -hat_half, -hat_half),
            ( hat_half, -hat_half, -hat_half),
            ( hat_half,  hat_half, -hat_half),
            (-hat_half,  hat_half, -hat_half),
            (-hat_half, -hat_half,  hat_half),
            ( hat_half, -hat_half,  hat_half),
            ( hat_half,  hat_half,  hat_half),
            (-hat_half,  hat_half,  hat_half),
        ];

        let hat_faces = [
            Face { indices: [0, 1, 2, 3], uv: HAT_FRONT },
            Face { indices: [3, 2, 6, 7], uv: HAT_TOP },
            Face { indices: [1, 5, 6, 2], uv: HAT_RIGHT },
        ];

        for face in &hat_faces {
            render_face(&mut output, skin, &hat_vertices, face, &project);
        }
    }

    output
}

/// 渲染单个立方体面（纹理映射 + 最近邻插值）
fn render_face(
    output: &mut RgbaImage,
    skin: &RgbaImage,
    vertices: &[(f32, f32, f32); 8],
    face: &Face,
    project: &impl Fn(f32, f32, f32) -> (f32, f32),
) {
    let (uv_x1, uv_y1, uv_x2, uv_y2) = face.uv;
    let uv_w = (uv_x2 - uv_x1) as f32;
    let uv_h = (uv_y2 - uv_y1) as f32;

    // 计算四个顶点的屏幕坐标
    let pts: [(f32, f32); 4] = [
        project(
            vertices[face.indices[0]].0,
            vertices[face.indices[0]].1,
            vertices[face.indices[0]].2,
        ),
        project(
            vertices[face.indices[1]].0,
            vertices[face.indices[1]].1,
            vertices[face.indices[1]].2,
        ),
        project(
            vertices[face.indices[2]].0,
            vertices[face.indices[2]].1,
            vertices[face.indices[2]].2,
        ),
        project(
            vertices[face.indices[3]].0,
            vertices[face.indices[3]].1,
            vertices[face.indices[3]].2,
        ),
    ];

    // 计算包围盒
    let min_x = pts.iter().map(|p| p.0).fold(f32::MAX, f32::min).floor() as i32;
    let max_x = pts.iter().map(|p| p.0).fold(f32::MIN, f32::max).ceil() as i32;
    let min_y = pts.iter().map(|p| p.1).fold(f32::MAX, f32::min).floor() as i32;
    let max_y = pts.iter().map(|p| p.1).fold(f32::MIN, f32::max).ceil() as i32;

    // 对于包围盒内的每个像素，判断是否在四边形内
    // 使用叉积法判断点是否在凸四边形内
    for sy in min_y..max_y {
        for sx in min_x..max_x {
            if sx < 0 || sy < 0 || sx >= output.width() as i32 || sy >= output.height() as i32 {
                continue;
            }

            // 使用重心坐标或双线性插值计算 UV
            // 简化实现：线性映射（假设四边形接近平行四边形）
            let (u_lerp, v_lerp) = compute_uv(&pts, sx as f32, sy as f32);

            // 最近邻采样
            let tx = (uv_x1 as f32 + u_lerp * uv_w).round() as u32;
            let ty = (uv_y1 as f32 + v_lerp * uv_h).round() as u32;
            let tx = tx.clamp(uv_x1, uv_x2 - 1);
            let ty = ty.clamp(uv_y1, uv_y2 - 1);

            let pixel = skin.get_pixel(tx, ty);
            // 跳过透明像素（用于外层渲染）
            if pixel[3] == 0 {
                continue;
            }
            output.put_pixel(sx as u32, sy as u32, *pixel);
        }
    }
}

/// 双线性插值计算 UV 坐标
fn compute_uv(pts: &[(f32, f32); 4], px: f32, py: f32) -> (f32, f32) {
    // 四边形的四个角: p0-p3
    // 解线性方程组: px = p0.x + u*(p1.x-p0.x) + v*(p3.x-p0.x)
    //               py = p0.y + u*(p1.y-p0.y) + v*(p3.y-p0.y)
    // 简化近似：将四边形视为平行四边形
    let (x0, y0) = pts[0];
    let (x1, y1) = pts[1];
    let (x3, y3) = pts[3];

    let dx1 = x1 - x0;
    let dy1 = y1 - y0;
    let dx3 = x3 - x0;
    let dy3 = y3 - y0;

    let det = dx1 * dy3 - dx3 * dy1;
    if det.abs() < 1e-6 {
        return (0.5, 0.5);
    }

    let du = ((px - x0) * dy3 - (py - y0) * dx3) / det;
    let dv = ((py - y0) * dx1 - (px - x0) * dy1) / det;

    (du.clamp(0.0, 1.0), dv.clamp(0.0, 1.0))
}
```

### 6.6 Tauri 命令封装 {#tauri-command}

按照项目架构规范，渲染器通过 Tauri IPC 暴露给前端：

```rust
/// Minecraft 皮肤头像渲染命令
///
/// # 参数
/// - `uuid`: Mojang 账号 UUID
/// - `size`: 输出尺寸（默认 128）
/// - `show_hat`: 是否渲染帽子层（默认 true）
///
/// # 返回
/// PNG 格式的字节数据
#[tauri::command]
async fn render_avatar(
    uuid: String,
    size: Option<u32>,
    show_hat: Option<bool>,
) -> Result<Vec<u8>, String> {
    let size = match size.unwrap_or(128) {
        s if s <= 32 => AvatarSize::S32,
        s if s <= 64 => AvatarSize::S64,
        s if s <= 128 => AvatarSize::S128,
        _ => AvatarSize::S256,
    };
    let show_hat = show_hat.unwrap_or(true);

    // 1. 检查本地缓存
    let cache_path = get_cache_path(&uuid, &size);
    if cache_path.exists() {
        return std::fs::read(&cache_path)
            .map_err(|e| format!("读取缓存失败: {}", e));
    }

    // 2. 从 Mojang API 获取皮肤
    let skin_bytes = fetch_skin_by_uuid(&uuid).await?;
    let skin = load_skin(&skin_bytes)?;

    // 3. 渲染头像
    let avatar = render_head_avatar(&skin, size, show_hat);

    // 4. 编码为 PNG
    let mut png_bytes = Vec::new();
    avatar
        .write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png)
        .map_err(|e| format!("PNG 编码失败: {}", e))?;

    // 5. 写入本地缓存
    if let Some(parent) = cache_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(&cache_path, &png_bytes);

    Ok(png_bytes)
}

/// 获取缓存文件路径
fn get_cache_path(uuid: &str, size: &AvatarSize) -> std::path::PathBuf {
    let mut path = dirs_next::cache_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    path.push("wecraft-launcher");
    path.push("avatars");
    path.push(format!("{}_{}.png", uuid, *size as u32));
    path
}
```

### 6.7 注册命令 {#register-command}

在 [`lib.rs`](../src-tauri/src/lib.rs) 中注册：

```rust
// src-tauri/src/lib.rs
mod render; // 新增模块

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... 现有命令
            crate::render::render_avatar, // 新增
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 6.8 前端调用 {#frontend-call}

按照 [`api.md`](api.md) 的统一调用模式：

```typescript
import { invoke } from '@tauri-apps/api/core';

interface RenderAvatarOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

async function renderAvatar(options: RenderAvatarOptions): Promise<string> {
  const pngBytes: number[] = await invoke('render_avatar', {
    uuid: options.uuid,
    size: options.size ?? 128,
    showHat: options.showHat ?? true,
  });

  // 将字节数组转为 base64 图片 URL
  const uint8Array = new Uint8Array(pngBytes);
  const blob = new Blob([uint8Array], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

// 使用示例
const avatarUrl = await renderAvatar({ uuid: 'user-uuid-here', size: 64 });
<img src={avatarUrl} alt="头像" width={64} height={64} />
```

### 6.9 皮肤部位枚举 {#skin-part-enum}

`render.rs` 中定义了 `SkinPart` 枚举，覆盖全部 72 个皮肤部位（内层+外层各 36 个），提供 `rect()` 和 `crop()` 方法：

```rust
/// 完整 72 部位枚举（Steve 64×64 模型）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SkinPart {
    HeadTop, HeadBottom, HeadRight, HeadFront, HeadLeft, HeadBack,
    HatTop, HatBottom, HatRight, HatFront, HatLeft, HatBack,
    BodyTop, BodyBottom, BodyRight, BodyFront, BodyLeft, BodyBack,
    JacketTop, JacketBottom, JacketRight, JacketFront, JacketLeft, JacketBack,
    RightArmTop, RightArmBottom, RightArmRight, RightArmFront, RightArmLeft, RightArmBack,
    RightSleeveTop, RightSleeveBottom, RightSleeveRight, RightSleeveFront, RightSleeveLeft, RightSleeveBack,
    RightLegTop, RightLegBottom, RightLegRight, RightLegFront, RightLegLeft, RightLegBack,
    RightPantsTop, RightPantsBottom, RightPantsRight, RightPantsFront, RightPantsLeft, RightPantsBack,
    LeftArmTop, LeftArmBottom, LeftArmRight, LeftArmFront, LeftArmLeft, LeftArmBack,
    LeftSleeveTop, LeftSleeveBottom, LeftSleeveRight, LeftSleeveFront, LeftSleeveLeft, LeftSleeveBack,
    LeftLegTop, LeftLegBottom, LeftLegRight, LeftLegFront, LeftLegLeft, LeftLegBack,
    LeftPantsTop, LeftPantsBottom, LeftPantsRight, LeftPantsFront, LeftPantsLeft, LeftPantsBack,
}

impl SkinPart {
    /// 返回 (x1, y1, x2, y2) 格式的裁切坐标
    pub fn rect(&self) -> (u32, u32, u32, u32) { ... }
    /// 从 64×64 皮肤图中裁切该部位
    pub fn crop(&self, skin: &RgbaImage) -> RgbaImage { ... }
}
```

坐标值见第 4 节各部位表格，完整实现见 [`render.rs`](../src-tauri/src/render.rs)。

---

## 7. 缓存策略 {#caching}

| 缓存层级 | 存储位置 | 有效期 | 说明 |
|----------|----------|--------|------|
| 原始皮肤 | `{cache_dir}/skins/{uuid}.png` | 永久 | 皮肤数据本身不变 |
| 渲染头像 | `{cache_dir}/avatars/{uuid}_{size}.png` | 7 天 | 重新渲染成本低 |

---

## 8. 验证方法 {#verification}

皮肤文件的 UV 布局验证可用以下方法：

```python
from PIL import Image

img = Image.open("skin.png").convert("RGBA")
w, h = img.size
assert w == 64 and h == 64, "尺寸必须为 64×64"

# 验证脸部区域有像素
face_region = img.crop((8, 8, 16, 16))
opaque = sum(1 for _, _, _, a in face_region.getdata() if a > 0)
assert opaque > 0, "脸部区域不应全透明"
```

完整验证实现见 [`../docs/MAINTENANCE.md`](MAINTENANCE.md) 文档维护规范。

---

## 9. 参考资源 {#references}

- [Official Minecraft Wiki - Skin](https://minecraft.wiki/w/Skin)
- [Minecraft Wiki - Player.dat format](https://minecraft.wiki/w/Player.dat_format)
- [Crafatar API](https://crafatar.com) - 开源头像渲染服务
- [Minotar API](https://minotar.net) - 头像渲染服务

---

## 附录 A：快速对照表 {#quick-ref}

### UV 坐标速查

| 部位 | 面 | 内层 UV | 外层 UV |
|------|----|---------|---------|
| 头部 | 前面 | `(8,8)-(16,16)` | `(40,8)-(48,16)` |
| 头部 | 顶面 | `(8,0)-(16,8)` | `(40,0)-(48,8)` |
| 头部 | 右面 | `(0,8)-(8,16)` | `(32,8)-(40,16)` |
| 身体 | 前面 | `(20,20)-(28,32)` | `(20,36)-(28,48)` |
| 右臂 | 前面 | `(44,20)-(48,32)` | `(44,36)-(48,48)` |
| 右腿 | 前面 | `(4,20)-(8,32)` | `(4,36)-(8,48)` |
| 左腿 | 前面 | `(20,52)-(24,64)` | `(4,52)-(8,64)` |
| 左臂 | 前面 | `(36,52)-(40,64)` | `(52,52)-(56,64)` |

### 投影参数

| 参数 | 值 | 说明 |
|------|----|------|
| 投影类型 | 斜二测（2:1） | X轴 45°，Y轴 ≈ 26.565° |
| 可见面 | 前面 + 顶面 + 右面 | 标准头像视角 |
| 插值 | 最近邻 | 保持像素锐利 |
