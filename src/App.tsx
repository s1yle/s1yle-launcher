import { useState } from "react";
import { createSampleInstances } from "./components/game/GameInstanceCard";
import { ItemGroup } from "./components/ui/item";
import { Plus, BookOpen, Terminal, Download, Settings } from "lucide-react";
import "./App.css";

function App() {
  const [instances] = useState(createSampleInstances());
  const [activeTab, setActiveTab] = useState("instances");

  const handleInstanceLaunch = (instanceId: string) => {
    console.log(`实例 ${instanceId} 已启动`);
    // 这里可以添加全局状态更新或其他逻辑
  };

  const renderInstancesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">我的游戏实例</h2>
          <p className="text-muted-foreground">
            管理您的 Minecraft 实例，点击启动按钮开始游戏
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="size-4" />
          添加实例
        </button>
      </div>

      <ItemGroup className="space-y-3">
        {/* {instances.map((instance) => (
          <GameInstanceCard
            key={instance.id}
            instance={instance}
            onLaunch={handleInstanceLaunch}
          />
        ))} */}
      </ItemGroup>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-2">💡 如何添加更多实例？</h3>
        <p className="text-sm text-muted-foreground mb-4">
          1. 点击上方"添加实例"按钮创建新实例<br />
          2. 或手动将游戏文件夹拖放到此处<br />
          3. 支持的版本: Vanilla, Fabric, Forge, Quilt
        </p>
      </div>
    </div>
  );

  const renderComponentsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">组件示例</h2>
        <p className="text-muted-foreground">
          这是一个演示如何创建和使用自定义组件的示例
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">GameInstanceCard 组件</h4>
              <p className="text-sm text-muted-foreground">src/components/game/GameInstanceCard.tsx</p>
            </div>
          </div>
          <p className="text-sm">
            这个组件展示了如何：
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>使用 shadcn UI 的 Item 组件作为基础</li>
              <li>与 Tauri Rust 后端通信</li>
              <li>管理组件状态和交互</li>
              <li>使用 TypeScript 接口定义类型</li>
            </ul>
          </p>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Terminal className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">创建新组件的步骤</h4>
              <p className="text-sm text-muted-foreground">快速入门指南</p>
            </div>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary"></div>
              <span>在 src/components/ 下创建新文件夹</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary"></div>
              <span>定义 TypeScript 接口和组件</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary"></div>
              <span>导入并使用 shadcn UI 组件</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary"></div>
              <span>添加 Tauri 命令调用（可选）</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "instances", label: "游戏实例", icon: <Download className="size-4" /> },
    { id: "components", label: "组件示例", icon: <BookOpen className="size-4" /> },
    { id: "settings", label: "设置", icon: <Settings className="size-4" />, disabled: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-bold text-primary-foreground">MC</span>
              </div>
              <h1 className="text-xl font-bold">S1yle Minecraft 启动器</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 rounded-lg border hover:bg-accent">
                账户
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex border-b mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px
                transition-colors relative
                ${tab.disabled ? "opacity-50 cursor-not-allowed" : "hover:text-primary"}
                ${activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "instances" && renderInstancesTab()}
          {activeTab === "components" && renderComponentsTab()}
          {activeTab === "settings" && (
            <div className="py-12 text-center">
              <h3 className="text-xl font-semibold">设置页面开发中</h3>
              <p className="text-muted-foreground mt-2">此功能正在开发中...</p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            基于 Tauri + React + shadcn UI 构建 • 
            使用 <code className="bg-muted px-1 rounded">pnpm tauri dev</code> 启动开发服务器
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;