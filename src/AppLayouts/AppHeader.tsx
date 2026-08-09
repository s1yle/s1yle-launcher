import { DynamicIsland, FloatingControls } from "../components/common"
import Header from "../components/Header"
import { RouteConfig } from "../router/models"
import { UIMode } from "../stores/uiModeStore"

/** AppHeader 组件的 Props */
export interface AppHeaderProps {
  mode: UIMode,
  currentRoute: RouteConfig | undefined
  handleMenuClick: (targetPath: string) => void
  /** 是否处于全屏模式（隐藏灵动岛导航） */
  isFullscreen?: boolean
}

/** 应用顶部导航栏 - 灵动岛模式或经典模式标题 */
const AppHeader = ({
  mode = UIMode.ISLAND,
  currentRoute,
  handleMenuClick,
  isFullscreen = false,
}: AppHeaderProps) => {

  if (mode == UIMode.ISLAND) {
    if (isFullscreen) {
      // 全屏模式：隐藏灵动岛导航，仅保留窗口控制按钮
      return <FloatingControls />
    }

    return (
      <>
        {/* 灵动岛模式 */}
        <FloatingControls />
        <DynamicIsland onMenuClick={handleMenuClick} />

        {/* 顶部拖曳区域 - 覆盖灵动岛两侧的空间 */}
        <div
          className="fixed top-0 left-0 right-0 h-20 z-40 
            bg-(--color-bg-surface) border-b border-(--color-border)
          "
          data-tauri-drag-region="true"
        >
          <div className="absolute inset-0" data-tauri-drag-region />
        </div>
      </>
    )
  }


  return (
    <>
      {mode == UIMode.CLASSIC && (
        <Header type={currentRoute?.header.type === 'main' ? 'main' : 'sub'} title={currentRoute?.header.title || "未知"} />
      )}
    </>
  )
}

export default AppHeader;
