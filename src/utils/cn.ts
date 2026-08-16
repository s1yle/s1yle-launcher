import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合并 className：clsx 条件合并 + tailwind-merge 冲突去重 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
