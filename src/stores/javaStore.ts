import { JavaInstallation } from "@/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Java Store 的属性接口 */
export interface JavaStoreProrps {
  /** 当前选中的 Java 安装 */
  curJava: JavaInstallation | null,
  /** 所有已发现的 Java 安装列表 */
  javas: JavaInstallation[] | null,
}

/** Java Store 的完整状态接口，包含 setter 方法 */
export interface JavaStoreState extends JavaStoreProrps {
  /** 设置当前选中的 Java */
  setCurJava: (java: JavaInstallation) => void;
  /** 设置 Java 安装列表 */
  setJavas: (javas: JavaInstallation[]) => void;
}

/**
 * Java 安装管理 Store
 *
 * 管理 Java 运行时的发现和选择。
 * 用户偏好持久化存储到 localStorage。
 */
const useJavaStore = create<JavaStoreState>()(
  persist(
    (set) => ({
      curJava: null,
      javas: null,
      setJavas: (javas: JavaInstallation[]) => {
        set({ javas });
      },
      setCurJava: (java: JavaInstallation) => {
        set({ curJava: java })
      },
    }),
    {
      name: 'java-storage',
      partialize: (state) => ({
        curJava: state.curJava,
        javas: state.javas,
      }),
    }
  )
)

/** Java 安装管理 Store 默认导出 */
export default useJavaStore;
