# 📦 安装 Markdown 渲染依赖

## 需要安装的包

代码已经更新，现在需要安装以下依赖：

1. `react-markdown` - Markdown 渲染组件
2. `remark-gfm` - GitHub Flavored Markdown 支持

## 安装步骤

### 方法一：使用启动脚本（推荐）

1. **双击 `启动项目.bat` 文件**
2. 脚本会自动检测并安装新依赖

### 方法二：手动安装

在项目目录运行：
```bash
npm install
```

这会自动安装 `package.json` 中新增的依赖。

---

## ✅ 安装完成后

安装完成后，重新启动开发服务器：
- 如果使用启动脚本，重新双击 `启动项目.bat`
- 如果手动运行，执行 `npm run dev`

---

## 🎯 功能说明

安装完成后，当你发布文章时：
- **如果内容是 Markdown 格式**：会自动渲染为格式化的 HTML
- **如果是普通文本**：保持原样显示

支持的 Markdown 语法：
- ✅ 标题（# ## ###）
- ✅ 粗体（**text**）
- ✅ 斜体（*text*）
- ✅ 链接（[text](url)）
- ✅ 列表（- item 或 1. item）
- ✅ 代码块（```code```）
- ✅ 引用（> quote）
- ✅ 表格
- ✅ 更多 GitHub Flavored Markdown 语法

---

## 🧪 测试

安装完成后，尝试发布一篇包含 Markdown 的文章：

```markdown
# 这是标题

这是**粗体**和*斜体*文本。

- 列表项 1
- 列表项 2

[这是一个链接](https://example.com)
```

应该会正确渲染！

