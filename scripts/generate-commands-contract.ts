/**
 * 命令契约生成器：
 * 1. 解析 src-tauri/src/lib.rs 的 generate_handler! 列表 → 生成 src/api/generated-commands.json
 * 2. --check 模式：扫描前端 invoke 调用是否全部在清单内（漂移即报错）
 *
 * 用法: npx tsx scripts/generate-commands-contract.ts [--check]
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function extractGenerateHandler(src: string): string[] {
  const marker = "invoke_handler(tauri::generate_handler![";
  const start = src.indexOf(marker);
  if (start === -1) throw new Error("未找到 generate_handler! 宏");

  const open = src.indexOf("[", start);
  let depth = 1;
  let i = open + 1;
  while (depth > 0 && i < src.length) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") depth--;
    i++;
  }
  const block = src.slice(open + 1, i - 1);

  const names = new Set<string>();
  for (const line of block.split("\n")) {
    const clean = line.replace(/\/\/.*$/, "").trim();
    if (!clean) continue;
    const tokens = clean.match(/[a-zA-Z_][a-zA-Z0-9_]*(?:\s*::\s*[a-zA-Z_][a-zA-Z0-9_]*)*/g) ?? [];
    for (const token of tokens) {
      const last = token.split("::").pop()!.trim();
      if (!last) continue;
      names.add(last);
    }
  }
  return [...names].sort();
}

function collectFrontendInvokes(): string[] {
  const apiDir = resolve(root, "src/api");
  const files = [
    ...readdirSync(apiDir).filter((f) => f.endsWith(".ts")).map((f) => resolve(apiDir, f)),
    resolve(root, "src/helper/rustInvoke.ts"),
  ].filter((f) => existsSync(f));

  const invokes: string[] = [];
  const regex = /invoke(?:Rust|RustFunction)?\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content))) {
      invokes.push(m[1]);
    }
  }
  return [...new Set(invokes)];
}

const commands = extractGenerateHandler(readFileSync(resolve(root, "src-tauri/src/lib.rs"), "utf-8"));
const outPath = resolve(root, "src/api/generated-commands.json");
writeFileSync(outPath, JSON.stringify(commands, null, 2) + "\n", "utf-8");
console.log(`✅ 命令契约已生成 → src/api/generated-commands.json (${commands.length} 条)`);

if (process.argv.includes("--check")) {
  const used = collectFrontendInvokes();
  const missing = used.filter((name) => !commands.includes(name));
  if (missing.length > 0) {
    console.error("❌ 前端调用了未注册的 Rust 命令:");
    for (const name of missing) console.error(`   - ${name}`);
    process.exit(1);
  }
  console.log(`✅ 契约校验通过: 前端 ${used.length} 个调用全部已注册`);
}
