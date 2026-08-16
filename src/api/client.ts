import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { logger } from "@/helper/logger";
import commands from './generated-commands.json';

type Next = (fn: string, args: InvokeArgs) => Promise<any>;
type Middleware = (next: Next) => Next;

const core: Next = async (fn, args) => {
  if (!fn?.trim()) throw new Error("Rust 函数名不能为空");
  return invoke(fn, args);
};

const commandSet = new Set<string>(commands);

const withContractCheck: Middleware = (next) => async (fn, args) => {
  if (!commandSet.has(fn)) {
    const err = new Error(`Rust 命令 "${fn}" 未注册（检查 src-tauri/src/lib.rs 的 generate_handler! 或前端拼写）`);
    console.error(`[IPC] 契约校验失败:`, err);
    throw err;
  }
  return next(fn, args);
};

const withLogging: Middleware = (next) => async (fn, args) => {
  logger.debug(`[IPC] ${fn}`, args);
  return next(fn, args);
};

const withErrorTransform: Middleware = (next) => async (fn, args) => {
  try {
    return await next(fn, args);
  } catch (e) {
    const msg = e instanceof Error ? e.message
      : typeof e === 'string' ? e
      : e && typeof e === 'object' ? JSON.stringify(e)
      : String(e);
    logger.error(`[IPC:${fn}] ${msg}`);
    throw new Error(msg);
  }
};

const compose = (middlewares: Middleware[]): Next =>
  middlewares.reduceRight((acc, mw) => mw(acc), core);

/**
 * 调用 Rust 后端命令（经过中间件链：日志 + 错误转换）
 * @param fn Rust 命令名称
 * @param args 命令参数
 * @param options Tauri invoke 选项（可选）
 * @returns Rust 命令返回结果
 */
export const invokeRust = async (
  fn: string,
  args: InvokeArgs = {},
  options?: InvokeOptions
): Promise<any> => {
  return compose([withContractCheck, withLogging, withErrorTransform])(
    fn,
    options ? { ...args } : args
  );
};
