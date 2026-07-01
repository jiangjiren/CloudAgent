<div align="center">
  <img src="public/logo.svg" alt="CloudAgent" width="64" height="64">
  <h1>CloudAgent</h1>
  <p>
    一个基于开源 <a href="https://github.com/siteboon/claudecodeui">CloudCLI</a> 定制的自托管 AI 编程 Agent Web UI。
    <br>
    支持 Claude Code、Codex、Cursor CLI、Gemini CLI 和 OpenCode。
  </p>
</div>

<p align="center">
  <a href="https://github.com/jiangjiren/CloudAgent">项目仓库</a> ·
  <a href="./README.md">English</a> ·
  <a href="./docker/README.md">Docker 说明</a>
</p>

---

## 项目状态

CloudAgent 是基于 CloudCLI 的定制版本，目标是服务私有化、自托管的 Agent 开发工作流。
当前代码里仍然会看到上游包名和命令名，例如 `@cloudcli-ai/cloudcli`、`cloudcli`，
这些会在后续真正做包名迁移时再逐步替换。

这个 fork 保留上游 AGPL 许可证和来源致谢，但 README 已改成 CloudAgent 自托管项目说明，
仓库链接也指向当前 CloudAgent fork。

## 相比上游主要改动

- Claude 模型选择更新到 Claude Sonnet 5，并处理旧的 `sonnet` 别名。
- 调整聊天输入区和模型下拉选择，适配多 Provider 使用。
- 改进 Claude、Codex、Gemini、Cursor、OpenCode 的 Provider 和会话状态处理。
- 重新设计左侧项目侧边栏交互：
  - 空项目只显示“新建会话”
  - 项目收起后不再保留最近一条会话
  - 不显示会话数量
  - 展开/收起按钮移动到项目名称左侧
  - 收藏操作放入“更多”菜单
  - 收藏项目排序靠前，只用小星标表示状态
- 增加/调整助手等待态、Token 使用展示等聊天体验。
- 保留 CloudCLI 原有核心能力：聊天、文件编辑、Git 面板、终端、MCP 管理、插件系统和会话发现。

## 功能

- **多 Agent 聊天**：Claude Code、Codex、Cursor CLI、Gemini CLI、OpenCode。
- **会话管理**：发现、恢复、搜索、归档和整理本机会话。
- **模型选择**：按 Provider 选择模型，包含 Claude Sonnet 5。
- **文件工作区**：浏览、编辑、预览和保存项目文件。
- **Git 工作区**：查看 diff、暂存文件、提交变更、切换分支。
- **集成终端**：在浏览器里打开项目 Shell。
- **MCP 管理**：通过 UI 管理各 Provider 的 MCP Server。
- **插件系统**：继承 CloudCLI 的插件能力，可扩展自定义 Tab 和后端服务。
- **响应式布局**：支持桌面和移动浏览器。

## 环境要求

- Node.js 22+
- npm
- Git
- 至少配置一个你要使用的 Agent：
  - Claude Code CLI
  - Codex CLI / SDK 配置
  - Cursor CLI
  - Gemini CLI
  - OpenCode

## 从源码运行

```bash
git clone git@github.com:jiangjiren/CloudAgent.git
cd CloudAgent
npm install
npm run build
npm run server
```

打开：

```text
http://localhost:3001
```

开发模式：

```bash
npm run dev
```

## 常用命令

```bash
npm run build:client       # 构建前端
npm run build:server       # 构建后端
npm run build              # 构建前后端
npm run server             # 运行构建后的服务
npm run typecheck          # TypeScript 检查
npm run lint               # ESLint 检查
```

## 运行时数据

CloudAgent 目前仍继承 CloudCLI 的运行路径，除非后续在代码里做完整迁移：

- 应用数据库：`~/.cloudcli/auth.db`
- Claude 会话：`~/.claude/projects`
- Claude 配置和 MCP 文件：`~/.claude`、`.mcp.json`
- 其它 Provider 数据：`~/.codex`、`~/.gemini`、`~/.cursor`、OpenCode 配置路径等。

不要提交本地数据库、凭据、API key 或 Provider 登录文件。

## 部署说明

这个仓库目前是源码仓库，还没有作为独立 npm 包发布。
如果直接安装 `@cloudcli-ai/cloudcli`，安装到的是上游 CloudCLI，而不是这个 CloudAgent fork。

生产部署建议从本仓库构建并运行。若把构建产物复制到全局 CloudCLI 安装目录，
应把它视为当前服务器的临时补丁，而不是标准发布方式。

## Git 工作流

当前 fork 仓库：

```text
https://github.com/jiangjiren/CloudAgent
```

推荐使用 SSH remote：

```bash
git remote add cloudagent git@github.com:jiangjiren/CloudAgent.git
git push -u cloudagent main
```

这台服务器上可能已经配置了 `github-cloudagent` SSH 别名，对应 `/root/.ssh/config`。

## Docker 沙箱

见 [docker/README.md](docker/README.md)。沙箱模板继承自上游 CloudCLI，可作为参考。
本仓库默认没有发布独立的 CloudAgent Docker 沙箱镜像。

## 上游项目

CloudAgent 基于：

- 上游项目：<https://github.com/siteboon/claudecodeui>
- 上游包名：`@cloudcli-ai/cloudcli`
- 上游产品网站：<https://cloudcli.ai>

二次分发时请保留上游来源说明。

## 许可证

GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)。详见 [LICENSE](LICENSE)。

如果你修改本软件并以网络服务形式提供给用户，AGPL 要求向服务用户提供对应源代码。

## 致谢

CloudAgent 建立在 CloudCLI 贡献者和以下开源生态之上：

- Claude Code
- OpenAI Codex
- Cursor CLI
- Gemini CLI
- OpenCode
- React
- Vite
- Tailwind CSS
- CodeMirror
- TaskMaster AI
