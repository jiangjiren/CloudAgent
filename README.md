<div align="center">
  <img src="public/logo.svg" alt="CloudAgent" width="64" height="64">
  <h1>CloudAgent</h1>
  <p>
    A customized self-hosted web UI for Claude Code, Codex, Cursor CLI,
    Gemini CLI, and OpenCode.
    <br>
    Based on the open-source <a href="https://github.com/siteboon/claudecodeui">CloudCLI</a> project.
  </p>
</div>

<p align="center">
  <a href="https://github.com/jiangjiren/CloudAgent">Repository</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./docker/README.md">Docker notes</a>
</p>

---

## Project Status

CloudAgent is a customized fork of CloudCLI for private/self-hosted agent workflows.
The upstream package name and CLI command are still visible in parts of the codebase
(`@cloudcli-ai/cloudcli`, `cloudcli`) until the package is fully renamed.

This fork keeps the upstream AGPL license and attribution, but the README and product
direction are self-hosted first, and repository links point to this CloudAgent fork.

## What Has Changed From Upstream

- Updated Claude model selection for Claude Sonnet 5, including legacy `sonnet` alias handling.
- Refined the chat composer and model dropdown for multi-provider use.
- Improved Claude/Codex/Gemini/Cursor/OpenCode provider handling and session state.
- Redesigned sidebar project interactions:
  - empty projects only show "New Session"
  - collapsed projects hide all sessions
  - session counts are hidden
  - expand/collapse control is beside the project name
  - favorite actions live in the project menu
  - starred projects sort first and show a small status star
- Added/updated pending assistant and token usage display behavior.
- Kept core CloudCLI capabilities: chat, file editor, Git panel, shell terminal, MCP management, plugins, and session discovery.

## Features

- **Multi-agent chat**: Claude Code, Codex, Cursor CLI, Gemini CLI, and OpenCode.
- **Session management**: discover, resume, search, archive, and organize local sessions.
- **Model selection**: provider-aware model selection, including Claude Sonnet 5 entries.
- **File workspace**: browse, edit, preview, and save project files.
- **Git workspace**: inspect diffs, stage files, commit changes, and switch branches.
- **Integrated terminal**: browser terminal for project shell access.
- **MCP management**: configure provider MCP servers from the UI.
- **Plugin system**: inherited from CloudCLI for custom tabs and backend integrations.
- **Responsive layout**: desktop and mobile browser support.

## Requirements

- Node.js 22+
- npm
- Git
- At least one supported agent CLI/account, depending on what you want to use:
  - Claude Code CLI
  - Codex CLI / SDK configuration
  - Cursor CLI
  - Gemini CLI
  - OpenCode

## Run From Source

```bash
git clone git@github.com:jiangjiren/CloudAgent.git
cd CloudAgent
npm install
npm run build
npm run server
```

Open:

```text
http://localhost:3001
```

For local development with Vite hot reload:

```bash
npm run dev
```

## Common Commands

```bash
npm run build:client       # build frontend assets
npm run build:server       # build backend output
npm run build              # build frontend and backend
npm run server             # run built server
npm run typecheck          # TypeScript checks
npm run lint               # ESLint checks
```

## Runtime Data

CloudAgent still inherits CloudCLI's runtime paths unless renamed in code:

- App database: `~/.cloudcli/auth.db`
- Claude sessions: `~/.claude/projects`
- Claude config and MCP files: `~/.claude`, `.mcp.json`
- Other provider data: provider-native folders such as `~/.codex`, `~/.gemini`, `~/.cursor`, and OpenCode config paths.

Do not commit local databases, credentials, API keys, or provider auth files.

## Deployment Notes

This repository is source code. The customized CloudAgent build is not currently
published as a separate npm package. If you install `@cloudcli-ai/cloudcli` from npm,
you are installing the upstream CloudCLI package, not this fork.

For a server deployment, build this repository and run the generated server output.
If you copy built assets into a globally installed CloudCLI package, document that as
an environment-specific patch because it is not a clean package release.

## Git Workflow

The current fork remote can be configured with SSH:

```bash
git remote add cloudagent git@github.com:jiangjiren/CloudAgent.git
git push -u cloudagent main
```

On this server, the `cloudagent` remote may use the SSH alias `github-cloudagent`
from `/root/.ssh/config`.

## Docker Sandboxes

See [docker/README.md](docker/README.md). The sandbox templates are inherited from
upstream CloudCLI. They are useful as reference, but custom CloudAgent sandbox images
are not published from this repository by default.

## Upstream

CloudAgent is based on:

- Upstream project: <https://github.com/siteboon/claudecodeui>
- Upstream package: `@cloudcli-ai/cloudcli`
- Upstream product site: <https://cloudcli.ai>

Keep upstream attribution when redistributing this fork.

## License

GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later). See
[LICENSE](LICENSE).

If you modify and run this software as a network service, the AGPL requires that
corresponding source code be made available to users of that service.

## Acknowledgments

Built on the work of the CloudCLI contributors and the open-source ecosystem around:

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
