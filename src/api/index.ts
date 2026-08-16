/**
 * API 层统一导出入口
 *
 * 提供对 Rust 后端所有 Tauri 命令的类型安全封装。
 * 调用链: 前端代码 → src/api/*.ts → src/api/client.ts (IPC 中间件链) → Rust 命令
 *
 * @module
 */

export { invokeRust } from "./client";

export * from "./types/account";
export * from "./types/launch";
export * from "./types/download";
export * from "./types/modloader";
export * from "./types/game";
export * from "./types/config";
export * from "./types/java";
export * from "./types/font";

export * from "./account";
export * from "./launch";
export * from "./download";
export * from "./modloader";
export * from "./game";
export * from "./window";
export * from "./config";
export * from "./java";
export * from "./font";
export * from "./system";
export * from "./skin";
