import { JavaInstallation } from "@/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface JavaStoreProrps {
  curJava: JavaInstallation | null,
  javas: JavaInstallation[] | null,
}

export interface JavaStoreState extends JavaStoreProrps {
  setCurJava: (java: JavaInstallation) => void;
  setJavas: (javas: JavaInstallation[]) => void;
}

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
      name: 'java_storage',
      partialize: (state) => ({
        curJava: state.curJava,
        javas: state.javas,
      }),
    }
  )
)

export default useJavaStore;
