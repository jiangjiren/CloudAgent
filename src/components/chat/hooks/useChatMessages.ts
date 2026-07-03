/**
 * Message normalization utilities.
 * Converts NormalizedMessage[] from the session store into ChatMessage[] for the UI.
 */

import type { NormalizedMessage } from '../../../stores/useSessionStore';
import type { ChatImage, ChatMessage, SubagentChildTool } from '../types/types';
import { shouldHideToolResult } from '../tools/configs/toolConfigs';
import { decodeHtmlEntities, unescapeWithMathProtection, formatUsageLimitText } from '../utils/chatFormatting';

const MAX_RENDERED_TOOL_RESULT_CHARS = 50000;

type ToolResultForRender = {
  content?: unknown;
  isError?: boolean;
  toolUseResult?: unknown;
};

function formatToolResultContent(content: unknown): string {
  const serialized = typeof content === 'string' ? content : JSON.stringify(content);
  const text = typeof serialized === 'string' ? serialized : String(content ?? '');
  const toolUseErrorMatch = /^<tool_use_error>([\s\S]*)<\/tool_use_error>$/.exec(text.trim());
  return toolUseErrorMatch ? toolUseErrorMatch[1] : text;
}

function measureToolResultContent(content: unknown): number {
  if (typeof content === 'string') {
    return content.length;
  }

  try {
    const serialized = JSON.stringify(content);
    return typeof serialized === 'string' ? serialized.length : 0;
  } catch {
    return String(content ?? '').length;
  }
}

function buildToolResultForRender(toolName: string, rawToolResult: ToolResultForRender): ChatMessage['toolResult'] {
  const isError = Boolean(rawToolResult.isError);
  const rawContent = rawToolResult.content;
  const toolUseResult = rawToolResult.toolUseResult;
  const rawResult = {
    content: rawContent,
    isError,
    toolUseResult,
  };

  if (!isError && shouldHideToolResult(toolName, rawResult)) {
    return { content: '', isError: false };
  }

  const contentLength = measureToolResultContent(rawContent);
  if (!isError && contentLength > MAX_RENDERED_TOOL_RESULT_CHARS) {
    return {
      content: `[Tool result omitted from initial render: ${contentLength} characters]`,
      isError: false,
    };
  }

  return {
    content: formatToolResultContent(rawContent),
    isError,
    toolUseResult,
  };
}

