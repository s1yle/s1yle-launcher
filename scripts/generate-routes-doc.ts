/**
 * 从 src/router/routes.tsx 提取路由信息，生成 Markdown 路由表。
 *
 * 用法: npx tsx scripts/generate-routes-doc.ts
 * 输出: docs/generated/routes.md
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type LayoutMode = "NORMAL" | "FULLSCREEN";

interface RouteConfig {
  path: string;
  componentName?: string;
  layoutMode?: LayoutMode;
  children?: RouteConfig[];
  parentPath?: string;
}

function flattenRoutes(routes: RouteConfig[], parent = ""): { path: string; component: string; layout: string }[] {
  const result: { path: string; component: string; layout: string }[] = [];
  for (const r of routes) {
    const fullPath = r.path.startsWith("/") ? r.path : `${parent}/${r.path}`;
    if (r.componentName) {
      result.push({ path: fullPath, component: r.componentName, layout: r.layoutMode ?? "NORMAL" });
    }
    if (r.children) {
      result.push(...flattenRoutes(r.children, fullPath));
    }
  }
  return result;
}

function buildTable(entries: { path: string; component: string; layout: string }[]): string {
  const rows = entries.map((e) => `| \`${e.path}\` | \`${e.component}\` | ${e.layout} |`);
  return [
    "| 路由 | 组件 | 布局模式 |",
    "|------|------|----------|",
    ...rows,
    "",
  ].join("\n");
}

async function main() {
  const outDir = resolve(__dirname, "..", "docs", "generated");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = await import(resolve(__dirname, "..", "src", "router", "routes.tsx"));
  const routes: RouteConfig[] = mod.routes;
  const flat = flattenRoutes(routes);

  const content = [
    "# 路由表（自动生成）",
    "",
    `> 生成时间: ${new Date().toISOString().slice(0, 10)}`,
    `> 源文件: \`src/router/routes.tsx\``,
    ">",
    "> ⚠️ 请勿手动编辑此文件，运行 `pnpm docs:gen` 重新生成。",
    "",
    buildTable(flat),
    "---",
    "",
    `共 **${flat.length}** 个路由条目。`,
    "",
  ].join("\n");

  writeFileSync(resolve(outDir, "routes.md"), content, "utf-8");
  console.log(`✅ 路由文档已生成 → docs/generated/routes.md (${flat.length} 条路由)`);
}

main().catch(console.error);
