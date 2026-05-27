# 文档使用指南 - 快速参考

> **创建日期**: 2026-05-18  
> **用途**: 快速了解如何查阅文档和询问 AI

---


## 📚 文档速查表

| 我想知道... | 查阅文档 | 章节 |
|------------|---------|------|
| 项目用什么技术？ | AGENTS.md | [技术栈](AGENTS.md#tech-stack) |
| 文件放在哪里？ | AGENTS.md | [目录结构](AGENTS.md#directory-structure) |
| 有哪些路由？ | AGENTS.md | [核心路由](AGENTS.md#core-routes) |
| 怎么管理状态？ | AGENTS.md | [状态管理](AGENTS.md#state-management) |
| 怎么配置系统？ | AGENTS.md | [配置系统](AGENTS.md#config-system) |
| 怎么调用后端？ | AGENTS.md | [后端 API](AGENTS.md#backend-api) |
| 有哪些组件？ | AGENTS.md | [通用组件](AGENTS.md#common-components) |
| UI 怎么设计的？ | AGENTS.md | [UI 架构](AGENTS.md#ui-architecture) |
| 代码规范？ | AGENTS.md | [编码规范](AGENTS.md#coding-standards) |
| 注意事项？ | AGENTS.md | [注意事项](AGENTS.md#notes) |
| 架构详解？ | docs/architecture.md | 全部 |
| 组件 API？ | docs/components.md | 按需 |
| 后端 API 详解？ | docs/api.md | 按需 |
| 更新历史？ | docs/changelog.md | 按日期 |
| 怎么维护文档？ | docs/MAINTENANCE.md | 全部 |
| **怎么提问 AI？** | **docs/GUIDE.md** | **全部 ⭐** |
| **AI 怎么更新文档？** | **docs/QUICK_GUIDE.md** | **场景 6 ⭐** |

---


## 🎯 常见场景与解决方案

### 场景 1：想了解项目架构

**查阅顺序**:
1. [`AGENTS.md`](AGENTS.md) [技术栈](AGENTS.md#tech-stack)-[UI 架构](AGENTS.md#ui-architecture) (30 分钟)
2. [`docs/architecture.md`](docs/architecture.md) 全部章节 (1-2 小时)
3. 按需查阅 [`docs/components.md`](docs/components.md) 和 [`docs/api.md`](docs/api.md)

**询问 AI 示例**:
```
"我想了解 WeCraft! Launcher 的状态管理架构，特别是用户角色切换时
如何通知其他组件？已查阅 [状态管理](docs/architecture.md#state-management)，请结合代码说明。"
```

---

### 场景 2：要开发新功能

**查阅顺序**:
1. [`docs/architecture.md`](docs/architecture.md) [目录结构](docs/architecture.md#directory-structure)
2. [`docs/components.md`](docs/components.md) 查找可复用组件
3. [`docs/api.md`](docs/api.md) 了解后端 API
4. [`AGENTS.md`](AGENTS.md) [编码规范](AGENTS.md#coding-standards)

**询问 AI 示例**:
```
"我要添加一个玩家管理页面 (/admin/players)，需要：
1. 新增哪些文件？(参考 [目录结构](docs/architecture.md#directory-structure))
2. 配置哪些路由？(参考 [路由配置](docs/architecture.md#routes))
3. 调用哪些后端 API？(参考 docs/api.md)
请给出完整的实现方案。"
```

---

### 场景 3：遇到 Bug

**排查顺序**:
1. [`AGENTS.md`](AGENTS.md) [注意事项](AGENTS.md#notes)
2. [`docs/architecture.md`](docs/architecture.md) 相关章节
3. 代码注释和源码

**询问 AI 示例**:
```
"问题：配置更新后没有持久化
已尝试：使用 config.set() 方法
已查阅：[配置系统](docs/architecture.md#config-system)
错误信息：无报错，但重启后配置丢失
代码片段：[粘贴代码]
请帮我分析原因。"
```

---

### 场景 4：代码审查

**查阅顺序**:
1. [`AGENTS.md`](AGENTS.md) §10 编码规范
2. [`docs/components.md`](docs/components.md) Props 规范
3. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) 文档更新流程

**询问 AI 示例**:
```
"请审查以下代码（新增的玩家管理页面）：
[粘贴代码]

特别关注：
1. TypeScript 类型定义是否完整
2. 命名是否符合 AGENTS.md [组合优于继承](AGENTS.md#composition-over-inheritance)
3. React 最佳实践
4. 是否需要更新文档"
```

---

### 场景 5：让 AI 全权实现功能 ⭐

**适用场景**:
- ✅ 重复性高的功能（CRUD 页面、列表管理）
- ✅ 标准组件开发（基于现有组件库）
- ✅ 文档驱动的功能实现（需求明确）

**提问模板**:
```markdown
**目标**: 实现 [功能名称]

**需求描述**:
- 功能描述：[详细描述]
- 用户角色：[玩家/服主]
- UI 要求：[参考页面/组件]
- 数据流：[状态管理/API 调用]

**实现范围**:
- [ ] 前端页面和组件
- [ ] 状态管理（Store）
- [ ] 路由配置
- [ ] 后端 API（如需要）
- [ ] 文档更新

**参考文档**:
- docs/architecture.md [目录结构](docs/architecture.md#directory-structure)
- docs/components.md [通用组件](docs/components.md#common-components)

**期望输出**:
1. 完整的代码实现（遵循 AGENTS.md [编码规范](AGENTS.md#coding-standards)）
2. 需要修改的文件列表
3. 文档更新建议
```

**示例**:
```markdown
**目标**: 实现玩家管理页面（服主后台）

**需求描述**:
- 功能描述：服主可以查看玩家列表、添加/删除玩家、设置权限
- 用户角色：服主（admin）
- UI 要求：参考 /admin/servers 页面，使用列表布局 + 弹窗
- 数据流：调用后端 API 获取数据，本地 Store 管理

**实现范围**:
- [x] 前端页面和组件
- [x] 状态管理（playerStore）
- [x] 路由配置（/admin/players）
- [x] 后端 API 调用
- [x] 文档更新

**参考文档**:
- docs/architecture.md [目录结构](docs/architecture.md#directory-structure)
- docs/architecture.md [路由配置](docs/architecture.md#routes)
- docs/components.md [列表项](docs/components.md#list-item), [确认弹窗](docs/components.md#confirm-popup) 组件

**期望输出**:
1. 完整的代码实现（遵循 AGENTS.md [编码规范](AGENTS.md#coding-standards)）
2. 需要修改的文件列表
3. 文档更新建议

**AI 实现后**:
- AI 会输出文档更新建议清单
- 你需要：审查代码 → 测试功能 → 更新文档
- 遵循 docs/MAINTENANCE.md 中的更新流程
```

---


### 场景 6：AI 更新及维护文档 ⭐

**适用场景**:
- ✅ AI 或开发者完成功能实现后，需要更新文档
- ✅ 代码重构后，需要同步文档
- ✅ 发现文档与代码不一致
- ✅ 定期维护文档（季度审查）

**查阅顺序**:
1. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) 全部章节
2. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [文档更新触发条件](docs/MAINTENANCE.md#when-to-update)
3. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [文档更新流程](docs/MAINTENANCE.md#update-process)
4. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [文档状态管理](docs/MAINTENANCE.md#document-status)

**AI 更新文档流程**:
```markdown
AI 完成代码实现
    ↓
AI 输出文档更新建议清单（必须）
    ├─ 高优先级：路由/Store/API 变更
    ├─ 中优先级：组件/配置/规范更新
    └─ 低优先级：目录结构/技术栈版本
    ↓
开发者审查代码 + 测试功能
    ↓
开发者根据清单更新文档
    ├─ Level 1: AGENTS.md（快速参考）
    ├─ Level 2: docs/*.md（详细文档）
    └─ Level 3: 代码注释（JSDoc/Rust doc）
    ↓
在 changelog.md 中记录
    ↓
提交文档变更
```

**AI 输出文档更新建议清单示例**:
```markdown
📋 文档更新建议

高优先级（必须更新）：
1. AGENTS.md [核心路由](AGENTS.md#core-routes)
   - 添加：/admin/players
2. AGENTS.md [状态管理](AGENTS.md#state-management)
   - 添加：playerStore 到表格
3. docs/architecture.md [目录结构](docs/architecture.md#directory-structure)
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

**开发者审查清单**:
```markdown
代码审查：
- [ ] TypeScript 类型定义是否完整
- [ ] 命名是否符合 AGENTS.md [组合优于继承](AGENTS.md#composition-over-inheritance)
- [ ] 组件 Props 是否规范
- [ ] 路由配置是否正确

功能测试：
- [ ] 路由是否可访问
- [ ] API 调用是否正常
- [ ] UI 渲染是否正确
- [ ] 状态管理是否生效

文档更新：
- [ ] AGENTS.md 路由表是否更新
- [ ] AGENTS.md Store 表格是否更新
- [ ] docs/architecture.md 目录结构是否更新
- [ ] docs/components.md 组件文档是否更新
- [ ] docs/api.md API 调用示例是否更新
- [ ] docs/changelog.md 是否记录
- [ ] 代码注释（JSDoc/Rust doc）是否完整
```

**询问 AI 示例**:
```markdown
**背景**: AI 刚刚实现了玩家管理功能，需要更新文档

**AI 输出的更新建议**:
[粘贴 AI 输出的文档更新建议清单]

**具体问题**:
1. 高优先级文档是否完整？
2. 还有哪些文档需要更新？
3. 文档更新的具体内容应该是什么？

**期望答案**: 
1. 完整的文档更新清单
2. 每个文档的具体更新内容
3. 更新后的文档片段示例
```

**文档维护最佳实践**:
```markdown
1. 及时性原则
   ✅ 代码变更后立即更新文档
   ❌ 积累多个变更后再统一更新

2. 一致性原则
   ✅ 文档与代码保持同步
   ❌ 文档描述与实际代码不符

3. 完整性原则
   ✅ 三层文档体系都更新
   ❌ 只更新某一层文档

4. 可追溯原则
   ✅ changelog.md 记录每次变更
   ❌ 没有变更历史记录
```

**文档状态管理**:
```markdown
AI 在查阅或引用方案文档时，必须验证：

验证清单：
- [ ] 文档状态是否为"已实施 ✅"？
- [ ] 文档中提到的核心文件是否存在？
- [ ] 代码中是否有对应的实现？
- [ ] 路由配置中是否有相关路径？
- [ ] 是否有最近 3 个月内的更新？
- [ ] 是否与其他文档冲突？

如果任何一项检查失败：
- 不引用该文档
- 在回答中说明"该方案文档可能过时/未实施"
- 建议用户查阅 docs/archives/ 中的归档文档
```

**相关文档**:
- 完整文档维护规范：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)
- 文档分层架构：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [文档分层](docs/MAINTENANCE.md#document-layers)
- 文档更新触发条件：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [何时更新](docs/MAINTENANCE.md#when-to-update)
- 文档更新流程：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [更新流程](docs/MAINTENANCE.md#update-process)
- 文档状态管理：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) [文档状态](docs/MAINTENANCE.md#document-status)

---

## 💬 提问 AI 模板

### 模板 1：了解概念

```markdown
**背景**: 我是 [新开发者/临时查阅]，想了解 [具体概念]

**已查阅文档**: [列出已阅读的文档章节]

**具体问题**: 
1. [问题 1]
2. [问题 2]

**期望答案**: [概念解释/代码示例/最佳实践]
```

**示例**:
```markdown
**背景**: 我是新开发者，想了解配置系统

**已查阅文档**: 
- AGENTS.md [配置系统](AGENTS.md#config-system)
- docs/architecture.md [配置系统](docs/architecture.md#config-system)

**具体问题**: 
1. L1/L2/L3 三层配置有什么区别？
2. 什么时候用 config.set()，什么时候用 update_value()?

**期望答案**: 概念解释 + 使用场景示例
```

---

### 模板 2：开发功能

```markdown
**目标**: 我要实现 [功能描述]

**需求分析**:
- 前端需要：[组件/Store/路由]
- 后端需要：[API 命令]
- 配置需要：[新增配置项]

**已查阅文档**: [列出文档章节]

**具体问题**:
1. 这个功能应该放在哪个目录？
2. 需要新增哪些文件？
3. 如何与现有代码集成？

**期望答案**: 实现方案 + 代码示例
```

---

### 模板 3：排查问题

```markdown
**问题描述**: [详细描述问题现象]

**已尝试的方法**:
1. [方法 1] - 结果：[成功/失败]
2. [方法 2] - 结果：[成功/失败]

**已查阅文档**: [文档名称] [章节](文档链接#章节锚点)

**代码片段**:
[粘贴代码]

**错误信息**:
[粘贴错误日志]

**期望答案**: 问题分析 + 解决方案
```

---

### 模板 4：代码审查

```markdown
**审查类型**: [新增功能/Bug 修复/重构优化]

**涉及文件**: [文件列表]

**已遵循的规范**:
- AGENTS.md [编码规范](AGENTS.md#coding-standards) ✓
- docs/components.md 组件规范 ✓

**特别关注点**:
1. 类型定义是否完整
2. 性能是否有优化空间
3. 是否有更好的实现方式

**代码**:
[粘贴代码]

**期望答案**: 问题列表 + 改进建议
```

```

---

## ✅ 最佳实践

### 推荐做法

1. **先查阅文档，再提问**
   ```
   遇到问题 → 查阅 AGENTS.md [注意事项](AGENTS.md#notes)
          → 查阅 docs/architecture.md
          → 仍然不懂 → 询问 AI
   ```

2. **提问时提供上下文**
   ```
   ✅ "我在实现玩家管理页面时，路由配置不生效，
       已查阅 [路由配置](docs/architecture.md#routes)，
       这是我的配置：[代码]"
   
   ❌ "路由怎么配置？"
   ```

3. **遵循文档驱动开发**
   ```
   阅读文档 → 设计方案 → 编写代码 → 更新文档
   ```

4. **使用提问模板**
   ```
   背景 + 已查阅文档 + 具体问题 + 期望答案
   ```

### 避免做法

1. ❌ 不查阅文档直接提问
2. ❌ 问题太宽泛
3. ❌ 不提供错误信息
4. ❌ 不说明已尝试的方法

---

## 🔗 完整文档列表

- [`AGENTS.md`](AGENTS.md) - 快速参考指南 (~800 行)
- [`docs/architecture.md`](docs/architecture.md) - 架构设计 (~450 行)
- [`docs/components.md`](docs/components.md) - 组件文档 (~600 行)
- [`docs/api.md`](docs/api.md) - API 文档 (~300 行)
- [`docs/changelog.md`](docs/changelog.md) - 更新日志 (~250 行)
- [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) - 文档维护规范 (~400 行)
- [`docs/GUIDE.md`](docs/GUIDE.md) - 文档使用指南 ⭐ (本文档)

---

**记住**: 文档是你的朋友，越用越熟悉！

**相关资源**:
- 完整使用指南：[`docs/GUIDE.md`](docs/GUIDE.md)
- 文档维护规范：[`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)

**维护者**: WeCraft! Launcher 开发团队  
**最后更新**: 2026-05-27
