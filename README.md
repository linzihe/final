# The Allunity Order of Restructurers

众一重构者结社 - 一个神秘学社团管理系统

## 功能特性

- 🔐 **成员管理系统** - 四级等级制度，支持注册和认证
- 📚 **档案管理系统** - 支持文本和PDF文档，评论和点赞功能
- 🔍 **验证系统** - 通过成员ID查询身份状态
- 🌐 **多语言支持** - 英文、中文、西班牙文
- 🎨 **主题切换** - 深色/浅色模式
- ☁️ **云端数据库** - 使用 Supabase，数据跨设备同步

## 技术栈

- React 18 + TypeScript
- Vite
- Supabase (云端数据库)
- Tailwind CSS

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```
VITE_SUPABASE_URL=你的Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的Supabase anon public key
```

### 启动开发服务器

**方法一：使用启动脚本（推荐）**
- 双击 `启动项目.bat` 文件

**方法二：使用命令行**
```bash
npm run dev
```

## 部署

### 使用 Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 部署完成

### Supabase 配置

部署前需要在 Supabase 中：
1. 创建数据库表（members, articles, comments）
2. 配置 RLS 策略（允许公开访问）
3. 插入初始管理员数据

## 默认管理员账号

- ID: `AO-000-ALPHA` 或 `ADMIN`
- 密码: `cyk071129`

## 项目结构

```
├── index.html          # HTML 入口
├── index.tsx           # 主应用文件
├── types.ts            # TypeScript 类型定义
├── services/
│   ├── supabaseDb.ts  # Supabase 数据库服务
│   └── translations.ts # 多语言翻译
├── package.json        # 项目配置
├── vite.config.ts      # Vite 配置
└── vercel.json         # Vercel 部署配置
```

## 许可证

Private
