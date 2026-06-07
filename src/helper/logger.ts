type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logger = {
  debug: (message: string, ...args: any[]) => log('debug', message, args),
  info: (message: string, ...args: any[]) => log('info', message, args),
  warn: (message: string, ...args: any[]) => log('warn', message, args),
  error: (message: string, ...args: any[]) => log('error', message, args),
};

function log(level: LogLevel, message: string, args: any[]) {
  const fullMessage = args.length > 0
    ? `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}`
    : message;
  console[level](fullMessage);
}