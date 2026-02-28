import { invokeLogger } from "./rustInvoke";

// 日志级别类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 统一日志工具
export const logger = {
  /** 调试日志 */
  debug: (message: string, ...args: any[]) => log('debug', message, args),
  /** 普通信息 */
  info: (message: string, ...args: any[]) => log('info', message, args),
  /** 警告 */
  warn: (message: string, ...args: any[]) => log('warn', message, args),
  /** 错误 */
  error: (message: string, ...args: any[]) => log('error', message, args),
};

// 内部实现：转发到 Rust，失败时降级到 console
async function log(level: LogLevel, message: string, args: any[]) {
  const fullMessage = args.length > 0 
    ? `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}`
    : message;

  try {
    // 转发到 Rust 端
    await invokeLogger({ level, message: fullMessage });
  } catch (e) {
    // 降级：如果转发失败，还是用 console 输出
    console[level](`[Frontend Fallback] ${fullMessage}`);
  }
}