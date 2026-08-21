import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { JavaInstallation } from "./types/java";
import { logger } from "@/helper/logger";

/**
 * 扫描系统中已安装的 Java 运行环境
 * @param options Tauri invoke 选项
 * @returns Java 安装信息列表
 */
export const invokeScanJavaInstallations = async (
  options?: InvokeOptions
): Promise<JavaInstallation[]> => {
  logger.info("准备调用 scan_java_installations");
  const start = performance.now();
  try {
    const result = await invokeRust('scan_java_installations', {}, options);
    logger.info(`scan_java_installations 耗时 ${(performance.now() - start).toFixed(1)}ms`);
    return result;
  } catch (e) {
    logger.warn(`scan_java_installations 耗时 ${(performance.now() - start).toFixed(1)}ms（失败）`);
    throw e;
  }
};
