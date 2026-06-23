import { DynamicIsland, FloatingControls } from "../components/common"
import Header from "../components/Header"
import { RouteConfig } from "../router/models"
import { UIMode } from "../stores/uiModeStore"

export interface AppHeaderProps {
  mode: UIMode,
  currentRoute: RouteConfig | undefined
  handleMenuClick: (targetPath: string) => void
}

const AppHeader = ({
  mode = UIMode.ISLAND,
  currentRoute,
  handleMenuClick,
}: AppHeaderProps) => {

  if (mode == UIMode.ISLAND) {
    return (
      <>
        {/* 灵动岛模式 */}
        <FloatingControls />
        <DynamicIsland onMenuClick={handleMenuClick} />

        {/* 顶部拖曳区域 - 覆盖灵动岛两侧的空间 */}
        <div
          // 纠结：到底是要背景色区分开好，还是不许分开好？？？？
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
