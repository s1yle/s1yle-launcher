import { create } from "zustand";
import { invokeSetConfigValue } from "@/api/config";
import { logger } from "@/helper/logger";

const SETUP_DONE_KEY = "wecraft_setup_done";

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

interface FirstRunState {
  /** 是否显示迎新界面：true 显示，false 不显示（持久化于配置层 L2） */
  firstRun: boolean;
  /** 是否已完成首次账户引导（保持原 localStorage 逻辑） */
  setupDone: boolean;
  /** 启动引导阶段用配置值初始化 firstRun（不落盘） */
  initFirstRun: (v: boolean) => void;
  /** 标记迎新结束并持久化到配置层 */
  setFirstRun: (v: boolean) => void;
  /** 标记首次账户引导完成 */
  markDone: () => void;
}

/**
 * 迎新 / 首次引导标志位。
 * firstRun 持久化于启动器配置文件（L2，随卸载清除），不再写入 localStorage，
 * 以免卸载后残留导致重装后跳过迎新。
 */
export const useFirstRunStore = create<FirstRunState>((set) => ({
  firstRun: true,
  setupDone: readBool(SETUP_DONE_KEY),
  initFirstRun: (v) => set({ firstRun: v }),
  setFirstRun: (v) => {
    void invokeSetConfigValue("first_run", v).catch((e) =>
      logger.warn("写入 first_run 配置失败", e)
    );
    set({ firstRun: v });
  },
  markDone: () => {
    try {
      localStorage.setItem(SETUP_DONE_KEY, "true");
    } catch {
      // 忽略写入失败，内存态仍置为已完成
    }
    set({ setupDone: true });
  },
}));
