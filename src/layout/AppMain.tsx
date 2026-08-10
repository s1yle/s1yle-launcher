import RouterRenderer from "../components/RouterRenderer"
import useLayoutStore from "@/stores/layoutStore";
import { useBackgroundStore } from "@/stores/backgroundStore";
import { DURATION } from "@/utils/animations";

/** AppMain 组件的 Props */
export interface AppMainProps {
  showSidebar: boolean;
  sidebarElement?: React.ReactNode;
}

/** 应用主内容区域 - 包含 RouterRenderer */
const AppMain = ({
  showSidebar = false,
  sidebarElement,
}: AppMainProps) => {
  const width = useLayoutStore((s) => s.sidebarWidth);
  const isCustomBg = useBackgroundStore((s) => s.config.type !== 'none');

  return (
    <main
      className="flex-1 overflow-hidden relative"
      style={{
        background: isCustomBg ? 'transparent' : 'var(--color-bg-secondary)',
      }}
    >
      <RouterRenderer
        sidebar={sidebarElement}
        showSidebar={showSidebar}
        sidebarWidth={width}
        sidebarTransitionDuration={DURATION.SIDEBAR_TRANSITION}
      />
    </main>
  )
}

export default AppMain;
