import { invokeRust } from "./client";

/** 系统信息（Rust get_system_info 返回，字段为 snake_case） */
export interface SystemInfo {
  /** 操作系统名称 */
  os: string;
  /** CPU 架构 */
  arch: string;
  /** 启动器数据目录（.wecraft），用于访问全局兜底图标 */
  wecraft_dir: string;
}

/** 测试 Rust 后端通信（greet 命令） */
export const invokeGreet = async (name: string): Promise<string> => {
  return invokeRust("greet", { name });
};

/** 获取系统信息 */
export const invokeGetSystemInfo = async (): Promise<SystemInfo> => {
  return invokeRust("get_system_info");
};

/** 选择背景图片，返回文件路径（用户取消返回 null） */
export const invokeSelectBackgroundImage = async (): Promise<string | null> => {
  return invokeRust("select_background_image");
};