import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { logger } from "@/helper/logger";

type Next = (fn: string, args: InvokeArgs) => Promise<any>;
type Middleware = (next: Next) => Next;

const core: Next = async (fn, args) => {
  if (!fn?.trim()) throw new Error("Rust 函数名不能为空");
  return invoke(fn, args);
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
  return compose([withLogging, withErrorTransform])(
    fn,
    options ? { ...args } : args
  );
};

/** {@link invokeRust} 的别名 */
export const invokeRustFunction = invokeRust;
