/**
 * 从唯一 logo 源（src/assets/logo.svg）生成全部品牌产物：
 *  1. public/logo.svg        — 前端运行时 logo（<BrandLogo> 引用 /logo.svg）
 *  2. public/favicon.svg     — 浏览器/WebView favicon
 *  3. src-tauri/icons/*      — 应用图标（调用官方 tauri icon，bundle.icon 消费）
 *  4. public/loading.html    — 加载窗口页面（内联 SVG 由模板注入，保留呼吸动画）
 *
 * 用法: pnpm logo:gen
 * Logo 唯一事实源: src/assets/logo.svg（改动 logo 后只需重跑本脚本）
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const LOGO_SRC = resolve(root, "src/assets/logo.svg");
const LOGO_PUBLIC = resolve(root, "public/logo.svg");
const FAVICON_PUBLIC = resolve(root, "public/favicon.svg");
const LOADING_TEMPLATE = resolve(__dirname, "templates/loading.html.template");
const LOADING_OUT = resolve(root, "public/loading.html");

/** 给首个 <path>（白色底板）注入 white-bg 类，loading 页用它做呼吸动画 */
function injectWhiteBg(svg: string): string {
  const token = "<path ";
  const idx = svg.indexOf(token);
  if (idx === -1) return svg;
  return svg.slice(0, idx) + `<path class="white-bg" ` + svg.slice(idx + token.length);
}

/** 净化副本供 usvg/roxmltree 解析：去掉 XML 声明与文档级注释（tauri icon 对它们解析严格） */
function sanitizeForIcon(svg: string): string {
  return svg
    .replace(/^\s*<\?xml[^?]*\?>\s*/, "")
    .replace(/^\s*<!--[\s\S]*?-->\s*/, "")
    .replace('width="1550" height="1500"', 'width="1550" height="1550"')
    .replace('viewBox="0 0 1550 1500"', 'viewBox="0 0 1550 1550"');
}

function main() {
  const logoSvg = readFileSync(LOGO_SRC, "utf8");

  // 1. 运行时 logo + favicon
  mkdirSync(dirname(LOGO_PUBLIC), { recursive: true });
  copyFileSync(LOGO_SRC, LOGO_PUBLIC);
  copyFileSync(LOGO_SRC, FAVICON_PUBLIC);
  console.log("[gen-logo] public/logo.svg + public/favicon.svg");

  // 2. 应用图标（src-tauri/icons/*）
  const iconSource = join(tmpdir(), "wecraft-logo-icon.svg");
  writeFileSync(iconSource, sanitizeForIcon(logoSvg));
  execSync(`npx tauri icon ${iconSource}`, { cwd: root, stdio: "inherit" });
  console.log("[gen-logo] src-tauri/icons/*");

  // 3. 加载窗口页面
  const template = readFileSync(LOADING_TEMPLATE, "utf8");
  const svgMarkup = injectWhiteBg(logoSvg);
  if (!template.includes("<!--__WECRAFT_LOGO__-->")) {
    throw new Error("loading.html 模板缺少 <!--__WECRAFT_LOGO__--> 占位符");
  }
  writeFileSync(LOADING_OUT, template.replace("<!--__WECRAFT_LOGO__-->", svgMarkup));
  console.log("[gen-logo] public/loading.html");
}

main();