# 版本号管理脚本使用指南

> **脚本位置**: `scripts/bump-version.js`  
> **配置文件**: `package.json`, `src-tauri/tauri.conf.json`

---

## 📋 版本格式

遵循 **SemVer 2.0.0** 规范：

```
主版本号.次版本号.补丁版本号 - 预发布阶段.序号
例如：0.1.0-alpha.1
```

| 阶段 | 版本后缀 | 含义 | 发布频率 |
|------|---------|------|---------|
| 早期开发版 | `-alpha.x` | 功能不完整，随时可能有破坏性变更 | 每天/每周 |
| 测试版 | `-beta.x` | 主要功能完成，可能还有 bug | 每周/每两周 |
| 发布候选版 | `-rc.x` | 功能冻结，只修复 bug | 每两周 |
| 正式版 | 无后缀 | 稳定可用 | 每月/每季度 |

---

## 🚀 快速使用

### 基本命令

```bash
# 预览（不修改文件）
pnpm version:check

# 预发布版本递增（最常用）
pnpm version:prerelease          # alpha.1 → alpha.2

# 切换到 beta
pnpm version:beta                # alpha.x → beta.0

# 切换到 rc
pnpm version:rc                  # beta.x → rc.0

# 发布正式版
pnpm version:patch               # rc.x → 0.1.1
pnpm version:minor               # 0.1.x → 0.2.0
pnpm version:major               # 0.x.x → 1.0.0
```

### 所有可用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `pnpm version:reset` | **硬重置**到 `0.1.0-alpha.1` | 早期开发阶段使用 |
| `pnpm version:prerelease` | 递增预发布版本号 | `0.1.0-alpha.1` → `0.1.0-alpha.2` |
| `pnpm version:beta` | 切换到 beta 阶段 | `0.1.0-alpha.5` → `0.1.0-beta.0` |
| `pnpm version:rc` | 切换到 rc 阶段 | `0.1.0-beta.3` → `0.1.0-rc.0` |
| `pnpm version:patch` | 补丁版本（正式版） | `0.1.0` → `0.1.1` |
| `pnpm version:minor` | 次版本（新功能） | `0.1.0` → `0.2.0` |
| `pnpm version:major` | 主版本（重大变更） | `0.2.0` → `1.0.0` |
| `pnpm version:prepatch` | 补丁 + 预发布 | `0.1.0` → `0.1.1-alpha.0` |
| `pnpm version:preminor` | 次版本 + 预发布 | `0.1.0` → `0.2.0-alpha.0` |
| `pnpm version:premajor` | 主版本 + 预发布 | `0.1.0` → `1.0.0-alpha.0` |
| `pnpm version:check` | 预览新版本号（不修改） | 所有类型 |

---

## 🛠️ 高级用法

### 直接运行脚本

```bash
# 基本用法
node scripts/bump-version.js <类型> [预发布阶段] [选项]

# 示例
node scripts/bump-version.js prerelease beta --dry-run
node scripts/bump-version.js preminor beta
node scripts/bump-version.js reset alpha --git
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--dry-run` | 预览模式，不修改文件 | `false` |
| `--git` | 创建 Git 提交和标签 | `false` |

### 示例

```bash
# 预览 beta 版本升级
node scripts/bump-version.js prerelease beta --dry-run

# 执行 preminor 升级并创建 Git 标签
node scripts/bump-version.js preminor beta --git

# 重置版本（需要确认）
node scripts/bump-version.js reset alpha
```

---

## 📝 发布流程示例

### 早期开发阶段（Alpha）

```bash
# 初始版本
pnpm version:reset                    # → 0.1.0-alpha.1

# 日常迭代（每天/每周）
pnpm version:prerelease               # → 0.1.0-alpha.2
pnpm version:prerelease               # → 0.1.0-alpha.3
# ...
```

### 功能稳定后（Beta）

```bash
# 切换到 beta
pnpm version:beta                     # → 0.1.0-beta.0

# 每周测试版本
pnpm version:prerelease               # → 0.1.0-beta.1
pnpm version:prerelease               # → 0.1.0-beta.2
```

### 准备发布（RC）

```bash
# 切换到 rc
pnpm version:rc                       # → 0.1.0-rc.0

# 修复 bug
pnpm version:prerelease               # → 0.1.0-rc.1
```

### 正式发布

```bash
# 发布正式版
pnpm version:patch                    # → 0.1.1
# 或
pnpm version:minor                    # → 0.2.0
```

---

## ⚠️ 注意事项

### 1. 版本降级保护

脚本会自动防止版本号降级：

```bash
# ❌ 错误：尝试降级
node scripts/bump-version.js reset alpha
# 如果当前版本是 0.2.0，会显示警告

# ✅ 正确：使用 --dry-run 先预览
node scripts/bump-version.js reset alpha --dry-run
```

### 2. Git 操作

**默认不执行 Git 操作**，需要显式添加 `--git` 参数：

```bash
# 不创建 Git 提交（默认）
node scripts/bump-version.js prerelease

# 创建 Git 提交和标签
node scripts/bump-version.js prerelease --git

# 推送远程
git push && git push --tags
```

### 3. 版本一致性

脚本会自动同步以下文件的版本号：
- `package.json`
- `src-tauri/tauri.conf.json`

如果两个文件版本号不一致，会显示警告。

---

## 🔍 常见问题

### Q: 为什么 `reset` 后版本号是 `0.1.0-alpha.1` 而不是 `0.1.0-alpha.0`？

A: 为了符合人类习惯，序号从 1 开始（而不是 0）。但对于 `preminor`/`premajor`/`prepatch` 等操作，序号从 0 开始，因为这是新开启的预发布系列。

### Q: 如何回退版本号？

A: 版本号不能回退（防止发布混乱）。如果需要重新开始，请使用 `reset` 命令，但会显示警告。

### Q: 可以自定义预发布阶段名称吗？

A: 可以，直接使用脚本运行：

```bash
node scripts/bump-version.js prerelease dev      # → 0.1.0-dev.0
node scripts/bump-version.js prerelease test     # → 0.1.0-test.0
```

### Q: 如何查看当前版本号？

A: 运行以下命令预览（不修改文件）：

```bash
pnpm version:check
```

---

## 📚 相关文档

- [SemVer 2.0.0 规范](https://semver.org/)
- [Tauri 配置文档](https://tauri.app/v1/api/config)
- [项目更新日志](docs/changelog.md)

---

**最后更新**: 2026-05-26  
**脚本版本**: 1.0.0（ES Modules 兼容）
