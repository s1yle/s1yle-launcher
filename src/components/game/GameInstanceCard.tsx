import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Package, Cpu, HardDrive, Clock } from "lucide-react";
import { 
  Item, 
  ItemMedia, 
  ItemContent, 
  ItemTitle, 
  ItemDescription, 
  ItemActions, 
  ItemGroup 
} from "../ui/item";

export interface GameInstance {
  id: string;
  name: string;
  version: string;
  minecraftVersion: string;
  modLoader: "Vanilla" | "Fabric" | "Forge" | "Quilt";
  memoryAllocated: string;
  gameDirectory: string;
  lastPlayed?: string;
}

interface GameInstanceCardProps {
  instance: GameInstance;
  onLaunch?: (instanceId: string) => void;
}

export function GameInstanceCard({ instance, onLaunch }: GameInstanceCardProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [status, setStatus] = useState<"idle" | "launching" | "running" | "error">("idle");

  const handleLaunch = async () => {
    setIsLaunching(true);
    setStatus("launching");
    
    try {
      // 调用Rust后端的启动命令
      await invoke("launch_minecraft", {
        instanceId: instance.id,
        gamePath: instance.gameDirectory,
        memory: instance.memoryAllocated
      });
      
      setStatus("running");
      onLaunch?.(instance.id);
    } catch (error) {
      console.error("启动失败:", error);
      setStatus("error");
    } finally {
      setIsLaunching(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle": return "bg-gray-200";
      case "launching": return "bg-yellow-500";
      case "running": return "bg-green-500";
      case "error": return "bg-red-500";
      default: return "bg-gray-200";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle": return "就绪";
      case "launching": return "启动中...";
      case "running": return "运行中";
      case "error": return "启动失败";
      default: return "就绪";
    }
  };

  const getModLoaderColor = () => {
    switch (instance.modLoader) {
      case "Vanilla": return "bg-blue-100 text-blue-800";
      case "Fabric": return "bg-purple-100 text-purple-800";
      case "Forge": return "bg-orange-100 text-orange-800";
      case "Quilt": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Item variant="outline" className="hover:bg-accent/50 transition-colors">
      <ItemMedia variant="icon" className="relative">
        <div className="relative">
          <Package className="size-6 text-primary" />
          <div 
            className={`absolute -top-1 -right-1 size-3 rounded-full ${getStatusColor()} border-2 border-background`}
            title={getStatusText()}
          />
        </div>
      </ItemMedia>
      
      <ItemContent className="flex-1">
        <div className="flex items-center justify-between">
          <ItemTitle className="text-lg font-semibold">
            {instance.name}
          </ItemTitle>
          <span className={`px-2 py-1 text-xs rounded-full ${getModLoaderColor()}`}>
            {instance.modLoader}
          </span>
        </div>
        
        <ItemDescription className="space-y-1 mt-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Package className="size-3 text-muted-foreground" />
              <span>MC {instance.minecraftVersion}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Cpu className="size-3 text-muted-foreground" />
              <span>{instance.memoryAllocated}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <HardDrive className="size-3 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{instance.gameDirectory.split('/').pop()}</span>
            </div>
            
            {instance.lastPlayed && (
              <div className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                <span>{instance.lastPlayed}</span>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <div className="text-xs text-muted-foreground">
              版本: {instance.version} • ID: {instance.id.substring(0, 8)}
            </div>
          </div>
        </ItemDescription>
      </ItemContent>
      
      <ItemActions>
        <button
          onClick={handleLaunch}
          disabled={isLaunching || status === "running"}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
            transition-colors focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2
            ${isLaunching || status === "running" 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          `}
        >
          <Play className={`size-4 ${isLaunching ? "animate-spin" : ""}`} />
          {isLaunching ? "启动中..." : status === "running" ? "已启动" : "启动游戏"}
        </button>
      </ItemActions>
    </Item>
  );
}

// 示例数据生成函数，用于演示
export function createSampleInstances(): GameInstance[] {
  return [
    {
      id: "1",
      name: "生存模式冒险",
      version: "1.20.1",
      minecraftVersion: "1.20.1",
      modLoader: "Vanilla",
      memoryAllocated: "4GB",
      gameDirectory: "/games/minecraft/survival",
      lastPlayed: "2小时前"
    },
    {
      id: "2",
      name: "科技整合包",
      version: "1.18.2-fabric-0.14.24",
      minecraftVersion: "1.18.2",
      modLoader: "Fabric",
      memoryAllocated: "6GB",
      gameDirectory: "/games/minecraft/techpack",
      lastPlayed: "昨天"
    },
    {
      id: "3",
      name: "魔法世界",
      version: "1.19.2-forge-43.2.0",
      minecraftVersion: "1.19.2",
      modLoader: "Forge",
      memoryAllocated: "8GB",
      gameDirectory: "/games/minecraft/magicworld",
      lastPlayed: "3天前"
    },
    {
      id: "4",
      name: "轻量体验",
      version: "1.20.4-quilt-5.0.0",
      minecraftVersion: "1.20.4",
      modLoader: "Quilt",
      memoryAllocated: "2GB",
      gameDirectory: "/games/minecraft/lightweight"
    }
  ];
}