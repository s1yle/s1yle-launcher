# WeCraft! Launcher - 文档维护规范

> **版本**: 1.0  
> **生效日期**: 2026-05-18  
> **适用范围**: 所有项目文档（AGENTS.md + docs/*.md）

---

## 一、文档分层架构

### 1.1 三层文档体系

```
Level 1: AGENTS.md (快速参考)
    ├─ 定位：开发者快速查阅的备忘录
    ├─ 规模：控制在 800 行以内
    ├─ 更新频率：高（每次重构后更新）
    ─ 内容：核心概念、常用命令、关键路径

Level 2: docs/*.md (详细文档)
    ├─ 定位：系统性学习和深度参考
    ├─ 规模：每个文件 300-600 行
    ├─ 更新频率：中（重大功能更新时）
    └─ 内容：架构设计、组件 API、使用示例

Level 3: 代码注释 (JSDoc/Rust doc)
    ├─ 定位：即时更新的开发文档
    ├─ 规模：与代码同步
    ├─ 更新频率：每次代码提交
    └─ 内容：函数说明、参数解释、返回值
```

### 1.2 文档职责边界

| 文档层级 | 应该包含 | 不应该包含 |
|---------|---------|-----------|
| **AGENTS.md** | 核心路由、状态管理表、配置示例、注意事项 | 详细实现代码、历史变更记录、完整 API 列表 |
| **docs/architecture.md** | 架构图、目录结构、配置系统详解 | 具体组件用法、API 调用示例 |
| **docs/components.md** | 组件 Props 接口、使用示例 | 组件内部实现细节 |
| **docs/api.md** | API 调用示例、错误处理 | Rust 后端实现细节 |
| **docs/changelog.md** | 重大重构、新功能、Breaking Changes | 日常 bug 修复、代码优化 |

---

## 二、文档更新触发条件

### 2.1 必须更新文档的场景

#### 🟢 高优先级（立即更新）

1. **新增/删除路由**
   ```markdown
   触发条件：router/config.tsx 变更
   更新文件：AGENTS.md §4 + docs/architecture.md §5
   更新内容：路由表、已移除页面列表
   ```

2. **新增/删除 Zustand Store**
   ```markdown
   触发条件：src/stores/ 目录变更
   更新文件：AGENTS.md §5 + docs/architecture.md §4
   更新内容：Store 表格、使用示例
   ```

3. **配置系统变更**
   ```markdown
   触发条件：config/index.ts 或 config/types.ts 变更
   更新文件：AGENTS.md §6 + docs/architecture.md §3
   更新内容：配置项列表、使用示例
   ```

4. **新增通用组件**
   ```markdown
   触发条件：src/components/common/ 新增组件
   更新文件：AGENTS.md §8 + docs/components.md
   更新内容：组件列表、Props 接口、使用示例
   ```

5. **后端 API 变更**
   ```markdown
   触发条件：src-tauri/src/commands/ 或 src/helper/rustInvoke.ts 变更
   更新文件：AGENTS.md §7 + docs/api.md
   更新内容：API 命令表、调用示例
   ```

####  中优先级（本周内更新）

1. **UI 架构重大调整**
   ```markdown
   触发条件：布局组件重构（如灵动岛系统）
   更新文件：AGENTS.md §9 + docs/architecture.md §6
   更新内容：布局结构图、切换逻辑
   ```

2. **编码规范更新**
   ```markdown
   触发条件：代码审查中发现的共性问题
   更新文件：AGENTS.md §10
   更新内容：命名规范、最佳实践
   ```

3. **注意事项新增**
   ```markdown
   触发条件：遇到难以排查的 Bug 或踩坑
   更新文件：AGENTS.md §12
   更新内容：避坑指南、解决方案
   ```

#### 🔵 低优先级（月度整理）

1. **技术栈版本升级**
   ```markdown
   触发条件：package.json 或 Cargo.toml 重大版本更新
   更新文件：AGENTS.md §2
   更新内容：技术栈列表
   ```

2. **目录结构调整**
   ```markdown
   触发条件：src/ 或 src-tauri/src/ 目录重构
   更新文件：AGENTS.md §3 + docs/architecture.md §2
   更新内容：目录树
   ```

#### ⭐ AI 全权实现功能

**触发条件**：AI 完成某个功能的完整实现后

**文档更新流程**：
```markdown
AI 实现完成
    ↓
AI 输出文档更新建议清单
    ↓
开发者审查代码 + 测试功能
    ↓
开发者根据清单更新文档
    ├─ Level 1: AGENTS.md（新增路由/Store/组件）
    ├─ Level 2: docs/*.md（详细实现说明）
    └─ Level 3: 代码注释（JSDoc/Rust doc）
    ↓
在 changelog.md 中记录
```

**AI 的责任**：
- 列出所有新增/修改的文件
- 指出需要更新文档的位置
- 提供文档更新建议内容
- 标注文档更新优先级

**开发者的责任**：
- 审查代码质量（类型定义、命名规范）
- 测试功能是否正常（路由、API、UI）
- 根据 AI 建议更新文档
- 在 changelog.md 中记录本次实现

**示例**：
```markdown
AI 实现玩家管理页面后，输出：

📋 文档更新建议

高优先级（必须更新）：
1. AGENTS.md §4 核心路由
   - 添加：/admin/players
2. AGENTS.md §5 状态管理
   - 添加：playerStore 到表格
3. docs/architecture.md §2 目录结构
   - 新增：src/pages/admin/Players.tsx

中优先级（建议更新）：
1. docs/components.md
   - 新增：PlayerList, PlayerItem 组件文档
2. docs/api.md
   - 新增：get_players, add_player 调用示例

低优先级（可选更新）：
1. docs/changelog.md
   - 记录本次功能实现
```

---

## 三、文档更新流程

### 3.1 标准更新流程

```
代码变更完成
    ↓
是否触发文档更新？
    ├─ 是 → 确定更新层级
    │   ├─ Level 1: AGENTS.md
    │   └─ Level 2: docs/*.md
    ↓
更新相关章节
    ↓
检查链接有效性
    ↓
检查与其他文档一致性
    ↓
提交文档变更
```

### 3.2 更新检查清单

#### AGENTS.md 更新检查

- [ ] 章节编号是否连续
- [ ] 链接是否指向实际文件
- [ ] **是否使用相对路径**（禁止使用 `file:///` 绝对路径）
- [ ] 代码示例是否可运行
- [ ] 路由表是否与实际一致
- [ ] Store 表格是否完整
- [ ] 注意事项是否包含最新踩坑

#### docs/*.md 更新检查

- [ ] 是否与 AGENTS.md 中的摘要一致
- [ ] 是否包含完整的使用示例
- [ ] Props/类型定义是否准确
- [ ] 架构图是否需要更新
- [ ] 是否添加了相关文档交叉引用

### 3.3 文档一致性验证

**自动化检查建议**（未来可添加到 CI/CD）：

```bash
# 检查 AGENTS.md 中的文件链接是否有效
grep -oP 'file://[^\)]+' AGENTS.md | while read link; do
  filepath=$(echo "$link" | sed 's/file:\/\///' | cut -d'#' -f1)
  if [ ! -f "$filepath" ]; then
    echo "❌ 无效链接：$link"
    exit 1
  fi
done

# 检查 docs/ 目录中的交叉引用
grep -r 'docs/.*\.md' docs/ | while read line; do
  # 验证链接有效性
  ...
done
```

---

## 四、文档编写规范

### 4.1 文件路径引用

**核心原则**: 所有文档引用必须使用相对路径，禁止使用绝对路径

```markdown
✅ 正确：
- 同目录文件：[`architecture.md`](architecture.md)
- 子目录文件：[`docs/architecture.md`](docs/architecture.md)
- 父目录文件：[`../src/helper/rustInvoke.ts`](../src/helper/rustInvoke.ts)
- 源码文件：[`src/router/config.tsx`](src/router/config.tsx)

❌ 错误：
- 模糊路径：见 docs 文件夹
- 错误格式：[architecture](docs/architecture)
- 绝对路径：[`src/router/config.tsx`](src/router/config.tsx)
```

**路径规范**:
- 从 `AGENTS.md` 引用 `docs/` 文件：使用 `docs/filename.md`
- 从 `docs/*.md` 引用同级文件：使用 `filename.md`
- 从 `docs/*.md` 引用 `src/` 文件：使用 `../src/path/to/file.tsx`
- 永远不要使用 `file:///` 协议

### 4.2 代码块规范

```markdown
✅ 正确：
```typescript
import { config } from '@/config';
const theme = await config.get('theme.mode');
```

❌ 错误：
```
import { config } from '@/config';  // 无语言标签
const theme = await config.get('theme.mode');
```
```

### 4.3 表格规范

```markdown
✅ 正确：
| Store | 文件 | 用途 |
|-------|------|------|
| `userRoleStore` | `src/stores/userRoleStore.ts` | 用户角色 |

❌ 错误：
| Store | 文件 | 用途 |
|-------|------|------|
| userRoleStore | src/stores/userRoleStore.ts | 用户角色 |
（缺少代码标记 `）
```

### 4.4 图表规范

**ASCII 架构图**（推荐用于 AGENTS.md）：
```
┌─────────────────────────────────────────────┐
│  [最小化] [最大化] [关闭]   ← FloatingControls
│
│        ┌──────────────────┐
│        │  🏝️ 灵动岛导航    │
│        └──────────────────┘
└─────────────────────────────────────────────┘
```

**Mermaid 流程图**（推荐用于 docs/*.md）：
```mermaid
graph LR
  A[用户操作] --> B[Store 更新]
  B --> C[组件重渲染]
  C --> D[UI 更新]
```

---

## 五、文档版本管理

### 5.1 文档头部规范

每个文档必须包含：
```markdown
# 文档标题

> **最后更新**: YYYY-MM-DD  
> **项目版本**: X.Y.Z  
> **适用版本**: >=X.Y.Z  （如有版本限制）
```

### 5.2 变更记录

在 `docs/changelog.md` 中记录：
```markdown
## YYYY-MM-DD - 变更描述

**影响文档**:
- `AGENTS.md` - 更新章节 X
- `docs/architecture.md` - 新增章节 Y

**变更类型**:
- [x] 新增内容
- [ ] 修改内容
- [ ] 删除内容
- [x] 修正错误

**详细说明**:
简要描述变更内容和原因
```

---

## 六、文档审查流程

### 6.1 自我审查清单

在提交文档更新前，作者必须检查：

**内容准确性**:
- [ ] 所有代码示例已测试可运行
- [ ] 所有路径指向实际存在的文件
- [ ] 所有 API 调用与实际一致
- [ ] 所有配置项名称准确无误

**结构完整性**:
- [ ] 章节编号连续
- [ ] 目录结构清晰
- [ ] 图表与文字描述一致
- [ ] 交叉引用正确

**可读性**:
- [ ] 语言简洁明了
- [ ] 示例充分
- [ ] 术语使用一致
- [ ] 格式统一（表格、代码块、列表）

### 6.2 同行审查要点

审查者应关注：
1. **新手友好度**: 是否能让新开发者快速理解
2. **完整性**: 是否遗漏重要信息
3. **一致性**: 是否与其他文档冲突
4. **实用性**: 示例是否贴近实际使用场景

---

## 七、文档维护最佳实践

### 7.1 定期维护

**每周**:
- 检查 AGENTS.md 中的代码示例
- 验证链接有效性

**每月**:
- 审查 docs/*.md 的完整性
- 更新过时的示例
- 清理重复内容

**每季度**:
- 重构文档结构（如需要）
- 收集开发者反馈
- 优化文档导航

### 7.2 文档驱动开发

**推荐流程**:
```
1. 编写/更新文档 (docs/*.md)
2. 根据文档编写代码
3. 更新代码注释 (JSDoc/Rust doc)
4. 更新 AGENTS.md 摘要
5. 提交代码 + 文档
```

**优势**:
- 文档与代码同步
- 减少事后补文档的工作量
- 提高代码质量（文档先行，思路更清晰）

### 7.3 示例代码管理

**推荐做法**:
```typescript
// ✅ 推荐：示例代码单独成文件，可测试
// examples/config-usage.ts
import { config } from '@/config';
const theme = await config.get('theme.mode');

// 在文档中引用
// 见 [`examples/config-usage.ts`](examples/config-usage.ts)
```

**避免做法**:
```typescript
// ❌ 避免：示例代码无法测试
// 直接从代码中复制片段到文档
```

---

## 八、工具与自动化

### 8.1 推荐工具

**文档生成**:
- TypeDoc - 从 TypeScript 生成 API 文档
- rustdoc - Rust 内置文档工具
- Docusaurus - 文档网站生成器（未来可选）

**质量检查**:
- markdownlint - Markdown 语法检查
- prettier - 代码格式化
- link-checker - 链接有效性检查

### 8.2 自动化脚本

**建议添加到 package.json**:
```json
{
  "scripts": {
    "docs:check": "markdownlint AGENTS.md docs/",
    "docs:links": "npx link-checker AGENTS.md docs/",
    "docs:format": "prettier --write AGENTS.md docs/"
  }
}
```

---

## 九、常见问题 FAQ

### Q1: 文档应该多详细？

**A**: 遵循"最小必要"原则：
- AGENTS.md：只包含快速查阅的内容
- docs/*.md：包含完整的使用指南
- 代码注释：解释"为什么"，不是"做什么"

### Q2: 如何保持文档与代码同步？

**A**: 
1. 代码审查时必须检查文档
2. 使用 TypeDoc/rustdoc 自动生成部分文档
3. 定期（每月）审查文档

### Q3: 文档结构何时重构？

**A**: 
- 当文档超过 1000 行时考虑拆分
- 当开发者反馈"找不到信息"时优化导航
- 当重复内容超过 20% 时重组结构

---

## 十、执行与监督

### 10.1 责任人

**文档维护负责人**:
- 审查文档更新
- 组织定期审查
- 收集开发者反馈

**代码审查者**:
- 确保代码变更伴随文档更新
- 验证文档准确性

### 10.2 考核指标

**文档质量指标**:
- 文档覆盖率（有代码就有文档）
- 文档更新及时率（变更后 1 周内）
- 开发者满意度（定期调研）

**文档使用指标**:
- 文档访问频率（如部署文档网站）
- 常见问题引用文档的次数
- 新开发者上手时间

---

## 附录 A：文档模板

### A.1 AGENTS.md 章节模板

```markdown
## X. 章节标题

简要介绍（1-2 句话）

### X.1 子章节

**核心概念**:
- 概念 1
- 概念 2

**使用示例**:
```typescript
// 代码示例
```

**详细说明**: 见 [`docs/file.md`](docs/file.md) §X
```

### A.2 docs/*.md 章节模板

```markdown
# 文档标题

> **最后更新**: YYYY-MM-DD  
> **项目版本**: X.Y.Z

---

## 1. 概述

是什么、为什么、怎么用（3W 原则）

## 2. 核心概念

关键术语和概念解释

## 3. 使用指南

分步骤的使用说明 + 代码示例

## 4. API 参考

完整的 API 列表和参数说明

## 5. 最佳实践

推荐用法和常见陷阱

## 6. 相关文档

- [`docs/related1.md`](related1.md) - 相关主题 1
- [`docs/related2.md`](related2.md) - 相关主题 2
```

---

**本规范自发布之日起生效，所有项目文档维护工作应遵循此规范。**

**维护者**: WeCraft! Launcher 开发团队  
**审查周期**: 每季度审查一次  
**下次审查日期**: 2026-08-18