function normalizeMessageImages(images: NormalizedMessage['images']): ChatImage[] | undefined {
  if (!Array.isArray(images) || images.length === 0) {
    return undefined;
  }

  const normalized = images
    .map((image, index): ChatImage | null => {
      if (typeof image === 'string') {
        return { data: image, name: `image-${index + 1}` };
      }

      if (!image || typeof image !== 'object' || typeof image.data !== 'string') {
        return null;
      }

      return {
        data: image.data,
        name: typeof image.name === 'string' && image.name ? image.name : `image-${index + 1}`,
      };
    })
    .filter((image): image is ChatImage => Boolean(image));

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Convert NormalizedMessage[] from the session store into ChatMessage[]
 * that the existing UI components expect.
 *
 * Truly internal/system content is already filtered server-side. Some Claude
 * transcript artifacts such as local slash commands and compact summaries are
 * intentionally preserved and annotated so they can render like normal chat.
 */
export function normalizedToChatMessages(messages: NormalizedMessage[]): ChatMessage[] {
  const converted: ChatMessage[] = [];

  // First pass: collect tool results for attachment
  const toolResultMap = new Map<string, NormalizedMessage>();
  const toolUseIds = new Set<string>();
  for (const msg of messages) {
    if (msg.kind === 'tool_use' && msg.toolId) {
      toolUseIds.add(msg.toolId);
    }

    if (msg.kind === 'tool_result' && msg.toolId) {
      toolResultMap.set(msg.toolId, msg);
    }
  }

  for (const msg of messages) {
    const sharedMetadata = {
      displayText: msg.displayText,
      commandName: msg.commandName,
      commandMessage: msg.commandMessage,
      commandArgs: msg.commandArgs,
      isLocalCommand: msg.isLocalCommand,
      isLocalCommandStdout: msg.isLocalCommandStdout,
      isCompactSummary: msg.isCompactSummary,
    };

    switch (msg.kind) {
      case 'text': {
        const content = msg.content || '';
        if (!content.trim()) continue;

        if (msg.role === 'user') {
          const images = normalizeMessageImages(msg.images);
          // Parse task notifications
          const taskNotifRegex = /<task-notification>\s*<task-id>[^<]*<\/task-id>\s*<output-file>[^<]*<\/output-file>\s*<status>([^<]*)<\/status>\s*<summary>([^<]*)<\/summary>\s*<\/task-notification>/g;
          const taskNotifMatch = taskNotifRegex.exec(content);
          if (taskNotifMatch) {
            converted.push({
              type: 'assistant',
              content: taskNotifMatch[2]?.trim() || 'Background task finished',
              timestamp: msg.timestamp,
              isTaskNotification: true,
              taskStatus: taskNotifMatch[1]?.trim() || 'completed',
              ...sharedMetadata,
            });
          } else {
            converted.push({
              type: 'user',
              content: unescapeWithMathProtection(decodeHtmlEntities(content)),
              timestamp: msg.timestamp,
              images,
              ...sharedMetadata,
            });
          }
        } else {
          let text = decodeHtmlEntities(content);
          text = unescapeWithMathProtection(text);
          text = formatUsageLimitText(text);
          converted.push({
            type: 'assistant',
            content: text,
            timestamp: msg.timestamp,
            ...sharedMetadata,
          });
        }
        break;
      }

      case 'tool_use': {
        const tr = msg.toolResult || (msg.toolId ? toolResultMap.get(msg.toolId) : null);
        const isSubagentContainer = msg.toolName === 'Task';

        // Build child tools from subagentTools
        const childTools: SubagentChildTool[] = [];
        if (isSubagentContainer && msg.subagentTools && Array.isArray(msg.subagentTools)) {
          for (const tool of msg.subagentTools as any[]) {
            childTools.push({
              toolId: tool.toolId,
              toolName: tool.toolName,
              toolInput: tool.toolInput,
              toolResult: tool.toolResult || null,
              timestamp: new Date(tool.timestamp || Date.now()),
            });
          }
        }

        const toolResult = tr
          ? buildToolResultForRender(msg.toolName || 'UnknownTool', tr)
          : null;

        converted.push({
          type: 'assistant',
          content: '',
          timestamp: msg.timestamp,
          isToolUse: true,
          toolName: msg.toolName,
          toolInput: typeof msg.toolInput === 'string' ? msg.toolInput : JSON.stringify(msg.toolInput ?? '', null, 2),
          toolId: msg.toolId,
          toolResult,
          isSubagentContainer,
          subagentState: isSubagentContainer
            ? {
                childTools,
                currentToolIndex: childTools.length > 0 ? childTools.length - 1 : -1,
                isComplete: Boolean(toolResult),
              }
            : undefined,
          ...sharedMetadata,
        });
        break;
      }

      case 'thinking':
        if (msg.content?.trim()) {
          converted.push({
            type: 'assistant',
            content: unescapeWithMathProtection(msg.content),
            timestamp: msg.timestamp,
            isThinking: true,
            ...sharedMetadata,
          });
        }
        break;

      case 'error':
        converted.push({
          type: 'error',
          content: msg.content || 'Unknown error',
          timestamp: msg.timestamp,
          ...sharedMetadata,
        });
        break;

      case 'interactive_prompt':
        converted.push({
          type: 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp,
          isInteractivePrompt: true,
          ...sharedMetadata,
        });
        break;

      case 'task_notification':
        converted.push({
          type: 'assistant',
          content: msg.summary || 'Background task update',
          timestamp: msg.timestamp,
          isTaskNotification: true,
          taskStatus: msg.status || 'completed',
          ...sharedMetadata,
        });
        break;

      case 'stream_delta':
        if (msg.content) {
          converted.push({
            type: 'assistant',
            content: msg.content,
            timestamp: msg.timestamp,
            isStreaming: true,
            ...sharedMetadata,
          });
        }
        break;

      // stream_end, complete, status, permission_*, session_created
      // are control events — not rendered as messages
      case 'stream_end':
      case 'complete':
      case 'status':
      case 'permission_request':
      case 'permission_cancelled':
      case 'session_created':
        // Skip — these are handled by useChatRealtimeHandlers
        break;

      // tool_result is handled via attachment to tool_use above
      case 'tool_result': {
        if (msg.toolId && toolUseIds.has(msg.toolId)) {
          break;
        }

        const content = formatToolResultContent(msg.content || '');
        if (!content.trim()) {
          break;
        }

        converted.push({
          type: msg.isError ? 'error' : 'assistant',
          content,
          timestamp: msg.timestamp,
          toolId: msg.toolId,
          ...sharedMetadata,
        });
        break;
      }

      default:
        break;
    }
  }

  return converted;
}
