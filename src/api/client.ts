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

export const invokeRustFunction = invokeRust;
