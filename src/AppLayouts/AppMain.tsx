import { useCallback, useEffect, useRef, useState } from "react";
import RouterRenderer from "../components/RouterRenderer"
import useLayoutStore, { LAYOUT_DEBOUNCE_DURATION, SIDEBAR_TRANSITION_DURATION } from "@/stores/layoutStore";
import { debounce } from "@/utils/configUtils";
import { useBackgroundStore } from "@/stores/backgroundStore";

export interface AppMainProps {
  hasOwnSidebar: boolean;
  isSidebarCollapsed: boolean;
}

const AppMain = ({
  hasOwnSidebar = false,
  isSidebarCollapsed = false,
}: AppMainProps) => {

  const width = useLayoutStore((s) => s.sidebarWidth)
  const appliedWidthRef = useRef(width);
  const [appliedWidth, setAppliedWidth] = useState(width);

  // 使用防抖函数优化侧边栏宽度变化时的响应
  // 当宽度频繁变化时（如拖拽调整），避免频繁触发状态更新
  const debouncedSetWidth = useCallback(
    debounce((newWidth: number) => {
      appliedWidthRef.current = newWidth;
      setAppliedWidth(newWidth);
    }, LAYOUT_DEBOUNCE_DURATION * 1000),
    []
  );

  useEffect(() => {
    // 如果宽度发生变化，立即更新 ref 和 state
    if (appliedWidthRef.current !== width) {
      appliedWidthRef.current = width;
      setAppliedWidth(width);
    }
    // 同时启动防抖以处理连续变化
    debouncedSetWidth(width);
  }, [width, debouncedSetWidth]);

  const isCustomBg = useBackgroundStore((s) => s.config.type !== 'none');
  const paddingLeft = hasOwnSidebar && !isSidebarCollapsed ? appliedWidth : 0;

  return (
    <>
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-custom"
        style={{
          background: isCustomBg ? 'transparent' : 'var(--color-bg-secondary)',
          height: '100%',
          paddingLeft,
          transition: `padding-left ${SIDEBAR_TRANSITION_DURATION}s ease-in-out`,
        }}
      >
        <RouterRenderer />
      </main>
    </>
  )
}

export default AppMain;
