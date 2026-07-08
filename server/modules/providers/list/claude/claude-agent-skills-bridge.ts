import { createHash } from 'node:crypto';
import { mkdir, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { ProviderSkillSource } from '@/shared/types.js';
import {
  addUniqueProviderSkillSource,
  findProviderSkillMarkdownFiles,
  findTopmostGitRoot,
  readProviderSkillMarkdownDefinition,
} from '@/shared/utils.js';

const AGENTS_SKILLS_DIR = ['.agents', 'skills'] as const;

const getClaudeProjectSearchRoots = async (workspacePath: string): Promise<string[]> => {
  const repoRoot = await findTopmostGitRoot(workspacePath);
  const roots: string[] = [];
  const normalizedWorkspacePath = path.resolve(workspacePath);
  const normalizedRepoRoot = repoRoot ? path.resolve(repoRoot) : null;
  let currentPath = normalizedWorkspacePath;

  while (true) {
    roots.push(currentPath);
    if (!normalizedRepoRoot || currentPath === normalizedRepoRoot) {
      break;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  return roots;
};

export const getClaudeAgentSkillSources = async (
  workspacePath: string,
): Promise<ProviderSkillSource[]> => {
  const sources: ProviderSkillSource[] = [];
  const seenRootDirs = new Set<string>();

  for (const projectRoot of await getClaudeProjectSearchRoots(workspacePath)) {
    addUniqueProviderSkillSource(sources, seenRootDirs, {
      scope: 'project',
      rootDir: path.join(projectRoot, ...AGENTS_SKILLS_DIR),
      commandPrefix: '/',
    });
  }

  addUniqueProviderSkillSource(sources, seenRootDirs, {
    scope: 'user',
    rootDir: path.join(os.homedir(), ...AGENTS_SKILLS_DIR),
    commandPrefix: '/',
  });

  return sources;
};

const isSafeBridgeName = (name: string): boolean =>
  /^[A-Za-z0-9._-]+$/.test(name) && name !== '.' && name !== '..';

const getBridgeRoot = (workspacePath: string): string => {
  const ownerKey = typeof process.getuid === 'function'
    ? String(process.getuid())
    : os.userInfo().username.replace(/[^A-Za-z0-9._-]/g, '_');
  const key = createHash('sha256')
    .update(`${os.homedir()}\0${path.resolve(workspacePath)}`)
    .digest('hex')
    .slice(0, 24);

  return path.join(os.tmpdir(), `cloudcli-claude-agent-skills-${ownerKey}`, key);
};

/**
 * Claude Code only discovers skills from `.claude/skills` directories. To make
 * open Agent Skills installed under `.agents/skills` usable without mutating a
 * user's repository, build a temporary added directory with symlinks laid out as
 * `.claude/skills/<skill>/SKILL.md` and pass that directory to the SDK.
 */
export const prepareClaudeAgentSkillsBridge = async (
  workspacePath?: string,
): Promise<string | null> => {
  if (!workspacePath) {
    return null;
  }

  const sources = await getClaudeAgentSkillSources(workspacePath);
  const bridgeRoot = getBridgeRoot(workspacePath);
  const bridgeSkillsDir = path.join(bridgeRoot, '.claude', 'skills');

  await rm(bridgeRoot, { recursive: true, force: true });
  await mkdir(bridgeSkillsDir, { recursive: true });

  let linkedCount = 0;
  const linkedNames = new Set<string>();

  for (const source of sources) {
    const skillFiles = await findProviderSkillMarkdownFiles(source.rootDir);
    for (const skillPath of skillFiles) {
      try {
        const definition = await readProviderSkillMarkdownDefinition(skillPath);
        const skillName = definition.name.trim();
        if (!isSafeBridgeName(skillName) || linkedNames.has(skillName)) {
          continue;
        }

        await symlink(path.dirname(skillPath), path.join(bridgeSkillsDir, skillName), 'dir');
        linkedNames.add(skillName);
        linkedCount += 1;
      } catch {
        // A broken compatibility skill should not block the rest of the bridge.
      }
    }
  }

  if (linkedCount === 0) {
    await rm(bridgeRoot, { recursive: true, force: true });
    return null;
  }

  return bridgeRoot;
};
