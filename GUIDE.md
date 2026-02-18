# Minecraft 启动器项目 - 组件创建指南

本指南将帮助您了解如何在这个 Tauri + React + shadcn UI 项目中创建和使用自定义组件。

## 项目结构概述

```
s1yle-launcher/
├── src/
│   ├── components/
│   │   ├── game/           # 游戏相关组件
│   │   │   └── GameInstanceCard.tsx  # 游戏实例卡片组件
│   │   └── ui/             # shadcn UI 组件
│   ├── lib/
│   │   └── utils.ts        # 工具函数
│   └── styles/
│       └── globals.css     # 全局样式
└── components.json         # shadcn UI 配置
```

## 如何创建新组件

### 步骤 1：创建组件文件夹和文件

```bash
# 在 src/components/ 下创建新文件夹
mkdir -p src/components/your-feature

# 创建组件文件
touch src/components/your-feature/YourComponent.tsx
```

### 步骤 2：编写组件模板

以下是一个完整的组件示例模板：

```typescript
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button"; // 导入 shadcn 组件

// 1. 定义 TypeScript 接口
export interface YourComponentProps {
  title: string;
  value: number;
  onUpdate?: (newValue: number) => void;
}

// 2. 创建组件函数
export function YourComponent({ 
  title, 
  value, 
  onUpdate 
}: YourComponentProps) {
  // 3. 使用 React 状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 4. 定义事件处理函数
  const handleClick = async () => {
    setIsLoading(true);
    try {
      // 5. 调用 Tauri 后端命令
      const result = await invoke("your_rust_command", { 
        param: value 
      });
      
      onUpdate?.(Number(result));
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 6. 返回 JSX
  return (
    <div className={cn(
      "rounded-lg border p-4",
      "hover:bg-accent/50 transition-colors"
    )}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">
        当前值: {value}
      </p>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "处理中..." : "更新"}
      </Button>
    </div>
  );
}
```

### 步骤 3：在 App.tsx 中使用组件

```typescript
import { YourComponent } from "@/src/components/your-feature/YourComponent";

function App() {
  const [value, setValue] = useState(0);
  
  const handleUpdate = (newValue: number) => {
    setValue(newValue);
    console.log("值已更新:", newValue);
  };
  
  return (
    <div>
      <YourComponent
        title="示例组件"
        value={value}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
```

## 与 Tauri Rust 后端通信

### 前端调用 (TypeScript)

```typescript
import { invoke } from "@tauri-apps/api/core";

// 调用 Rust 命令
const result = await invoke("command_name", {
  param1: "value1",
  param2: 123
});
```

### 后端处理 (Rust)

在 `src-tauri/src/lib.rs` 中添加：

```rust
#[tauri::command]
fn command_name(param1: String, param2: i32) -> String {
    format!("收到参数: {}, {}", param1, param2)
}

// 在 run() 函数中注册命令
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            command_name  // 添加新命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## shadcn UI 组件使用技巧

### 1. 使用 class-variance-authority 创建变体

```typescript
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

### 2. 使用 cn() 工具函数组合类名

```typescript
import { cn } from "@/src/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  anotherCondition && "another-class"
)}>
  内容
</div>
```

## 组件设计最佳实践

### 1. 单一职责原则
- 每个组件只做一件事
- 复杂的组件拆分为多个小组件

### 2. Props 设计
- 使用明确的接口定义 Props
- 提供合理的默认值
- 使用可选参数 (`?:`) 增加灵活性

### 3. 状态管理
- 使用 React 的 `useState` 管理内部状态
- 使用回调函数 (`onEvent`) 与父组件通信
- 对于复杂状态考虑使用状态管理库

### 4. 错误处理
- 使用 try-catch 处理异步操作
- 提供用户友好的错误反馈
- 记录错误日志

## 示例：创建新的游戏组件

### 实例管理组件

```typescript
// src/components/game/InstanceManager.tsx
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderPlus, Trash2, Edit } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/src/components/ui/dialog";

export function InstanceManager() {
  const [instances, setInstances] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const createInstance = async (name: string) => {
    try {
      await invoke("create_instance", { name });
      setInstances([...instances, name]);
    } catch (error) {
      console.error("创建失败:", error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">实例管理</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="size-4 mr-2" />
              新建实例
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* 创建实例表单 */}
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-2">
        {instances.map((instance) => (
          <div key={instance} className="flex items-center justify-between p-3 border rounded-lg">
            <span>{instance}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Edit className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 调试和测试

### 开发服务器

```bash
# 启动开发服务器
pnpm tauri dev

# 查看控制台日志
# 在浏览器中按 F12 打开开发者工具
```

### TypeScript 检查

```bash
# 运行 TypeScript 类型检查
pnpm tsc --noEmit

# 或使用 VSCode 的内置类型检查
```

## 扩展建议

### 1. 添加更多组件
- 设置页面组件
- 账户管理组件
- 下载管理组件
- 游戏日志查看器

### 2. 集成 Rust 功能
- 文件系统操作
- 网络请求
- 系统托盘
- 自动更新

### 3. 优化用户体验
- 添加加载状态
- 实现拖放功能
- 添加快捷键支持
- 改善响应式设计

## 资源链接

- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [shadcn UI 文档](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

---

**提示**: 项目已配置好完整的开发环境，直接运行 `pnpm tauri dev` 即可开始开发。所有组件都支持热重载，修改代码后会自动更新。