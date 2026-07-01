# Docker Sandbox Notes

CloudAgent inherits Docker sandbox support from upstream CloudCLI. These notes are
kept as reference for future CloudAgent sandbox work.

The published sandbox templates and npm commands still belong to upstream CloudCLI:

- npm package: `@cloudcli-ai/cloudcli`
- command: `cloudcli`
- templates:
  - `docker.io/cloudcliai/sandbox:claude-code`
  - `docker.io/cloudcliai/sandbox:codex`
  - `docker.io/cloudcliai/sandbox:gemini`

CloudAgent does not currently publish separate Docker sandbox images from this
repository. If you use the commands below, you are using upstream CloudCLI images
and then applying CloudAgent changes separately.

## Upstream Sandbox Quick Start

Install Docker's `sbx` CLI:

```bash
# macOS
brew install docker/tap/sbx

# Windows
winget install -h Docker.sbx

# Linux
sudo apt-get install docker-sbx
```

Store the provider secret:

```bash
sbx login
sbx secret set -g anthropic
```

Launch the upstream Claude Code sandbox:

```bash
npx @cloudcli-ai/cloudcli@latest sandbox ~/my-project
```

Open:

```text
http://localhost:3001
```

## Different Agents

```bash
# OpenAI Codex
sbx secret set -g openai
npx @cloudcli-ai/cloudcli@latest sandbox ~/my-project --agent codex

# Gemini CLI
sbx secret set -g google
npx @cloudcli-ai/cloudcli@latest sandbox ~/my-project --agent gemini
```

## CloudAgent Image Work

To make this first-class for CloudAgent, create and publish CloudAgent-specific
images, then update:

- `server/cli.js` sandbox template names
- README commands
- release/build automation
- Docker Hub or registry documentation

Until that is done, treat this folder as upstream-compatible reference material,
not as a finished CloudAgent distribution channel.
