import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { JavaInstallation } from "./types/java";
import { logger } from "@/helper/logger";

export const invokeScanJavaInstallations = async (
  options?: InvokeOptions
): Promise<JavaInstallation[]> => {
  logger.info("准备调用 scan_java_installations");
  return invokeRust('scan_java_installations', {}, options);
};

